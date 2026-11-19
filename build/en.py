"""Génère la version anglaise du site (dossier en/) à partir des pages françaises.
Les textes sont traduits avec content/en.json (français -> anglais) ; les liens et chemins sont recalculés.
Usage : node build/build.mjs && python3 build/en.py   (s'arrête si une phrase n'a pas de traduction)"""
import html, json, posixpath, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DICT = json.loads((ROOT / "content/en.json").read_text())
T = {k: v for k, v in DICT.items() if not k.startswith("_")}
PAGES = sorted(str(p.relative_to(ROOT)) for p in list(ROOT.glob("*.html")) + list(ROOT.glob("chambres/*.html")))
PAGESET = set(PAGES)
ATTRS = ("alt", "aria-label", "placeholder", "title", "data-label", "data-empty")
META = re.compile(r'(<meta (?:name="description"|property="og:(?:title|description)") content=")([^"]*)(")')
missing = {}

RULES = [
    (re.compile(r"^Agrandir la photo (\d+) sur (\d+)$"), lambda m: f"Enlarge photo {m[1]} of {m[2]}"),
    (re.compile(r"^Voir les (\d+) photos$"), lambda m: f"See all {m[1]} photos"),
    (re.compile(r"^Photos : (.+)$"), lambda m: f"Photos: {tr(m[1])}"),
    (re.compile(r"^(.+), photo (\d+)$"), lambda m: f"{tr(m[1])}, photo {m[2]}"),
    (re.compile(r"^(.+) ·$"), lambda m: f"{tr(m[1])} ·"),
    (re.compile(r"^(.+) \((\d) pers\.\)$"), lambda m: f"{tr(m[1])} ({m[2]} guests)" if m[2] != "1" else f"{tr(m[1])} (1 guest)"),
    (re.compile(r"^(.+), Auberge de l'Oumède$"), lambda m: f"{tr(m[1])}, Auberge de l'Oumède"),
    (re.compile(r"^(\d+) voyageurs$"), lambda m: f"{m[1]} guests"),
    (re.compile(r"^(\d+) pers\.$"), lambda m: f"{m[1]} guests"),
    (re.compile(r"^([\d,.]+) ?(m²|km|min|€)$"), lambda m: m[0].replace(",", ".")),
]


def tr(s, src=""):
    if s in T:
        return T[s]
    for rx, fn in RULES:
        m = rx.match(s)
        if m:
            return fn(m)
    if len(s) > 100:  # description coupée pour la balise meta
        for k, v in T.items():
            if k.startswith(s):
                cut = v[:155]
                return cut[: cut.rfind(" ")] + "…" if len(v) > 155 else v
    if not re.search(r"[A-Za-zÀ-ÿ]{2,}", s) or s.startswith(("@", "http")) or re.fullmatch(r"[\w.+-]+@[\w.-]+", s):
        return re.sub(r"(\d),(\d)", r"\1.\2", s)
    missing.setdefault(s, src)
    return s


def tr_text(seg, src):
    core = " ".join(seg.split())
    if not core:
        return seg
    raw = html.unescape(core)
    out = tr(raw, src)
    if out == raw:
        return seg
    lead = seg[: len(seg) - len(seg.lstrip())]
    trail = seg[len(seg.rstrip()):]
    return lead + html.escape(out, quote=False) + trail


def tr_attrs(tag, src):
    def f(m):
        v = html.unescape(m[3])
        if not re.search(r"[A-Za-zÀ-ÿ]", v):
            return m[0]
        return f'{m[1]}{m[2]}="{html.escape(tr(v, src), quote=True)}"'
    return re.sub(r'(\s)(' + "|".join(ATTRS) + r')="([^"]*)"', f, tag)


def fix_url(u, page):
    if not u or u.startswith(("http:", "https:", "mailto:", "tel:", "#", "data:", "//")):
        return u
    m = re.match(r"([^#?]*)(.*)", u)
    path, rest = m[1], m[2]
    if path.startswith("/"):
        p = path.lstrip("/")
        if p.startswith("en/"):
            return "/" + p[3:] + rest
        return ("/en/" + p if (p in PAGESET or p == "") else path) + rest
    d = posixpath.dirname(page)
    target = posixpath.normpath(posixpath.join(d, path)) if path else page
    if target.startswith("en/"):  # lien de bascule de langue : retour au français
        tgt = target[3:]
        return posixpath.relpath(tgt, posixpath.join("en", d) if d else "en") + rest
    if target in PAGESET:
        target = "en/" + target
    newdir = posixpath.join("en", d) if d else "en"
    return posixpath.relpath(target, newdir) + rest


