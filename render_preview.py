from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "mockup-preview.png"

W, H = 1440, 1800
RED = (238, 27, 36)
BLUE = (13, 95, 158)
CYAN = (14, 165, 233)
NAVY = (7, 21, 35)
INK = (23, 32, 42)
MUTED = (101, 113, 129)
LINE = (231, 235, 240)
WHITE = (255, 255, 255)
SOFT = (245, 248, 251)


def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/tahomabd.ttf" if bold else "C:/Windows/Fonts/tahoma.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


F12 = font(12, True)
F14 = font(14, True)
F16 = font(16)
F18 = font(18)
F20B = font(20, True)
F24B = font(24, True)
F32B = font(32, True)
F46B = font(46, True)


def text(draw, xy, value, fnt, fill, anchor=None):
    draw.text(xy, value, font=fnt, fill=fill, anchor=anchor)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def camera_icon(draw, x, y, scale=1, fill=RED):
    pts = [
        (x, y + 10 * scale),
        (x + 30 * scale, y + 4 * scale),
        (x + 42 * scale, y + 8 * scale),
        (x + 42 * scale, y + 22 * scale),
        (x + 30 * scale, y + 26 * scale),
        (x, y + 20 * scale),
    ]
    draw.line(pts + [pts[0]], fill=fill, width=max(2, int(2 * scale)))
    draw.ellipse((x + 24 * scale, y + 11 * scale, x + 34 * scale, y + 21 * scale), outline=fill, width=max(2, int(2 * scale)))
    draw.line((x + 13 * scale, y + 22 * scale, x + 9 * scale, y + 38 * scale), fill=fill, width=max(2, int(2 * scale)))
    draw.line((x + 19 * scale, y + 23 * scale, x + 26 * scale, y + 38 * scale), fill=fill, width=max(2, int(2 * scale)))
    draw.line((x + 5 * scale, y + 38 * scale, x + 31 * scale, y + 38 * scale), fill=fill, width=max(2, int(2 * scale)))


def small_icon(draw, x, y, kind):
    if kind == "camera":
        camera_icon(draw, x + 4, y + 4, .72)
        return
    rounded(draw, (x, y, x + 44, y + 44), 12, (255, 240, 241))
    if kind == "access":
        draw.rectangle((x + 13, y + 9, x + 28, y + 35), outline=RED, width=2)
        draw.line((x + 28, y + 17, x + 35, y + 17), fill=RED, width=2)
    elif kind == "alarm":
        draw.polygon([(x + 22, y + 7), (x + 36, y + 15), (x + 32, y + 35), (x + 22, y + 39), (x + 10, y + 35), (x + 7, y + 15)], outline=RED)
        draw.line((x + 15, y + 23, x + 21, y + 29, x + 31, y + 16), fill=RED, width=2)
    else:
        draw.ellipse((x + 18, y + 7, x + 26, y + 15), outline=RED, width=2)
        draw.ellipse((x + 7, y + 29, x + 15, y + 37), outline=RED, width=2)
        draw.ellipse((x + 29, y + 29, x + 37, y + 37), outline=RED, width=2)
        draw.line((x + 22, y + 15, x + 11, y + 29), fill=RED, width=2)
        draw.line((x + 22, y + 15, x + 33, y + 29), fill=RED, width=2)


img = Image.new("RGB", (W, H), WHITE)
draw = ImageDraw.Draw(img)

hero = Image.open(ROOT / "assets" / "main00.png").convert("RGB")
hero = hero.resize((W, 720))
overlay = Image.new("RGBA", (W, 720), (7, 13, 22, 118))
left = Image.new("RGBA", (W, 720), (0, 0, 0, 0))
ld = ImageDraw.Draw(left)
for x in range(W):
    alpha = int(170 * (1 - x / W))
    ld.line((x, 0, x, 720), fill=(7, 13, 22, alpha))
hero = Image.alpha_composite(hero.convert("RGBA"), overlay)
hero = Image.alpha_composite(hero, left).convert("RGB")
img.paste(hero, (0, 0))

rounded(draw, (160, 24, 1280, 96), 16, (255, 255, 255), None)
logo = Image.open(ROOT / "assets" / "IPMLOGO.png").convert("RGBA")
logo.thumbnail((130, 54))
img.paste(logo, (188, 36), logo)
for i, label in enumerate(["ระบบ", "บริการของเรา", "ผลิตภัณฑ์", "ข่าวสาร", "ติดต่อเรา"]):
    text(draw, (540 + i * 95, 52), label, F14, (47, 63, 82), "mm")
rounded(draw, (1128, 38, 1242, 82), 10, RED)
text(draw, (1185, 60), "ปรึกษาระบบ", F14, WHITE, "mm")

