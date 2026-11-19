// Génère les pages HTML statiques du site à partir de content/*.json.
// Usage : node build/build.mjs   (aucune dépendance)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { icon, iconFor } from "./icons.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (n) => JSON.parse(fs.readFileSync(path.join(ROOT, "content", n + ".json"), "utf8"));
const site = read("site"), CH = read("chambres"), SV = read("services"), DC = read("decouvrir"),
  AV = read("avis"), IP = read("infos-pratiques"), TF = read("tarifs");
const ROOMS = CH.chambres;
const SITE_URL = "https://aubergedeloumede.com";
const BOOKING_URL = "https://www.booking.com/hotel/fr/auberge-de-l-oumede.fr.html";

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const photoPath = (f) => f.startsWith("assets/") ? f : "assets/photos/" + path.basename(f).replace(/-\d+x\d+(?=\.\w+$)/, "");
const exists = (f) => !!f && fs.existsSync(path.join(ROOT, photoPath(f)));
const MAN = fs.existsSync(path.join(ROOT, "assets/img/manifest.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "assets/img/manifest.json"), "utf8")) : {};
// Attributs src/srcset/width/height : variante WebP 640 px + original
const srcAttrs = (base, f, sizes = "100vw") => {
  const p = photoPath(f), dim = MAN[p];
  const small = p.replace(/^assets\/photos\//, "assets/img/").replace(/\.\w+$/, "-640.webp");
  const hasSmall = fs.existsSync(path.join(ROOT, small));
  if (!dim) return `src="${base}${p}"`;
  const [w, h] = dim;
  return hasSmall && w > 640
    ? `src="${base}${p}" srcset="${base}${small} 640w, ${base}${p} ${w}w" sizes="${sizes}" width="${w}" height="${h}"`
    : `src="${base}${p}" width="${w}" height="${h}"`;
};
const P = (n) => `assets/photos/booking/${n}.jpg`;
const PH = {
  hero: P("etablissement/piscine-868871279"), heroAlt: "La piscine de l'Auberge de l'Oumède, bordée d'oliviers",
  intro1: P("double-superieure/jardin-687908198"), intro2: P("etablissement/petit-dejeuner-687906421"),
  cta: P("etablissement/piscine-687907226"),
  estate: [P("etablissement/jardin-687907000"), P("etablissement/piscine-687907226"), P("etablissement/environs-891195858"), P("etablissement/plan-687906403"), P("etablissement/jardin-679286638")],
};
const rank = (f) => /\/chambre-/.test(f) ? 0 : /salon|divers/.test(f) ? 1 : /jardin|environs/.test(f) ? 2 : 3;
const roomPhotos = (r) => {
  const own = (r.photos || []).filter(exists).sort((a, b) => rank(a) - rank(b));
  const extra = own.length < 4 ? PH.estate.filter((x) => !own.includes(x)).slice(0, 5 - own.length) : [];
  return { list: [...own, ...extra], own: own.length, estate: extra.length };
};
// Couverture distincte pour chaque logement (évite deux cartes identiques)
const COVER = {}; { const used = new Set(); for (const r of ROOMS) { const l = roomPhotos(r).list; const c = l.find((x) => !used.has(x)) || l[0]; used.add(c); COVER[r.slug] = c; } }
const cover = (r) => COVER[r.slug];
const num = (n) => String(n).replace(".", ",");
const C = site.contact;
const TEL = C.telephone.replace(/\s/g, "");
const B = AV.booking;
const BOOKING_LABEL = `${num(B.note_globale)}/10 · ${B.mention}`;

// Image avec repli élégant si la photo n'est pas encore dans le dépôt
const img = (base, file, alt, { cls = "", eager = false, sizes = "", label = "", ico = "leaf" } = {}) => !file || !exists(file)
  ? `<div class="ph ph--empty ${cls}" role="img" aria-label="${esc(alt)}">${icon(ico, "icon--lg")}</div>`
  : `<div class="ph ${cls}" data-label="${esc(label || alt)}"><img ${srcAttrs(base, file, sizes || "(max-width:700px) 100vw, 50vw")} alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.classList.add('is-missing')"></div>`;

const GLOBAL_FROM = TF.a_partir_de_global;
const FROM_LABEL = GLOBAL_FROM ? `Dès ${GLOBAL_FROM} €` : "Tarif selon vos dates";
const priceOf = (slug) => TF.chambres?.[slug]?.a_partir_de ?? null;
const priceHtml = (slug, long = false) => {
  const p = priceOf(slug);
  return p
    ? `<span class="room__price">À partir de <b>${p} €</b> / nuit</span>`
    : `<span class="room__price">${long ? "Tarif selon vos dates" : "Tarif selon dates"}</span>`;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const viewOf = (r) => cap((r.caracteristiques.find((c) => /^Vue/i.test(c)) || r.caracteristiques.find((c) => /vue/i.test(c)) || "").replace(/^Terrasse privative avec /, ""));
const hasKitchen = (r) => r.equipements.find((e) => /Cuisine|Kitchenette/.test(e));
const shortName = (r) => r.nom.replace(/^Chambre (\d) – /, "Chambre $1 · ");

/* ------------------------------------------------------------------ */
/* Gabarit commun                                                     */
/* ------------------------------------------------------------------ */
const NAV = [
  ["chambres.html", "Chambres & suites", "chambres"],
  ["services.html", "Services", "services"],
  ["services.html#petit-dejeuner", "Petit-déjeuner", "petitdej"],
  ["ramatuelle.html", "Saint-Tropez & alentours", "ramatuelle"],
  ["contact.html", "Contact", "contact"],
];

const LOGO = (base) => `<a class="logo" href="${base}index.html" aria-label="Auberge de l'Oumède, Ramatuelle : accueil">
  <svg class="logo__sprig" viewBox="0 0 30 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M15 39C15 28 14 16 18 2"/><path d="M15.2 30c-4-1-7-4-8-8 4 .5 7 3.5 8 8Z" fill="currentColor" fill-opacity=".18"/><path d="M15.4 24c4-1.2 6.6-4.4 7.2-8.4-4 .8-6.6 4-7.2 8.4Z" fill="currentColor" fill-opacity=".18"/><path d="M15.8 17c-3.6-1.4-5.8-4.6-6-8.4 3.6 1.2 5.8 4.4 6 8.4Z" fill="currentColor" fill-opacity=".18"/><path d="M16.8 11c3.2-1.6 5-4.6 5-8-3.2 1.4-5 4.4-5 8Z" fill="currentColor" fill-opacity=".18"/><circle cx="9" cy="33.5" r="1.8" fill="currentColor" stroke="none"/></svg>
  <span class="logo__txt"><span class="logo__pre">Auberge de</span><span class="logo__name">l'Oumède</span><span class="logo__place">Ramatuelle</span></span>
</a>`;

// Ornements dessinés à la main : branche d'olivier horizontale et vrille de vigne.
const BRANCH = `<svg class="branch" viewBox="0 0 160 36" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22c22-3 46-6 76-4 26 2 48-1 74-8"/><path d="M22 20.5c-3-6-9-9-15-9 3 5 8 8.5 15 9Z" fill="currentColor" fill-opacity=".14"/><path d="M34 19.6c4-6 10-8.5 16-8-3.6 5-9 7.6-16 8Z" fill="currentColor" fill-opacity=".14"/><path d="M48 19c-2.4 5.6-7.4 9-13.6 9.6 2.6-5 7-8.4 13.6-9.6Z" fill="currentColor" fill-opacity=".14"/><path d="M64 18.4c-3.4-5.4-9-8-15-7.6 3.4 4.6 8.6 7.2 15 7.6Z" fill="currentColor" fill-opacity=".14"/><path d="M78 18.2c3.2 5 8.6 7.6 14.6 7.2-3.4-4.4-8.4-7-14.6-7.2Z" fill="currentColor" fill-opacity=".14"/><path d="M96 18.6c3.6-5.6 9.2-8.2 15.4-7.8-3.4 4.8-8.8 7.6-15.4 7.8Z" fill="currentColor" fill-opacity=".14"/><path d="M112 17.4c2.8 5.2 7.6 8.2 13.4 8.4-2.8-4.6-7.4-7.6-13.4-8.4Z" fill="currentColor" fill-opacity=".14"/><path d="M128 14.6c3-5.4 8-8.4 14-8.6-2.8 4.8-7.8 7.8-14 8.6Z" fill="currentColor" fill-opacity=".14"/><path d="M146 10.6c2-3.6 5.4-5.6 9.6-5.8"/><ellipse cx="57" cy="26.5" rx="2.6" ry="3.3" transform="rotate(-20 57 26.5)" fill="currentColor" stroke="none" opacity=".75"/><ellipse cx="104" cy="25.5" rx="2.4" ry="3.1" transform="rotate(15 104 25.5)" fill="currentColor" stroke="none" opacity=".75"/></svg>`;
const orn = (cls = "") => `<div class="orn${cls ? " " + cls : ""}" aria-hidden="true">${BRANCH}</div>`;
const VINE = `<svg class="vine" viewBox="0 0 220 220" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 210C60 170 90 120 120 70c14-24 34-42 60-52"/><path d="M120 70c-30-6-52 6-62 30 18 6 44 0 62-30Z"/><path d="M120 70c-4 26 6 46 30 56 4-22-8-44-30-56Z"/><path d="M78 132c-26-4-44 8-50 28 18 4 38-6 50-28Z"/><path d="M78 132c2 22 16 36 36 38 0-20-14-34-36-38Z"/><path d="M58 100c-8 0-14-6-14-14M150 126c6 6 6 14 0 20M180 18c10 0 18 8 18 18"/><g fill="currentColor" stroke="none" opacity=".55"><circle cx="138" cy="150" r="5"/><circle cx="148" cy="158" r="5"/><circle cx="134" cy="161" r="5"/><circle cx="144" cy="170" r="5"/><circle cx="154" cy="168" r="4.5"/><circle cx="140" cy="181" r="4.5"/><circle cx="150" cy="180" r="4"/></g></svg>`;

function layout({ title, desc, base = "", body, active = "", canonical = "", jsonld = null, mbar = "", ogImage = "" }) {
  const nav = NAV.filter((n) => n[2] !== "petitdej")
    .map(([h, l, k]) => `<a href="${base}${h}"${k === active ? ' aria-current="page"' : ""}>${l}</a>`).join("");
  const navM = NAV.map(([h, l]) => `<a href="${base}${h}">${l}</a>`).join("");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE_URL}/${canonical}">
<meta name="theme-color" content="#faf6ef">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${esc(site.nom)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE_URL}/${ogImage || PH.hero}">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${base}assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${base}assets/fonts/cormorant-garamond-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}assets/css/style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body${mbar ? ' class="has-mbar"' : ""}>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="header">
  <div class="wrap header__in">
    ${LOGO(base)}
    <nav class="nav" aria-label="Navigation principale">${nav}</nav>
    <a class="header__tel" href="tel:${TEL}">${icon("phone", "icon--sm")}<span>${C.telephone_affiche}</span></a>
    <a class="btn header__cta" href="${base}contact.html">Réserver</a>
    <button class="burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="drawer">${icon("menu")}</button>
  </div>
</header>
<div class="drawer" id="drawer">
  <div class="drawer__bg" data-close-drawer></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="drawer__top"><span class="brand__name">Menu</span><button class="iconbtn" type="button" data-close-drawer aria-label="Fermer le menu">${icon("close")}</button></div>
    <nav aria-label="Navigation mobile"><a href="${base}index.html">Accueil</a>${navM}</nav>
    <div class="drawer__contact">
      <a class="btn btn--block" href="${base}contact.html">Demander mes dates</a>
      <a class="btn btn--ghost btn--block" href="tel:${TEL}">${icon("phone", "icon--sm")} ${C.telephone_affiche}</a>
    </div>
  </div>
</div>
<main id="contenu">
${body}
</main>
${footer(base)}
${mbar}
<script src="${base}assets/js/main.js" defer></script>
</body>
</html>
`;
}

function footer(base) {
  return `<footer class="footer">
  <span class="footer__vine">${VINE}</span>
  <div class="wrap">
    <div class="footer__grid">
      <div>
        ${LOGO(base)}
        <p style="margin-top:18px;max-width:34ch">Sept chambres, studio et suites au cœur des vignes, à 1 km des plages de Pampelonne.</p>
        <div class="footer__social"><a href="${C.instagram}" aria-label="Instagram de l'Auberge" rel="noopener" target="_blank">${icon("instagram", "icon--sm")}</a><a href="mailto:${C.email}" aria-label="Écrire un e-mail">${icon("mail", "icon--sm")}</a></div>
      </div>
      <div>
        <h3>Séjourner</h3>
        <ul><li><a href="${base}chambres.html">Chambres & suites</a></li><li><a href="${base}services.html">Services</a></li><li><a href="${base}services.html#petit-dejeuner">Petit-déjeuner</a></li><li><a href="${base}index.html#bon-a-savoir">Bon à savoir</a></li></ul>
      </div>
      <div>
        <h3>Découvrir</h3>
        <ul><li><a href="${base}ramatuelle.html">Ramatuelle</a></li><li><a href="${base}ramatuelle.html#acces">Accès & distances</a></li><li><a href="${base}index.html#avis">Avis clients</a></li><li><a href="${base}mentions-legales.html">Mentions légales</a></li></ul>
      </div>
      <div>
        <h3>Nous contacter</h3>
        <ul>
          <li>${C.adresse}<br>${C.code_postal} ${C.ville}</li>
          <li><a href="tel:${TEL}">${C.telephone_affiche}</a></li>
          <li><a href="mailto:${C.email}">${C.email}</a></li>
          <li>Arrivée 16h–20h · Départ avant 11h</li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom"><span>${esc(site.pied_de_page)}</span><span>Français · <span title="Version anglaise en préparation">English soon</span></span></div>
  </div>
</footer>`;
}

const mobileBar = (base, { title = GLOBAL_FROM ? `${FROM_LABEL} / nuit` : "Tarif selon vos dates", href = "contact.html", cta = "Vérifier les dates" } = {}) =>
  `<div class="mbar" role="region" aria-label="Réservation rapide">
  <div class="mbar__txt"><strong>${title}</strong><span>${icon("star")} ${num(B.note_globale)} · ${B.nombre_avis} avis Booking</span></div>
  <a class="btn" href="${base}${href}">${cta}</a>
</div>`;

const roomOptions = (selected = "") =>
  `<option value="">Je souhaite être conseillé</option>` +
  ROOMS.map((r) => `<option value="${r.slug}"${r.slug === selected ? " selected" : ""}>${esc(r.nom)} (${r.personnes_max} pers.)</option>`).join("");

// Sélecteur de dates : un seul calendrier pour l'arrivée et le départ (assets/js/main.js > Calendrier).
const SEASON = { open: "05-01", close: "10-04" };
const dpAttrs = `data-dp data-open="${SEASON.open}" data-close="${SEASON.close}"`;
const dateBtn = (id, which, label, wrapCls = "") => `<div class="${wrapCls}"><span class="dp__lbl" id="${id}-l">${label}</span><button type="button" class="dp__btn" id="${id}" data-dp-open="${which}" aria-haspopup="dialog" aria-expanded="false" aria-labelledby="${id}-l ${id}-v"><span class="dp__val" id="${id}-v" data-dp-val="${which}">Ajouter une date</span></button></div>`;
const dateHidden = `<input type="hidden" name="arrivee"><input type="hidden" name="depart">`;

const guestOptions = (sel = 2, max = 4) =>
  Array.from({ length: max }, (_, i) => i + 1).map((n) => `<option value="${n}"${n === sel ? " selected" : ""}>${n} ${n > 1 ? "voyageurs" : "voyageur"}</option>`).join("");

/* ------------------------------------------------------------------ */
/* Blocs réutilisables                                                */
/* ------------------------------------------------------------------ */
const roomTags = (r) => [r.categorie === "Double" ? "chambre" : r.categorie.toLowerCase(), r.personnes_max >= 3 ? "famille" : "", hasKitchen(r) ? "cuisine" : ""].filter(Boolean).join(" ");
const roomCard = (r, base) => `<article class="room" data-cat="${r.categorie}" data-max="${r.personnes_max}" data-tags="${roomTags(r)}">
  <span class="room__tag">${r.categorie === "Double" ? "Chambre" : r.categorie} · ${r.surface_m2} m²</span>
  ${img(base, cover(r), `${r.nom}, Auberge de l'Oumède`, { cls: "room__media", sizes: "(max-width:620px) 82vw, 33vw" })}
  <h3><a href="${base}chambres/${r.slug}.html">${esc(shortName(r))}</a></h3>
  <div class="room__meta">
    <span>${icon("users", "icon--sm")} ${r.personnes_max} pers.</span>
    <span>${icon("bed", "icon--sm")} ${r.lits.map((l) => l.replace("Lit double ", "Lit ").replace("Canapé-lit convertible", "Canapé-lit").replace("Lit simple", "Lit")).join(" + ")}</span>
    ${hasKitchen(r) ? `<span>${icon("kitchen", "icon--sm")} ${hasKitchen(r)}</span>` : ""}
  </div>
  <div class="room__view">Terrasse privative · ${esc(viewOf(r).toLowerCase())}</div>
  <div class="room__foot">${priceHtml(r.slug)}<span class="room__more">Voir ${icon("arrow", "icon--sm")}</span></div>
</article>`;

const stars = (n = 5) => `<span class="stars" aria-label="${n} sur 5">${icon("star").repeat(n)}</span>`;

function reviewsBlock(base, { compact = false } = {}) {
  const sub = Object.entries(B.sous_notes);
  const quotes = [...AV.temoignages_affiches_sur_le_site, ...AV.autres_extraits_booking];
  const list = compact ? quotes.slice(0, 3) : quotes;
  const flag = (q) => q.pays ? ` · ${q.pays}` : "";
  return `<div class="reviews">
  <div class="score" role="group" aria-label="Note Booking.com">
    <div class="score__top"><span class="score__num">${num(B.note_globale)}</span><div class="score__label"><strong>${B.mention}</strong><span>${B.nombre_avis} avis vérifiés sur Booking.com</span></div></div>
    <ul class="bars">${sub.map(([k, v]) => `<li><span>${k}</span><b>${num(v)}</b><span class="bar" aria-hidden="true"><i style="width:${v * 10}%"></i></span></li>`).join("")}</ul>
    <p class="score__src">Note des couples : <b>${num(B.note_couples)}/10</b>. Notes relevées sur Booking.com le 18 novembre 2026. <a href="${BOOKING_URL}#tab-reviews" target="_blank" rel="noopener">Lire tous les avis</a></p>
  </div>
  <div class="quotes">
    ${list.map((q, i) => `<figure class="quote${i === 0 ? " quote--feature" : ""}">
      <blockquote${q.langue ? ` lang="${q.langue}"` : ""}>« ${esc(q.texte)} »</blockquote>
      <figcaption><span class="avatar" aria-hidden="true">${q.auteur[0]}</span><span><b>${q.auteur}</b><small>Avis ${q.source || "Booking"}${flag(q)}</small></span></figcaption>
    </figure>`).join("")}
  </div>
</div>`;
}

const KNOW = [
  ...(TF.saison ? [["calendar", "Ouverture", `Saison ${TF.saison}.`]] : []),
  ["clock", "Arrivée", "De 16h00 à 20h00. Aucune arrivée possible après 20h00 : prévenez-nous de votre heure d'arrivée."],
  ["clock", "Départ", "De 8h30 à 11h00."],
  ["card", "À l'arrivée", "Pièce d'identité avec photo et carte de crédit demandées."],
  ["child", "Enfants", "Bienvenus. Dès 2 ans, facturés au tarif adulte. Pas de lit d'appoint ni de lit bébé."],
  ["paw", "Animaux", "Les animaux de compagnie ne sont pas admis."],
  ["moon", "Calme", "Heures silencieuses de 23h00 à 7h00. Fêtes et événements non autorisés."],
];
const knowBlock = () => `<div class="know">${KNOW.map(([i, t, d]) => `<div class="know__i">${icon(i)}<div><strong>${t}</strong><p>${d}</p></div></div>`).join("")}</div>`;

const FAQ = [
  ...(GLOBAL_FROM ? [["Quels sont vos tarifs ?", `De ${GLOBAL_FROM} à ${num(TF.jusqu_a_global)} € la nuit selon la saison et le logement. L'Auberge est ouverte ${TF.saison}. Indiquez vos dates : nous vous répondons avec le tarif exact.`]] : []),
  ["Comment réserver en direct ?", `Indiquez vos dates dans le formulaire de demande ou appelez-nous au ${C.telephone_affiche}. Nous vous répondons personnellement avec la disponibilité et le tarif exact pour votre séjour.`],
  ["Le petit-déjeuner est-il inclus ?", `Non, il est proposé sur demande${TF.petit_dejeuner.prix_par_personne ? ` (${TF.petit_dejeuner.prix_par_personne} € par personne)` : ""}. Le petit-déjeuner continental se prend en terrasse, entre piscine et vignes.`],
  ["La piscine est-elle chauffée ?", "Oui, la piscine extérieure est chauffée à partir du mois de juin. Elle dispose d'un espace peu profond."],
  ["Y a-t-il un parking ?", "Oui, un parking privé gratuit est à votre disposition sur place. Une voiture est conseillée pour profiter des plages et des villages."],
  ["Les plages sont-elles accessibles facilement ?", "L'Auberge se trouve à environ 1 km des plages de Pampelonne, à 4 km du village de Ramatuelle et à 6 km de Saint-Tropez. Nous pouvons vous aider à réserver votre plage."],
  ["Quelles sont les conditions d'annulation ?", "Elles varient selon le logement et la période. Elles vous sont précisées avec notre réponse, avant toute confirmation."],
  ["Comment régler sur place ?", "Le règlement sur place se fait en espèces. Les autres modalités vous sont précisées lors de la réservation."],
];
const faqBlock = () => `<div class="faq">${FAQ.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`;
const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

// Option petit-déjeuner proposée au moment de réserver (total calculé selon nuits et voyageurs).
const BF_PRICE = TF.petit_dejeuner?.prix_par_personne || 0;
const breakfastOption = (base, id) => `<label class="upsell" for="${id}-pd">
  <input type="checkbox" id="${id}-pd" name="petitdej" value="1" data-bf="${BF_PRICE}">
  <span class="upsell__img">${exists(PH.intro2) ? `<img ${srcAttrs(base, PH.intro2, "96px")} alt="" loading="lazy" decoding="async">` : ""}</span>
  <span class="upsell__txt"><b>Ajouter le petit-déjeuner</b><span>En terrasse, entre piscine et vignes${BF_PRICE ? ` · ${BF_PRICE} € par personne et par jour` : ""}</span><span class="upsell__total" data-bf-total></span></span>
  <span class="upsell__box" aria-hidden="true">${icon("check", "icon--sm")}</span>
</label>`;

const ctaBand = (base) => `<section class="section section--tight"><div class="wrap">
  ${orn("orn--center")}
  <div class="cta">
    ${img(base, PH.cta, "", { label: " " })}
    <div><h2>Vos dates <em>sont libres ?</em></h2><p>Dites-nous quand vous venez : nous vous répondons personnellement avec la disponibilité et le tarif de chaque logement.</p></div>
    <div class="cta__actions">
      <a class="btn btn--light" href="${base}contact.html">Demander mes dates ${icon("arrow", "icon--sm")}</a>
      <a href="tel:${TEL}">${icon("phone", "icon--sm")} ${C.telephone_affiche}</a>
      <a href="mailto:${C.email}">${icon("mail", "icon--sm")} ${C.email}</a>
    </div>
  </div>
</div></section>`;

const lodgingLd = {
  "@context": "https://schema.org", "@type": "BedAndBreakfast", name: site.nom, description: "Hôtel de charme avec piscine chauffée à Ramatuelle, à 6 km de Saint-Tropez et 1 km de la plage de Pampelonne.", url: SITE_URL, alternateName: "Auberge de l'Oumède Saint-Tropez",
  telephone: C.telephone, email: C.email, image: `${SITE_URL}/${PH.hero}`,
  address: { "@type": "PostalAddress", streetAddress: C.adresse, postalCode: C.code_postal, addressLocality: C.ville, addressCountry: "FR" },
  checkinTime: "16:00", checkoutTime: "11:00", petsAllowed: false, numberOfRooms: ROOMS.length, sameAs: [C.instagram, BOOKING_URL],
  amenityFeature: SV.points_forts.map((p) => ({ "@type": "LocationFeatureSpecification", name: p, value: true })),
};

/* ------------------------------------------------------------------ */
/* Pages                                                              */
/* ------------------------------------------------------------------ */
function home() {
  const base = "";
  const body = `
<section class="hero" aria-labelledby="h-hero">
  <div class="hero__media"><img ${srcAttrs("", PH.hero, "100vw")} alt="${PH.heroAlt}" fetchpriority="high" decoding="async" onerror="this.classList.add('is-missing')"></div>
  <div class="wrap hero__in">
    <a class="score-pill hero__badges" href="#avis"><b>${num(B.note_globale)}</b><span>${B.mention} · ${B.nombre_avis} avis Booking</span></a>
    <h1 id="h-hero">Entre vignes et mer, <em>le calme absolu</em> à Ramatuelle</h1>
    <p class="hero__sub">Un hôtel de charme avec piscine chauffée, à 6 km de Saint-Tropez : sept chambres, studio et suites, chacun avec sa terrasse privative.</p>
    <form class="bookbar" action="contact.html" method="get" data-dates data-search ${dpAttrs} aria-label="Vérifier les disponibilités">
      ${dateHidden}
      ${dateBtn("h-a", "a", "Arrivée", "bookbar__f")}
      ${dateBtn("h-d", "d", "Départ", "bookbar__f")}
      <div class="bookbar__f"><label for="h-p">Voyageurs</label><select id="h-p" name="personnes">${guestOptions(2)}</select></div>
      <div class="bookbar__f bookbar__f--wide"><label for="h-c">Logement</label><select id="h-c" name="chambre"><option value="">Tous les logements</option>${ROOMS.map((r) => `<option value="${r.slug}">${esc(shortName(r))}</option>`).join("")}</select></div>
      <button class="btn" type="submit">${icon("calendar", "icon--sm")} Vérifier les dates</button>
    </form>
    <p class="bookbar__note">${icon("check", "icon--sm")} ${GLOBAL_FROM ? `Chambres dès ${GLOBAL_FROM} € la nuit · ` : ""}Réservation en direct · Réponse personnelle · Sans engagement</p>
  </div>
</section>

<section class="trust" aria-label="Points forts">
  <div class="wrap trust__in">
    <div class="trust__i"><span class="trust__ico">${icon("wave")}</span><div><strong>Plages à 1 km</strong><span>Pampelonne, 6 km de Saint-Tropez</span></div></div>
    <div class="trust__i"><span class="trust__ico">${icon("pool")}</span><div><strong>Piscine chauffée</strong><span>Dès juin, au milieu du jardin</span></div></div>
    <div class="trust__i"><span class="trust__ico">${icon("sun")}</span><div><strong>Terrasse privative</strong><span>Dans chaque logement</span></div></div>
    <div class="trust__i"><span class="trust__ico">${icon("parking")}</span><div><strong>Parking & Wi-Fi</strong><span>Gratuits sur place</span></div></div>
  </div>
</section>

<section class="section" aria-labelledby="h-intro">
  <div class="wrap split">
    <div>
      <h2 id="h-intro">${esc(site.presentation.titre)}</h2>
      ${orn("orn--left")}
      <p class="lead">${esc(site.presentation.texte)}</p>
      <div class="facts">
        <div><b>7</b><span>logements, de 25 à 57 m²</span></div>
        <div><b>1 km</b><span>des plages de Pampelonne</span></div>
        <div><b>${num(B.sous_notes["Situation géographique"])}</b><span>note de la situation</span></div>
      </div>
      <ul class="clean ideal" aria-label="Idéal pour">
        <li>${icon("heart")}<div><b>En amoureux</b><span>Note des couples ${num(B.note_couples)}/10 sur Booking, terrasse privée et calme absolu.</span></div></li>
        <li>${icon("users")}<div><b>En famille</b><span>Chambre triple et Suite de L'Oumède jusqu'à 4 personnes, piscine avec espace peu profond.</span></div></li>
        <li>${icon("kitchen")}<div><b>Longs séjours</b><span>Studio et suites avec cuisine équipée, parking gratuit sur place.</span></div></li>
      </ul>
      <a class="btn btn--ghost" href="chambres.html">Découvrir les logements ${icon("arrow", "icon--sm")}</a>
    </div>
    <div class="split__media">
      ${img(base, PH.intro1, "Terrasse privative ombragée, au milieu des oliviers", { cls: "ph--arch" })}
      ${img(base, PH.intro2, "Petit-déjeuner servi en terrasse", { cls: "ph--float ph--print" })}
    </div>
  </div>
</section>

<section class="section section--sand" id="chambres" aria-labelledby="h-rooms">
  <div class="wrap">
    <div class="section__head">
      <div><h2 id="h-rooms">Choisissez votre <em>logement</em></h2><p>Sept logements, tous avec terrasse privative, climatisation, Wi-Fi et accès à la piscine.</p></div>
    </div>
    <div class="filters filters--home">
      <div class="chips" role="group" aria-label="Filtrer les logements">
        <button class="chip" type="button" data-filter-tag="all" aria-pressed="true">Tous <span class="chip__n">${ROOMS.length}</span></button>
        <button class="chip" type="button" data-filter-tag="chambre" aria-pressed="false">Chambres doubles <span class="chip__n">${ROOMS.filter((r) => r.categorie === "Double").length}</span></button>
        <button class="chip" type="button" data-filter-tag="famille" aria-pressed="false">En famille, 3 à 4 pers. <span class="chip__n">${ROOMS.filter((r) => r.personnes_max >= 3).length}</span></button>
        <button class="chip" type="button" data-filter-tag="cuisine" aria-pressed="false">Avec cuisine <span class="chip__n">${ROOMS.filter(hasKitchen).length}</span></button>
      </div>
      <div class="rail__nav"><button class="iconbtn" type="button" data-rail="-1" aria-label="Logements précédents">${icon("arrow", "icon--sm flip")}</button><button class="iconbtn" type="button" data-rail="1" aria-label="Logements suivants">${icon("arrow", "icon--sm")}</button></div>
    </div>
    <div class="rooms rooms--rail" data-rooms>${ROOMS.map((r) => roomCard(r, base)).join("")}</div>
    <p class="rooms__more"><a class="link" href="chambres.html#comparatif">Comparer surfaces, lits et cuisine dans le tableau ${icon("arrow", "icon--sm")}</a></p>
  </div>
</section>

<section class="section" aria-labelledby="h-serv">
  <div class="wrap">
    <div class="section__head"><div><h2 id="h-serv">${esc(SV.sous_titre)}</h2></div><a class="link" href="services.html">Tous les services ${icon("arrow", "icon--sm")}</a></div>
    ${servicesGrid(base)}
  </div>
</section>

<section class="section section--sand" id="avis" aria-labelledby="h-avis">
  <div class="wrap">
    <div class="section__head"><div><h2 id="h-avis">Ils ont aimé le calme <em>et l'accueil</em></h2></div><a class="link" href="ramatuelle.html#acces">Voir la situation ${icon("arrow", "icon--sm")}</a></div>
    ${reviewsBlock(base, { compact: true })}
  </div>
</section>

<section class="section" aria-labelledby="h-loc">
  <div class="wrap">
    <div class="section__head"><div><h2 id="h-loc">Au calme, <em>tout près de tout</em></h2><p>${esc(site.situation.texte)}</p></div></div>
    ${locationBlock(base)}
  </div>
</section>

<section class="section section--sand" id="bon-a-savoir" aria-labelledby="h-know">
  <div class="wrap">
    <div class="section__head"><div><h2 id="h-know">Avant de <em>réserver</em></h2></div></div>
    ${knowBlock()}
    <h3 style="margin-top:56px">Questions fréquentes</h3>
    ${faqBlock()}
  </div>
</section>
${ctaBand(base)}`;
  return layout({ title: "Hôtel de charme avec piscine près de Saint-Tropez | Auberge de l'Oumède, Ramatuelle", desc: "Hôtel de charme au calme dans les vignes, à 6 km de Saint-Tropez et 1 km de la plage de Pampelonne : 7 chambres et suites avec terrasse, piscine chauffée, parking gratuit. Noté 8,9 sur Booking.", body, base, canonical: "", jsonld: [lodgingLd, faqLd], mbar: mobileBar(base) });
}

function servicesGrid(base) {
  return `<div class="services services--rows">${SV.services.map((s, i) => `<article class="service"${i === 0 ? ' id="petit-dejeuner-teaser"' : ""}>
    ${img(base, (s.photos || [s.photo])[0], s.titre, { ico: ["coffee", "pool", "leaf"][i], cls: i % 2 ? "ph--print" : "ph--arch" })}
    <div class="service__body">
      <h3>${esc(s.titre)}</h3>
      <p>${esc(s.texte)}</p>
      ${s.detail ? `<p class="service__detail">${icon("check", "icon--sm")} ${esc(s.detail)}</p>` : ""}
      ${i === 0 ? `<a class="link" href="${base}services.html#petit-dejeuner">Voir le petit-déjeuner ${icon("arrow", "icon--sm")}</a>` : ""}
    </div>
  </article>`).join("")}</div>`;
}

function locationBlock(base) {
  const P = DC.a_proximite_source_booking;
  const q = encodeURIComponent(`${C.adresse}, ${C.code_postal} ${C.ville}, France`);
  const plages = Object.entries(P.plages).map(([k, v]) => k === "Plage de Pampelonne" ? ["Plages de Pampelonne (accès le plus proche)", "≈ 1 km"] : [k, v]);
  const groups = [
    ["Plages", plages],
    ["Villages & sites", [["Village de Ramatuelle", "4 km"], ["Saint-Tropez", "6 km"], ...Object.entries(P.lieux)]],
    ["Venir", Object.entries(site.situation.temps_de_trajet_minutes).map(([k, v]) => [k, `${v} min`])],
  ];
  return `<div class="loc">
    <div class="map">
      <div class="map__fallback"><div>${icon("pin", "icon--lg")}<p><b>${C.adresse}</b><br>${C.code_postal} ${C.ville}<br><span class="muted">Par la route des plages</span></p><button class="btn btn--light btn--sm" type="button" data-load-map>Afficher la carte</button><p class="note" style="margin-top:10px">La carte est fournie par Google Maps.</p></div></div>
      <iframe title="Carte : ${esc(C.adresse)}, ${C.ville}" referrerpolicy="no-referrer-when-downgrade" data-src="https://maps.google.com/maps?q=${q}&z=13&output=embed" hidden></iframe>
    </div>
    <div>
      ${groups.map(([t, l]) => `<div class="dist-group"><h3>${t}</h3><ul class="dist">${l.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join("")}</ul></div>`).join("")}
      <p style="margin-top:20px"><a class="link" href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener">${icon("car", "icon--sm")} Itinéraire vers l'Auberge</a></p>
    </div>
  </div>`;
}

function roomsPage() {
  const base = "";
  const yes = `<span class="yes">${icon("check", "icon--sm")}</span>`;
  const no = `<span class="no">–</span>`;
  const body = `
<section class="pagehead"><div class="wrap">
  <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / <span>Chambres & suites</span></nav>
  <h1>Chambres, studio <em>& suites</em></h1>
  <p class="lead">Sept logements de 25 à 57 m², tous avec terrasse privative, climatisation et Wi-Fi. Pour deux, en famille ou pour un long séjour.</p>
</div></section>
<section class="section mt-0" style="padding-top:0"><div class="wrap">
  <div class="filters">
    <div class="chips" role="group" aria-label="Filtrer par type">
      <button class="chip" type="button" data-filter-cat="all" aria-pressed="true">Tous</button>
      <button class="chip" type="button" data-filter-cat="Double" aria-pressed="false">Chambres</button>
      <button class="chip" type="button" data-filter-cat="Studio" aria-pressed="false">Studio</button>
      <button class="chip" type="button" data-filter-cat="Suite" aria-pressed="false">Suites</button>
    </div>
    <div style="display:flex;gap:14px;align-items:center">
      <label class="sr" for="f-g">Nombre de voyageurs</label>
      <select class="chip" id="f-g" data-filter-guests><option value="0">Tous les voyageurs</option>${[1, 2, 3, 4].map((n) => `<option value="${n}">${n} voyageur${n > 1 ? "s" : ""} ou +</option>`).join("")}</select>
      <span class="filters__count" data-rooms-count aria-live="polite"></span>
      <a class="link" href="#comparatif">Tableau comparatif</a>
    </div>
  </div>
  <h2 class="sr">Liste des logements</h2>
  <div class="rooms" data-rooms>${ROOMS.map((r) => roomCard(r, base)).join("")}</div>
  <div class="empty" data-rooms-empty hidden><p>Aucun logement ne correspond. Pour plus de 4 voyageurs, réservez deux logements : <a class="link" href="contact.html">écrivez-nous</a>.</p></div>
</div></section>

<section class="section section--sand" id="comparatif" aria-labelledby="h-cmp"><div class="wrap">
  <div class="section__head"><div><h2 id="h-cmp">Les 7 logements <em>en un coup d'œil</em></h2></div></div>
  <div class="table-scroll" tabindex="0" role="region" aria-label="Tableau comparatif des logements">
  <table class="compare">
    <thead><tr><th scope="col">Logement</th><th scope="col">Surface</th><th scope="col">Voyageurs</th><th scope="col">Couchage</th><th scope="col">Cuisine</th><th scope="col">Vue</th><th scope="col">Tarif</th></tr></thead>
    <tbody>${ROOMS.map((r) => `<tr><th scope="row"><a href="chambres/${r.slug}.html">${esc(shortName(r))}</a></th><td>${r.surface_m2} m²</td><td>${r.personnes_max}</td><td>${r.lits.join("<br>")}</td><td>${hasKitchen(r) ? yes + " " + hasKitchen(r) : no}</td><td>${esc(viewOf(r))}</td><td>${priceOf(r.slug) ? priceOf(r.slug) + " €" : "Selon dates"}</td></tr>`).join("")}</tbody>
  </table></div>
  ${GLOBAL_FROM ? `<p class="note" style="margin-top:14px">Tarifs : de ${GLOBAL_FROM} à ${num(TF.jusqu_a_global)} € la nuit selon la saison et le logement. Ouverture ${TF.saison}. Tarif exact pour vos dates avec notre réponse.</p>` : ""}
  <p class="note" style="margin-top:14px">Dans tous les logements : climatisation, TV, Wi-Fi, coffre-fort, mini-bar, sèche-cheveux, produits d'accueil et terrasse privative.</p>
</div></section>
${ctaBand(base)}`;
  return layout({ title: "Chambres et suites avec terrasse près de Saint-Tropez | Auberge de l'Oumède", desc: "Sept logements de 25 à 57 m² avec terrasse privative, à 6 km de Saint-Tropez et 1 km de la plage de Pampelonne : chambres doubles, chambre triple, studio, suite junior et suite familiale.", body, base, active: "chambres", canonical: "chambres.html", mbar: mobileBar(base) });
}

function roomPage(r, i) {
  const base = "../";
  const others = ROOMS.filter((x) => x.slug !== r.slug).sort((a, b) => Math.abs(a.surface_m2 - r.surface_m2) - Math.abs(b.surface_m2 - r.surface_m2)).slice(0, 3);
  const RP = roomPhotos(r); const photos = [cover(r), ...RP.list.filter((x) => x !== cover(r))];
  const n = Math.min(photos.length, 5);
  const galCls = n >= 5 ? "" : n === 4 ? " gallery--4" : n === 3 ? " gallery--3" : " gallery--2";
  const highlights = [
    ["sun", "Terrasse privative", viewOf(r) ? `${viewOf(r)}.` : "Votre coin dehors, au calme."],
    r.caracteristiques.some((c) => /rez-de-chaussée/.test(c)) ? ["ground", "De plain-pied", "Logement entièrement situé au rez-de-chaussée."] : ["leaf", "Au calme", "Au cœur des vignes, loin de l'agitation de la côte."],
    hasKitchen(r) ? ["kitchen", hasKitchen(r), "Pour préparer vos repas en toute autonomie, idéal pour les longs séjours."] : ["coffee", "Petit-déjeuner sur demande", "Servi en terrasse, entre piscine et vignes."],
    ["wave", "Plages à 1 km", "Pampelonne à quelques minutes, Saint-Tropez à 6 km."],
  ];
  const facts = [
    ["area", `${r.surface_m2} m²`, "Surface"],
    ["users", `${r.personnes_max} voyageurs`, "Maximum"],
    ["bed", r.lits[0].replace("Lit double", "Lit"), r.lits[1] ? "+ " + r.lits[1].replace("Canapé-lit convertible", "canapé-lit").replace("Lit simple", "lit") : "Couchage"],
    ["sun", "Terrasse", "Privative"],
  ];
  const body = `
<div class="wrap">
  <div class="rd-head">
    <nav class="crumbs" aria-label="Fil d'Ariane"><a href="../index.html">Accueil</a> / <a href="../chambres.html">Chambres & suites</a> / <span>${esc(r.nom)}</span></nav>
    <h1>${esc(r.nom)}</h1>
    <div class="rd-sub">
      <a href="#avis">${icon("star", "icon--sm")} ${num(B.note_globale)} · ${B.nombre_avis} avis</a>
      <span>${icon("area", "icon--sm")} ${r.surface_m2} m²</span>
      <span>${icon("users", "icon--sm")} ${r.personnes_max} voyageurs</span>
      <span>${icon("pin", "icon--sm")} Ramatuelle, 1 km de Pampelonne</span>
    </div>
  </div>
  <div class="gallery-wrap">
    <div class="gallery${galCls}">
      ${photos.slice(0, n).map((p, k) => `<button class="ph" type="button" data-open-gallery="${k}" aria-label="Agrandir la photo ${k + 1} sur ${photos.length}"><img ${srcAttrs(base, p, k === 0 ? "(max-width:760px) 100vw, 50vw" : "(max-width:760px) 100vw, 25vw")} alt="${esc(r.nom)}, photo ${k + 1}" ${k === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.classList.add('is-missing')"></button>`).join("")}
    </div>
    <span class="gallery__dots" aria-hidden="true">1 / ${n}</span>
    ${RP.estate ? `<p class="gallery__note">${icon("info", "icon--sm")} ${RP.own ? "Les dernières images montrent le jardin et la piscine de l'Auberge." : "Ces images montrent le jardin et la piscine de l'Auberge : les photos de la suite arrivent bientôt."}</p>` : ""}
    <button class="btn btn--light btn--sm gallery__all" type="button" data-open-gallery="0">${icon("grid", "icon--sm")} Voir les ${photos.length} photos</button>
  </div>
</div>
<nav class="tabs" aria-label="Sections de la page"><div class="wrap tabs__in">
  <a href="#apercu" class="is-active">Aperçu</a><a href="#equipements">Équipements</a><a href="#bon-a-savoir">Bon à savoir</a><a href="#avis">Avis</a><a href="#situation">Situation</a>
</div></nav>
<div class="wrap rd">
  <div class="rd__main">
    <section id="apercu" aria-labelledby="h-ap">
      <h2 id="h-ap" class="sr">Aperçu</h2>
      <ul class="clean keyfacts">${facts.map(([ic, b, s]) => `<li>${icon(ic)}<b>${b}</b><span class="muted">${s}</span></li>`).join("")}</ul>
      <p class="lead" style="margin-top:28px">${esc(r.description)}</p>
      <ul class="highlights" style="margin-top:28px">${highlights.map(([ic, t, d]) => `<li>${icon(ic, "icon--lg")}<div><strong>${t}</strong><span>${d}</span></div></li>`).join("")}</ul>
    </section>
    <section id="equipements" aria-labelledby="h-eq">
      <h2 id="h-eq">Ce que propose ce logement</h2>
      <ul class="clean eq">${[...r.equipements, ...r.equipements_hotel.filter((e) => !r.equipements.includes(e))].map((e) => `<li>${icon(iconFor(e))} ${esc(e)}</li>`).join("")}</ul>
      <p class="note" style="margin-top:20px">Couchage : ${r.lits.join(" · ")}. Chambre non-fumeur.</p>
    </section>
    <section id="bon-a-savoir" aria-labelledby="h-know">
      <h2 id="h-know">Bon à savoir</h2>
      ${knowBlock()}
    </section>
    <section id="avis" aria-labelledby="h-avis">
      <h2 id="h-avis">Avis des voyageurs</h2>
      ${reviewsBlock(base, { compact: true })}
    </section>
    <section id="situation" aria-labelledby="h-sit">
      <h2 id="h-sit">Où vous dormirez</h2>
      <p>${esc(site.situation.texte)}</p>
      ${locationBlock(base)}
    </section>
  </div>
  <aside class="rd__aside" aria-label="Demande de réservation">
    <form class="bookcard" action="../contact.html" method="get" data-dates data-search ${dpAttrs}>
      <div class="bookcard__price"><strong>${priceOf(r.slug) ? `${priceOf(r.slug)} € <small>/ nuit</small>` : GLOBAL_FROM ? `${FROM_LABEL} <small>/ nuit</small>` : "Tarif selon vos dates"}</strong><a class="bookcard__score" href="#avis">${icon("star", "icon--sm")} ${num(B.note_globale)} <span class="muted">(${B.nombre_avis})</span></a></div>
      ${!priceOf(r.slug) && GLOBAL_FROM ? `<p class="bookcard__hint">Prix indicatif selon la saison et le logement (de ${GLOBAL_FROM} à ${num(TF.jusqu_a_global)} € la nuit). Tarif exact avec notre réponse.</p>` : ""}
      <input type="hidden" name="chambre" value="${r.slug}">
      ${dateHidden}
      <div class="fields">
        ${dateBtn("b-a", "a", "Arrivée")}
        ${dateBtn("b-d", "d", "Départ")}
        <div><label for="b-p">Voyageurs</label><select id="b-p" name="personnes">${guestOptions(Math.min(2, r.personnes_max), r.personnes_max)}</select></div>
      </div>
      ${breakfastOption(base, "b")}
      <button class="btn btn--block" type="submit">Vérifier la disponibilité</button>
      <p class="bookcard__nights" data-nights data-empty="Sans engagement · aucun paiement à cette étape"></p>
      <ul class="bookcard__list">
        <li>${icon("check", "icon--sm")} Réponse personnelle des propriétaires</li>
        <li>${icon("check", "icon--sm")} Conditions d'annulation précisées avant confirmation</li>
        <li>${icon("check", "icon--sm")} Aide pour réserver votre plage à Pampelonne</li>
      </ul>
      <p class="bookcard__booking">Besoin d'une confirmation immédiate ? <a href="${BOOKING_URL}" target="_blank" rel="noopener">Réserver sur Booking.com</a></p>
      <div class="bookcard__alt"><a href="tel:${TEL}">${icon("phone", "icon--sm")} Appeler</a><a href="mailto:${C.email}?subject=${encodeURIComponent(r.nom)}">${icon("mail", "icon--sm")} E-mail</a></div>
    </form>
  </aside>
</div>
<section class="section section--sand" aria-labelledby="h-oth"><div class="wrap">
  <div class="section__head"><div><h2 id="h-oth">Les autres <em>logements</em></h2></div><a class="link" href="../chambres.html">Comparer les 7 logements ${icon("arrow", "icon--sm")}</a></div>
  <div class="rooms rooms--scroll">${others.map((o) => roomCard(o, base)).join("")}</div>
</div></section>
${ctaBand(base)}
<dialog class="lightbox" id="lightbox" aria-label="Photos : ${esc(r.nom)}">
  <div class="lightbox__top"><b>${esc(r.nom)} · <span data-lb-count>1</span> / ${photos.length}</b><button class="iconbtn" type="button" data-close-gallery aria-label="Fermer les photos">${icon("close")}</button></div>
  <div class="lightbox__track" tabindex="0">${photos.map((p, k) => `<figure class="lightbox__slide">${img(base, p, `${r.nom}, photo ${k + 1}`, { sizes: "100vw" })}</figure>`).join("")}</div>
  <button class="iconbtn lightbox__nav lightbox__nav--prev" type="button" data-lb="-1" aria-label="Photo précédente">${icon("arrow")}</button>
  <button class="iconbtn lightbox__nav lightbox__nav--next" type="button" data-lb="1" aria-label="Photo suivante">${icon("arrow")}</button>
</dialog>`;
  const ld = { "@context": "https://schema.org", "@type": "HotelRoom", name: r.nom, description: r.description, floorSize: { "@type": "QuantitativeValue", value: r.surface_m2, unitCode: "MTK" }, occupancy: { "@type": "QuantitativeValue", maxValue: r.personnes_max }, bed: r.lits.join(", "), amenityFeature: r.equipements.map((e) => ({ "@type": "LocationFeatureSpecification", name: e, value: true })), containedInPlace: { "@type": "BedAndBreakfast", name: site.nom } };
  return layout({ title: `${r.nom}, ${r.surface_m2} m² avec terrasse · près de Saint-Tropez | Auberge de l'Oumède`, desc: r.description.slice(0, 155), body, base, active: "chambres", canonical: `chambres/${r.slug}.html`, jsonld: ld, ogImage: roomPhotos(r).list[0],
    mbar: mobileBar(base, { title: priceOf(r.slug) ? `${priceOf(r.slug)} € / nuit` : GLOBAL_FROM ? `${FROM_LABEL} / nuit` : "Tarif selon vos dates", href: `contact.html?chambre=${r.slug}`, cta: "Vérifier les dates" }) });
}

function servicesPage() {
  const base = "";
  const pd = TF.petit_dejeuner;
  const menu = pd.menu?.length
    ? `<ul class="menu-list">${pd.menu.map((m) => `<li><span>${esc(m.nom || m)}</span>${m.prix ? `<b>${m.prix} €</b>` : ""}</li>`).join("")}</ul>`
    : `<div class="placeholder"><strong>${icon("info", "icon--sm")} Menu détaillé bientôt disponible</strong><p>La carte du petit-déjeuner et son tarif seront publiés ici très prochainement. D'ici là, demandez-les-nous lors de votre réservation.</p></div>`;
  const body = `
<section class="pagehead"><div class="wrap">
  <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / <span>Services</span></nav>
  <h1>${esc(SV.sous_titre)}</h1>
  <p class="lead">${esc(SV.texte)}</p>
</div></section>
<section class="section" style="padding-top:0" aria-label="Nos services"><div class="wrap">
  <h2 class="sr">Nos services</h2>
  ${servicesGrid(base)}
  <ul class="clean amen">${SV.points_forts.map((p) => `<li>${icon({ "Piscine extérieure chauffée": "pool", "Parking privé gratuit sur place": "parking", "Connexion Wi-Fi gratuite": "wifi", "Chambres familiales": "users", "Chambres non-fumeurs": "leaf", "Petit-déjeuner continental": "coffee", "Terrasse et jardin": "sun" }[p] || "check")} ${p}</li>`).join("")}</ul>
</div></section>
<section class="section section--sand" id="petit-dejeuner" aria-labelledby="h-pd"><div class="wrap">
  <div class="menu-card">
    ${img(base, (SV.services[0].photos || [])[0], "Petit-déjeuner servi en terrasse", { ico: "coffee" })}
    <div>
      <h2 id="h-pd">Le petit-déjeuner</h2>
      <p>${esc(SV.services[0].texte)}</p>
      <ul class="clean stack-sm" style="margin-bottom:22px">
        <li class="service__detail">${icon("coffee", "icon--sm")} Petit-déjeuner continental, sur demande</li>
        <li class="service__detail">${icon("sun", "icon--sm")} Servi en terrasse, entre piscine et vignes</li>
        <li class="service__detail">${icon("clock", "icon--sm")} Horaires : ${pd.horaires ? esc(pd.horaires) : "précisés à votre arrivée"}</li>
        <li class="service__detail">${icon("card", "icon--sm")} Tarif : ${pd.prix_par_personne ? pd.prix_par_personne + " € par personne" : "communiqué sur demande"}</li>
      </ul>
      <!-- À COMPLÉTER : renseigner content/tarifs.json > petit_dejeuner (menu, prix, horaires) puis relancer node build/build.mjs -->
      ${menu}
      <a class="btn" style="margin-top:22px" href="contact.html">L'ajouter à ma demande ${icon("arrow", "icon--sm")}</a>
    </div>
  </div>
</div></section>
${ctaBand(base)}`;
  return layout({ title: "Hôtel avec piscine chauffée et petit-déjeuner près de Saint-Tropez | Auberge de l'Oumède", desc: "Piscine chauffée, petit-déjeuner continental en terrasse, jardin méditerranéen, parking et Wi-Fi gratuits : les services de l'Auberge de l'Oumède à Ramatuelle.", body, base, active: "services", canonical: "services.html", mbar: mobileBar(base) });
}

function ramatuellePage() {
  const base = "";
  const body = `
<section class="pagehead"><div class="wrap">
  <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / <span>Saint-Tropez & alentours</span></nav>
  <h1>Saint-Tropez, Pampelonne <em>et Ramatuelle</em></h1>
  <p class="lead">${esc(DC.texte)} Plages mythiques, village perché, marché provençal et sentiers du littoral : voici nos conseils.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap">
  <div class="discover">${DC.activites.map((a, k) => `<article class="disc${exists(a.photo) ? "" : " disc--card"}">
    ${exists(a.photo) ? img(base, a.photo, a.titre) : `<span class="disc__ico">${icon(["wave", "landmark", "leaf"][k], "icon--lg")}</span>`}
    <div><h2 style="font-size:1.7rem">${esc(a.titre)}</h2><p>${esc(a.texte)}</p>
    <a class="link" href="${a.lien.replace(/^http:/, "https:")}" target="_blank" rel="noopener">En savoir plus ${icon("arrow", "icon--sm")}<span class="sr"> (site externe)</span></a></div>
  </article>`).join("")}</div>
</div></section>
<section class="section" style="padding-top:0" aria-labelledby="h-evt"><div class="wrap">
  <div class="section__head"><div><h2 id="h-evt">Où dormir pour <em>les grands rendez-vous</em></h2><p>L'Auberge est ouverte ${TF.saison || "de mai à octobre"}. Pensez à réserver tôt pour ces dates.</p></div></div>
  <div class="discover">
    <article class="disc disc--card"><span class="disc__ico">${icon("star", "icon--lg")}</span><h3>Festival de Ramatuelle</h3><p><b>Début août.</b> Théâtre, musique et humour en plein air, au cœur du village de Ramatuelle, à 4 km de l'Auberge.</p></article>
    <article class="disc disc--card"><span class="disc__ico">${icon("wave", "icon--lg")}</span><h3>Les Voiles de Saint-Tropez</h3><p><b>Fin septembre – début octobre.</b> Les plus beaux voiliers classiques et modernes dans la baie. Le soir, retour au calme des vignes, loin de l'affluence du port.</p></article>
    <article class="disc disc--card"><span class="disc__ico">${icon("landmark", "icon--lg")}</span><h3>Marchés provençaux</h3><p><b>Toute la saison.</b> Ramatuelle le jeudi et le dimanche, Saint-Tropez place des Lices le mardi et le samedi.</p></article>
  </div>
</div></section>
<section class="section section--sand" id="acces" aria-labelledby="h-acc"><div class="wrap">
  <div class="section__head"><div><h2 id="h-acc">Venir <em>à l'Auberge</em></h2><p>${esc(site.situation.texte)} Accès par la route des plages, chemin de l'Oumède.</p></div></div>
  ${locationBlock(base)}
  <div class="dist-group" style="margin-top:40px;max-width:560px"><h3>Restaurants à proximité</h3><ul class="dist">${Object.entries(DC.a_proximite_source_booking.restaurants).map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join("")}</ul></div>
</div></section>
${ctaBand(base)}`;
  return layout({ title: "Que faire autour de Saint-Tropez : Pampelonne, Ramatuelle | Auberge de l'Oumède", desc: "Plage de Pampelonne, marché provençal, sentiers du littoral : nos conseils pour découvrir Ramatuelle et Saint-Tropez depuis l'Auberge de l'Oumède.", body, base, active: "ramatuelle", canonical: "ramatuelle.html", mbar: mobileBar(base) });
}

function contactPage() {
  const base = "";
  const body = `
<section class="pagehead"><div class="wrap">
  <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / <span>Contact & réservation</span></nav>
  <h1>Demandez <em>vos dates</em></h1>
  <p class="lead">Indiquez votre séjour : nous vous répondons personnellement avec la disponibilité et le tarif. Aucun paiement n'est demandé à cette étape.</p>
</div></section>
<section class="section" style="padding-top:0"><div class="wrap contact">
  <div class="contact-card">
    <form id="resa" class="form" data-dates ${dpAttrs} data-to="${C.email}"${site.formulaire_endpoint ? ` data-endpoint="${site.formulaire_endpoint}"` : ""} novalidate>
      <!-- Pour recevoir les demandes sans passer par la messagerie du client : ajouter "formulaire_endpoint" (ex. Formspree) dans content/site.json -->
      ${dateHidden}
      <div class="field field--dp">${dateBtn("c-a", "a", "Arrivée")}<p class="err">Choisissez une date d'arrivée.</p></div>
      <div class="field field--dp">${dateBtn("c-d", "d", "Départ")}<p class="err">Choisissez une date de départ après l'arrivée.</p></div>
      <div class="field"><label for="c-p">Voyageurs</label><select id="c-p" name="personnes">${guestOptions(2, 4)}</select></div>
      <div class="field"><label for="c-c">Logement</label><select id="c-c" name="chambre">${roomOptions()}</select></div>
      <div class="form__summary" aria-live="polite"></div>
      <div class="field"><label for="c-n">Nom et prénom</label><input id="c-n" name="nom" autocomplete="name" required><p class="err">Indiquez votre nom.</p></div>
      <div class="field"><label for="c-e">E-mail</label><input id="c-e" type="email" name="email" autocomplete="email" required><p class="err">Indiquez un e-mail valide.</p></div>
      <div class="field full"><label for="c-t">Téléphone <small>(facultatif)</small></label><input id="c-t" type="tel" name="tel" autocomplete="tel"></div>
      <div class="field full"><label for="c-m">Message <small>(facultatif)</small></label><textarea id="c-m" name="message" placeholder="Heure d'arrivée prévue, occasion particulière, réservation de plage…"></textarea></div>
      <div class="full">${breakfastOption("", "c")}</div>
      <div class="full"><button class="btn btn--block" type="submit">Envoyer ma demande ${icon("arrow", "icon--sm")}</button>
      <p class="note" style="margin:10px 0 0;text-align:center">Votre messagerie s'ouvre avec la demande prête à envoyer. Vos données ne servent qu'à vous répondre.</p></div>
    </form>
    <div class="form__ok" role="status" tabindex="-1">${icon("check", "icon--sm")} <b>Votre demande est prête.</b> Si votre messagerie ne s'est pas ouverte, écrivez-nous à <a href="mailto:${C.email}">${C.email}</a> ou appelez le <a href="tel:${TEL}">${C.telephone_affiche}</a>.</div>
  </div>
  <div>
    <div class="contact-card" style="margin-bottom:20px">
      <h2 style="font-size:1.7rem">Nous joindre</h2>
      <ul class="contact-list">
        <li>${icon("phone")}<div><a href="tel:${TEL}">${C.telephone_affiche}</a><small>Le plus rapide pour une réponse immédiate</small></div></li>
        <li>${icon("mail")}<div><a href="mailto:${C.email}">${C.email}</a><small>Réponse personnelle des propriétaires</small></div></li>
        <li>${icon("pin")}<div><b>${C.adresse}</b><small>${C.code_postal} ${C.ville} · par la route des plages</small></div></li>
        <li>${icon("instagram")}<div><a href="${C.instagram}" target="_blank" rel="noopener">@aubergedeloumedehome</a><small>Les dernières photos de l'Auberge</small></div></li>
      </ul>
    </div>
    <div class="contact-card" style="margin-bottom:20px">
      <h2 style="font-size:1.4rem">Confirmation immédiate</h2>
      <p class="muted" style="font-size:.93rem">Vous préférez réserver et payer en ligne tout de suite ? L'Auberge est aussi disponible sur Booking.com.</p>
      <a class="btn btn--ghost btn--sm" href="${BOOKING_URL}" target="_blank" rel="noopener">Voir sur Booking.com ${icon("arrow", "icon--sm")}</a>
    </div>
    <div class="contact-card">
      <h2 style="font-size:1.4rem">Arrivée & départ</h2>
      <ul class="contact-list">
        <li>${icon("clock")}<div><b>Arrivée de 16h à 20h</b><small>Aucune arrivée après 20h00</small></div></li>
        <li>${icon("clock")}<div><b>Départ de 8h30 à 11h</b></div></li>
        <li>${icon("card")}<div><b>À l'arrivée</b><small>Pièce d'identité et carte de crédit</small></div></li>
      </ul>
    </div>
  </div>
</div></section>
<section class="section section--sand"><div class="wrap"><div class="section__head"><div><h2>Nous trouver</h2></div></div>${locationBlock(base)}</div></section>`;
  return layout({ title: "Réserver un hôtel de charme près de Saint-Tropez | Auberge de l'Oumède", desc: "Demandez vos dates à l'Auberge de l'Oumède : réponse personnelle avec disponibilité et tarif. 1035 chemin de l'Oumède, 83350 Ramatuelle. 04 94 44 11 11.", body, base, active: "contact", canonical: "contact.html" });
}

function legalPage() {
  const body = `<section class="pagehead"><div class="wrap" style="max-width:820px">
  <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> / <span>Mentions légales</span></nav>
  <h1>Mentions légales</h1>
  <!-- À COMPLÉTER : raison sociale, SIRET, directeur de publication, hébergeur -->
  <div class="placeholder"><strong>${icon("info", "icon--sm")} Informations à compléter</strong><p>Raison sociale, numéro SIRET, directeur de la publication et hébergeur du site.</p></div>
  <h2 style="margin-top:40px;font-size:1.8rem">Contact</h2>
  <p>${site.nom}<br>${C.adresse}, ${C.code_postal} ${C.ville}, ${C.pays}<br>${C.telephone_affiche} · <a href="mailto:${C.email}">${C.email}</a></p>
  <h2 style="margin-top:32px;font-size:1.8rem">Données personnelles</h2>
  <p>Les informations envoyées via le formulaire de demande servent uniquement à répondre à votre demande de séjour. Elles ne sont ni revendues ni utilisées à des fins publicitaires. Vous pouvez demander leur suppression à tout moment par e-mail.</p>
  <h2 style="margin-top:32px;font-size:1.8rem">Avis clients</h2>
  <p>Les notes et extraits d'avis proviennent de Booking.com (relevés le 18 novembre 2026).</p>
</div></section>`;
  return layout({ title: "Mentions légales | Auberge de l'Oumède", desc: "Mentions légales du site de l'Auberge de l'Oumède à Ramatuelle.", body, canonical: "mentions-legales.html" });
}

function notFound() {
  const body = `<section class="section"><div class="wrap center"><h1>Cette page s'est perdue <em>dans les vignes</em></h1><p class="lead" style="margin:0 auto 28px">La page demandée n'existe pas ou a changé d'adresse.</p><a class="btn" href="/index.html">Retour à l'accueil</a> <a class="btn btn--ghost" href="/chambres.html">Voir les chambres</a></div></section>`;
  return layout({ title: "Page introuvable | Auberge de l'Oumède", desc: "Page introuvable.", body, base: "/", canonical: "404.html" });
}

/* ------------------------------------------------------------------ */
const out = (f, html) => { const p = path.join(ROOT, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, html); };
out("index.html", home());
out("chambres.html", roomsPage());
ROOMS.forEach((r, i) => out(`chambres/${r.slug}.html`, roomPage(r, i)));
out("services.html", servicesPage());
out("ramatuelle.html", ramatuellePage());
out("contact.html", contactPage());
out("mentions-legales.html", legalPage());
out("404.html", notFound());
const urls = ["", "chambres.html", ...ROOMS.map((r) => `chambres/${r.slug}.html`), "services.html", "ramatuelle.html", "contact.html"];
out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE_URL}/${u}</loc></url>`).join("\n")}\n</urlset>\n`);
out("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`OK : ${urls.length + 2} pages générées.`);