def rewrite_urls(tag, page):
    def f(m):
        name, val = m[1], m[2]
        if name == "srcset":
            parts = [p.strip().split(" ", 1) for p in val.split(",")]
            val = ", ".join(" ".join([fix_url(x[0], page)] + x[1:]) for x in parts)
        else:
            val = fix_url(val, page)
        return f' {name}="{val}"'
    return re.sub(r'\s(href|src|srcset|data-src|action)="([^"]*)"', f, tag)


def tr_json(o):
    if isinstance(o, dict):
        return {k: (tr_json(v) if k not in ("@type", "@context", "url", "image", "telephone", "email", "name", "@id", "item") else v) for k, v in o.items()}
    if isinstance(o, list):
        return [tr_json(x) for x in o]
    if isinstance(o, str):
        return T.get(o, o)
    return o


def convert(page):
    src = (ROOT / page).read_text()
    # bascule de langue
    src = re.sub(r'<a class="lang" data-switch href="([^"]*)" hreflang="en" lang="en" aria-label="English version">EN</a>',
                 r'<a class="lang" data-switch href="\1" hreflang="fr" lang="fr" aria-label="Version française">FR</a>', src)
    src = re.sub(r'<span class="langs"><span aria-current="true">Français</span> · <a data-switch href="([^"]*)" hreflang="en" lang="en">English</a></span>',
                 r'<span class="langs"><a data-switch href="\1" hreflang="fr" lang="fr">Français</a> · <span aria-current="true">English</span></span>', src)
    src = re.sub(r'<a class="drawer__lang" data-switch href="([^"]*)" hreflang="en" lang="en">English version</a>',
                 r'<a class="drawer__lang" data-switch href="\1" hreflang="fr" lang="fr">Version française</a>', src)
    src = src.replace('<html lang="fr">', '<html lang="en">').replace('content="fr_FR"', 'content="en_GB"')
    src = re.sub(r'<link rel="canonical" href="https://aubergedeloumede.com/', '<link rel="canonical" href="https://aubergedeloumede.com/en/', src)
    src = META.sub(lambda m: m[1] + html.escape(tr(html.unescape(m[2]), page), quote=True) + m[3], src)
    out, i, skip = [], 0, None
    for m in re.finditer(r"<!--.*?-->|<[^>]+>", src, re.S):
        text = src[i:m.start()]
        if skip == "ld":
            try:
                text = json.dumps(tr_json(json.loads(text)), ensure_ascii=False)
            except Exception:
                pass
        elif skip is None:
            text = tr_text(text, page)
        out.append(text)
        tag = m[0]
        low = tag.lower()
        if low.startswith("<script"):
            skip = "ld" if "ld+json" in low else "js"
        elif low.startswith("<style"):
            skip = "css"
        elif low.startswith(("</script", "</style")):
            skip = None
        if not tag.startswith(("<!--", "</")):
            tag = rewrite_urls(tr_attrs(tag, page), page)
        out.append(tag)
        i = m.end()
    out.append(src[i:])
    dst = ROOT / "en" / page
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text("".join(out))


for p in PAGES:
    convert(p)
# sitemap : ajoute les pages anglaises
sm = ROOT / "sitemap.xml"
if sm.exists():
    t = sm.read_text()
    locs = re.findall(r"<loc>https://aubergedeloumede.com/([^<]*)</loc>", t)
    add = "".join(f"  <url><loc>https://aubergedeloumede.com/en/{u}</loc></url>\n" for u in locs if not u.startswith("en/"))
    if "/en/" not in t:
        sm.write_text(t.replace("</urlset>", add + "</urlset>"))
if missing:
    print(f"{len(missing)} phrases sans traduction :")
    for k, v in list(missing.items()):
        print(f"  [{v}] {k}")
    sys.exit(1)
print(f"OK : {len(PAGES)} pages anglaises générées dans en/.")
