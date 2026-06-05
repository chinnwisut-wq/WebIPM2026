import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
html_files = ["index.html", "en.html"]
html_text = "\n".join((root / name).read_text(encoding="utf-8") for name in html_files)
refs = [
    match.group(1)
    for match in re.finditer(r'(?:src|href)="([^"]+)"', html_text)
    if not match.group(1).startswith(("http", "#", "mailto", "tel"))
]
missing = [
    ref
    for ref in (item.split("?")[0] for item in refs)
    if not (root / ref).exists()
]

products = json.loads((root / "data" / "products.json").read_text(encoding="utf-8"))
products_en = json.loads((root / "data" / "products-en.json").read_text(encoding="utf-8"))
news = json.loads((root / "data" / "news.json").read_text(encoding="utf-8"))
news_en = json.loads((root / "data" / "news-en.json").read_text(encoding="utf-8"))

result = {
    "missingReferences": missing,
    "productCategories": len(products),
    "productCategoriesEn": len(products_en),
    "productItems": sum(len(product.get("items", [])) for product in products),
    "productItemsEn": sum(len(product.get("items", [])) for product in products_en),
    "newsItems": len(news.get("items", [])),
    "newsItemsEn": len(news_en.get("items", [])),
    "hasMailtoForm": "mailto:info@ipm.co.th" in (root / "scripts" / "main.js").read_text(encoding="utf-8"),
    "hasBlueActiveFilter": "#0d5f9e" in (root / "styles.css").read_text(encoding="utf-8"),
    "hasWideCctvIcon": "viewBox='0 0 32 24'" in (root / "styles.css").read_text(encoding="utf-8"),
    "hasThaiToEnglishLink": 'href="en.html"' in (root / "index.html").read_text(encoding="utf-8"),
    "hasEnglishToThaiLink": 'href="index.html"' in (root / "en.html").read_text(encoding="utf-8"),
    "hasEnglishHero": "Elevating Enterprise Security" in (root / "en.html").read_text(encoding="utf-8"),
}

print(json.dumps(result, ensure_ascii=False, indent=2))
if (
    missing
    or result["productCategories"] < 10
    or result["productCategoriesEn"] < 10
    or result["newsItems"] < 1
    or result["newsItemsEn"] < 1
    or not result["hasThaiToEnglishLink"]
    or not result["hasEnglishToThaiLink"]
    or not result["hasEnglishHero"]
):
    sys.exit(1)