text(draw, (170, 210), "IPM Technovation Since 1995", F14, WHITE)
text(draw, (170, 270), "ยกระดับความปลอดภัยองค์กร", F46B, WHITE)
text(draw, (170, 326), "ด้วยระบบอัจฉริยะครบวงจร โดย IPM", F46B, WHITE)
text(draw, (170, 400), "ออกแบบ ติดตั้ง และดูแลระบบ CCTV, Access Control, Alarm และ Network", F18, (230, 238, 247))
text(draw, (170, 432), "ด้วยความเชี่ยวชาญกว่า 30 ปี", F18, (230, 238, 247))
rounded(draw, (170, 490, 315, 538), 10, RED)
text(draw, (242, 514), "ดูภาพรวมระบบ", F14, WHITE, "mm")
rounded(draw, (330, 490, 465, 538), 10, (255, 255, 255, 22), (255, 255, 255))
text(draw, (397, 514), "บริการของเรา", F14, WHITE, "mm")

rounded(draw, (1050, 160, 1320, 310), 16, (8, 19, 33), (90, 126, 154))
text(draw, (1070, 184), "Status", F12, (210, 226, 238))
text(draw, (1250, 184), "Integrated Security", F14, WHITE, "mm")
for i, label in enumerate(["CCTV Monitoring & AI", "Smart Access Control", "Intrusion & Fire Alarm", "Secure Enterprise Network"]):
    y = 214 + i * 34
    fill = (17, 82, 118) if i == 0 else (21, 38, 56)
    rounded(draw, (1070, y, 1300, y + 26), 10, fill)
    draw.ellipse((1080, y + 9, 1088, y + 17), fill=(74, 222, 128) if i != 2 else (250, 204, 21))
    text(draw, (1098, y + 5), label, F12, WHITE)

for i, (kind, title, sub) in enumerate([("camera", "CCTV", "Monitoring & AI"), ("access", "Access", "Smart Control"), ("network", "Network", "Infrastructure")]):
    x = 370 + i * 245
    rounded(draw, (x, 600, x + 220, 686), 16, (8, 19, 33), (90, 126, 154))
    small_icon(draw, x + 18, 620, kind)
    text(draw, (x + 76, 623), title, F20B, WHITE)
    text(draw, (x + 76, 652), sub, F14, (188, 205, 220))

draw.rectangle((0, 720, W, H), fill=WHITE)
text(draw, (W // 2, 790), "Integrated Security Platform", F14, RED, "mm")
text(draw, (W // 2, 832), "เห็นภาพระบบก่อนอ่านรายละเอียด", F32B, INK, "mm")

rounded(draw, (120, 900, 1320, 1240), 24, (249, 251, 253), LINE)
draw.ellipse((570, 950, 810, 1190), fill=BLUE, outline=(122, 205, 255), width=2)
img.paste(logo, (650, 1034), logo)
text(draw, (690, 1100), "Monitoring", F16, (230, 240, 250), "mm")
text(draw, (690, 1130), "Control Center", F24B, WHITE, "mm")
nodes = [
    ("camera", "AI Video Surveillance", "กล้อง, DVMS, Thermal", 190, 930),
    ("access", "Smart Access Control", "FaceScan, Biometrics", 990, 940),
    ("alarm", "Incident Management", "Alarm & Fire", 230, 1120),
    ("network", "Unified Network", "Network Infrastructure", 960, 1120),
]
for kind, title, sub, x, y in nodes:
    rounded(draw, (x, y, x + 260, y + 118), 18, WHITE, LINE)
    small_icon(draw, x + 18, y + 18, kind)
    text(draw, (x + 72, y + 24), title, F18, INK)
    text(draw, (x + 72, y + 56), sub, F14, MUTED)

draw.rectangle((0, 1300, W, 1800), fill=SOFT)
text(draw, (120, 1368), "ผลิตภัณฑ์และระบบหลัก", F32B, INK)
chips = ["All Products", "IP Cameras", "DVMS", "Specialized Cameras", "Infrared & Lights", "Wireless Video", "Access Control", "Intrusion Alarm", "Fire Protection", "Network & IT"]
x = 120
y = 1430
for i, chip in enumerate(chips):
    width = 74 + len(chip) * 7
    if x + width > 1320:
        x = 120
        y += 58
    fill = (16, 183, 243) if i == 0 else WHITE
    outline = (56, 189, 248) if i == 0 else (205, 221, 234)
    color = WHITE if i == 0 else (38, 54, 72)
    rounded(draw, (x, y, x + width, y + 42), 21, fill, outline)
    text(draw, (x + width // 2, y + 21), chip, F12, color, "mm")
    x += width + 10

rounded(draw, (120, 1580, 600, 1730), 18, WHITE, LINE)
text(draw, (150, 1614), "Selected Category", F12, RED)
text(draw, (150, 1650), "All Products", F24B, INK)
text(draw, (150, 1690), "ภาพรวมสินค้าและระบบความปลอดภัยของ IPM", F16, MUTED)

for i, label in enumerate(["IP Network Camera", "DVMS Platform", "Access Control", "Alarm & Fire"]):
    x = 640 + (i % 2) * 290
    y = 1580 + (i // 2) * 84
    rounded(draw, (x, y, x + 260, y + 68), 16, WHITE, LINE)
    text(draw, (x + 20, y + 18), label, F16, INK)
    text(draw, (x + 20, y + 42), "Product group", F12, MUTED)

img.save(OUT)
print(OUT)
