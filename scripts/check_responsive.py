import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
css = (root / "styles.css").read_text(encoding="utf-8")
html = "\n".join((root / name).read_text(encoding="utf-8") for name in ("index.html", "en.html"))

required_viewports = [1920, 1366, 1024, 768, 390]
required_media = ["max-width: 980px", "max-width: 620px", "max-width: 430px"]

checks = {
    "viewportsCovered": required_viewports,
    "hasGlobalClip": "html {\n  scroll-behavior: smooth;\n  overflow-x: clip;" in css and "body {" in css and "overflow-x: clip;" in css,
    "hasResponsiveImages": "img,\nsvg,\nvideo,\niframe" in css and "max-width: 100%;" in css,
    "navWraps": re.search(r"\.nav-links\s*{[^}]*flex-wrap:\s*wrap", css, re.S) is not None,
    "filterWraps": re.search(r"\.filter-bar\s*{[^}]*flex-wrap:\s*wrap", css, re.S) is not None,
    "hasMobileOneColumnFilters": re.search(r"@media\s*\(max-width:\s*430px\)[\s\S]*?\.filter-chip\s*{[^}]*flex-basis:\s*100%", css) is not None,
    "heroMobileLeavesAbsoluteFlow": re.search(r"@media\s*\(max-width:\s*980px\)[\s\S]*?\.system-strip\s*{[^}]*position:\s*relative", css) is not None,
    "hasMinWidthGuards": css.count("min-width: 0;") >= 8,
    "hasBreakpoints": all(media in css for media in required_media),
    "noExplicitHorizontalScroll": "overflow-x: auto" not in css and "overflow-x: scroll" not in css,
    "hasViewportMeta": 'name="viewport"' in html,
}

print(json.dumps(checks, ensure_ascii=False, indent=2))

failed = [name for name, value in checks.items() if isinstance(value, bool) and not value]
if failed:
    print("Failed responsive checks: " + ", ".join(failed), file=sys.stderr)
    sys.exit(1)
