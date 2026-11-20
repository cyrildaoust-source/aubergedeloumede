"""Génère des variantes WebP légères (640 px de large) et un manifeste des dimensions pour chaque photo.
Usage : python3 build/images.py   (nécessite Pillow)"""
from pathlib import Path
from PIL import Image, ImageOps
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/photos"
OUT = ROOT / "assets/img"
n = 0
import json
man = {}
for f in sorted(SRC.rglob("*.jpg")) + sorted(SRC.rglob("*.jpeg")) + sorted(SRC.rglob("*.png")):
    rel = f.relative_to(SRC).with_suffix("")
    with Image.open(f) as _i:
        _i = ImageOps.exif_transpose(_i)
        man[str(f.relative_to(ROOT))] = [_i.width, _i.height]
    for w in (640,):
        o = OUT / f"{rel}-{w}.webp"
        if o.exists() and o.stat().st_mtime > f.stat().st_mtime:
            continue
        o.parent.mkdir(parents=True, exist_ok=True)
        im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        im.save(o, "WEBP", quality=74, method=6)
        n += 1
(OUT / "manifest.json").write_text(json.dumps(man, indent=0))
print(f"{n} variantes générées")
