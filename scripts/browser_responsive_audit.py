import base64
import json
import os
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
PORT = 9337
VIEWPORTS = [1920, 1366, 1024, 768, 390]
PAGES = ["index.html", "en.html"]


def browser_path():
    if EDGE.exists():
        return EDGE
    if CHROME.exists():
        return CHROME
    raise RuntimeError("No Edge or Chrome executable found")


def read_json(url, timeout=8):
    end = time.time() + timeout
    while time.time() < end:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception:
            time.sleep(0.15)
    raise RuntimeError(f"Timed out waiting for {url}")


class WebSocket:
    def __init__(self, url):
        if not url.startswith("ws://"):
            raise ValueError(url)
        rest = url[5:]
        host_port, path = rest.split("/", 1)
        host, port = host_port.split(":")
        self.sock = socket.create_connection((host, int(port)), timeout=8)
        key = base64.b64encode(os.urandom(16)).decode("ascii")
        request = (
            f"GET /{path} HTTP/1.1\r\n"
            f"Host: {host_port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(request.encode("ascii"))
        response = b""
        while b"\r\n\r\n" not in response:
            response += self.sock.recv(4096)
        if b" 101 " not in response.splitlines()[0]:
            raise RuntimeError(response.decode("utf-8", "replace"))
        self.next_id = 1

    def send_raw(self, payload):
        data = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        header = bytearray([0x81])
        length = len(data)
        if length < 126:
            header.append(0x80 | length)
        elif length < 65536:
            header.append(0x80 | 126)
            header.extend(struct.pack("!H", length))
        else:
            header.append(0x80 | 127)
            header.extend(struct.pack("!Q", length))
        mask = os.urandom(4)
        header.extend(mask)
        masked = bytes(byte ^ mask[index % 4] for index, byte in enumerate(data))
        self.sock.sendall(bytes(header) + masked)

    def recv_raw(self):
        first = self.sock.recv(2)
        if not first:
            raise RuntimeError("WebSocket closed")
        opcode = first[0] & 0x0F
        length = first[1] & 0x7F
        if length == 126:
            length = struct.unpack("!H", self.sock.recv(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", self.sock.recv(8))[0]
        if first[1] & 0x80:
            mask = self.sock.recv(4)
        else:
            mask = None
        data = b""
        while len(data) < length:
            data += self.sock.recv(length - len(data))
        if mask:
            data = bytes(byte ^ mask[index % 4] for index, byte in enumerate(data))
        if opcode == 8:
            raise RuntimeError("WebSocket closed")
        if opcode == 9:
            return self.recv_raw()
        if opcode != 1:
            return self.recv_raw()
        return json.loads(data.decode("utf-8"))

    def call(self, method, params=None, session_id=None):
        message_id = self.next_id
        self.next_id += 1
        payload = {"id": message_id, "method": method}
        if params:
            payload["params"] = params
        if session_id:
            payload["sessionId"] = session_id
        self.send_raw(payload)
        while True:
            message = self.recv_raw()
            if message.get("id") == message_id:
                if "error" in message:
                    raise RuntimeError(message["error"])
                return message.get("result", {})


def file_url(path):
    return "file:///" + str(path).replace("\\", "/")


def audit_page(ws, session_id, page, width, capture_dir=None):
    height = 1300 if width <= 430 else 1200 if width <= 768 else 1100
    ws.call(
        "Emulation.setDeviceMetricsOverride",
        {"width": width, "height": height, "deviceScaleFactor": 1, "mobile": width <= 430},
        session_id,
    )
    ws.call("Page.navigate", {"url": file_url(ROOT / page)}, session_id)
    time.sleep(1.2)
    expression = r"""
(() => {
  const viewport = window.innerWidth;
  const documentWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body ? document.body.scrollWidth : 0
  );
  const offenders = Array.from(document.querySelectorAll("*"))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        className: String(element.className || "").slice(0, 80),
        text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      };
    })
    .filter((item) => item.right > viewport + 1 || item.left < -1)
    .slice(0, 12);
  return { viewport, documentWidth, hasOverflow: documentWidth > viewport + 1, offenders };
})()
"""
    result = ws.call("Runtime.evaluate", {"expression": expression, "returnByValue": True}, session_id)
    value = result["result"]["value"]
    if capture_dir:
        screenshot = ws.call(
            "Page.captureScreenshot",
            {"format": "png", "captureBeyondViewport": False},
            session_id,
        )
        capture_dir.mkdir(parents=True, exist_ok=True)
        target = capture_dir / f"{Path(page).stem}-{width}-cdp.png"
        target.write_bytes(base64.b64decode(screenshot["data"]))
        value["screenshot"] = str(target)
    return value


def main():
    capture_dir = ROOT / "qa-responsive" if "--screenshots" in sys.argv else None
    user_data_dir = tempfile.mkdtemp(prefix="ipm-responsive-")
    process = subprocess.Popen(
        [
            str(browser_path()),
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--remote-allow-origins=*",
            f"--remote-debugging-port={PORT}",
            f"--user-data-dir={user_data_dir}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        version = read_json(f"http://127.0.0.1:{PORT}/json/version")
        ws = WebSocket(version["webSocketDebuggerUrl"])
        target = ws.call("Target.createTarget", {"url": "about:blank"})
        attached = ws.call("Target.attachToTarget", {"targetId": target["targetId"], "flatten": True})
        session_id = attached["sessionId"]
        ws.call("Page.enable", session_id=session_id)
        report = {}
        failures = []
        for page in PAGES:
            report[page] = {}
            for width in VIEWPORTS:
                result = audit_page(ws, session_id, page, width, capture_dir)
                report[page][str(width)] = result
                if result["hasOverflow"]:
                    failures.append(f"{page}@{width}")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        if failures:
            print("Responsive overflow detected: " + ", ".join(failures), file=sys.stderr)
            return 1
        return 0
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    sys.exit(main())
