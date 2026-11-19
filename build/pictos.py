"""Prépare les pictogrammes de l'Auberge pour le site.

Source : assets/picto-source/oumede-NN-*.svg (dessins validés par Cyril, viewBox 64).
Sortie : assets/picto/<nom>.svg, allégés (coordonnées arrondies), couleur héritée
(currentColor) et regroupés sous <g id="p"> pour être appelés par <use href="…#p">.
Lancer : python3 build/pictos.py
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "picto-source")
OUT = os.path.join(ROOT, "assets", "picto")

# nom utilisé par le site -> numéro du pictogramme
NAMES = {
    "pool": 1, "sun": 2, "wave": 3, "parking": 4, "wifi": 5, "breakfast": 6, "coffee": 7, "garden": 8,
    "snow": 9, "tv": 10, "bed": 11, "towel": 12, "wind": 13, "soap": 14, "lock": 15, "fridge": 16,
    "telephone": 17, "kettle": 18, "kitchen": 19, "sofa": 20, "area": 21, "users": 22, "heart": 23, "vines": 24,
    "calendar": 25, "clock": 26, "card": 27, "child": 28, "paw": 29, "moon": 30, "party": 31, "pin": 32,
    "car": 33, "plane": 34, "train": 35, "fork": 36, "landmark": 37, "reviews": 38, "mas": 39, "etoile": 40,
    "grape": 41, "leaf": 42, "cigale": 43, "lavande": 44,
}

num = re.compile(r"-?\d+\.\d+")


def light(d):
    d = num.sub(lambda m: ("%.1f" % float(m.group())).rstrip("0").rstrip("."), d)
    d = re.sub(r"\s+", " ", d)
    d = re.sub(r" ?([MCLZHVSQTAmclzhvsqta]) ?", r"\1", d)
    d = d.replace(" -", "-")
    return d.strip()


files = {int(f.split("-")[1]): f for f in os.listdir(SRC) if re.match(r"oumede-\d\d-.*\.svg$", f)}
os.makedirs(OUT, exist_ok=True)
total = 0
for name, n in NAMES.items():
    src = open(os.path.join(SRC, files[n]), encoding="utf-8").read()
    paths = re.findall(r"<path\b([^>]*)/>", src)
    out = []
    for attrs in paths:
        d = re.search(r'\sd="([^"]+)"', attrs).group(1)
        rule = ' fill-rule="evenodd"' if 'evenodd' in attrs else ""
        out.append('<path%s d="%s"/>' % (rule, light(d)))
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g id="p" fill="currentColor">%s</g></svg>\n' % "".join(out)
    open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8").write(svg)
    total += len(svg)
print("pictos :", len(NAMES), "fichiers,", total // 1024, "Ko")
