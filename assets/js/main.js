/* Auberge de l'Oumède – petits comportements, sans dépendance */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- Header ombre au scroll ---- */
  var header = $(".header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Menu mobile ---- */
  var drawer = $("#drawer");
  var burger = $(".burger");
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("a, button", drawer.querySelector(".drawer__panel")); f && f.focus(); }
    else burger.focus();
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(true); });
  $$("[data-close-drawer]").forEach(function (el) { el.addEventListener("click", function () { setDrawer(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setDrawer(false); });

  /* ---- Calendrier : arrivée et départ dans une seule fenêtre ---- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function parse(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function addDays(v, n) { var d = parse(v); d.setDate(d.getDate() + n); return isoOf(d); }
  function nights(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  var fmt = function (v) {
    try { return parse(v).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" }); }
    catch (e) { return v; }
  };
  var fmtShort = function (v) {
    try { return parse(v).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }); }
    catch (e) { return v; }
  };
  var fmtLong = function (v) { return parse(v).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); };
  var MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var DOW = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
  var TODAY = isoOf(new Date());

  var dp = null; // fenêtre unique, partagée par tous les formulaires
  var st = { scope: null, a: "", d: "", k: "a", view: null, hover: "", trigger: null };

  function season(scope) { return { open: scope.getAttribute("data-open") || "01-01", close: scope.getAttribute("data-close") || "12-31" }; }
  function canArrive(v, s) { var md = v.slice(5); return v >= TODAY && md >= s.open && md < s.close; }
  function maxDepart(a, s) { return a.slice(0, 4) + "-" + s.close; }
  function canDepart(v, s) { return !!st.a && v > st.a && v <= maxDepart(st.a, s); }
  function firstOpen(s) {
    var v = TODAY;
    for (var i = 0; i < 400; i++) { if (canArrive(v, s)) return v; v = addDays(v, 1); }
    return TODAY;
  }

  function build() {
    dp = document.createElement("div");
    dp.className = "dpk"; dp.hidden = true;
    dp.setAttribute("role", "dialog"); dp.setAttribute("aria-label", "Choisir les dates du séjour");
    dp.innerHTML =
      '<div class="dpk__head">' +
        '<button type="button" class="dpk__sum" data-k="a"><small>Arrivée</small><b data-sum="a"></b></button>' +
        '<span class="dpk__to" aria-hidden="true"></span>' +
        '<button type="button" class="dpk__sum" data-k="d"><small>Départ</small><b data-sum="d"></b></button>' +
        '<div class="dpk__presets" role="group" aria-label="Durée du séjour">' +
          '<button type="button" data-n="2">Week-end</button>' +
          '<button type="button" data-n="4">4 nuits</button>' +
          '<button type="button" data-n="7">1 semaine</button>' +
          '<button type="button" data-n="14">2 semaines</button>' +
        '</div>' +
        '<button type="button" class="dpk__close" aria-label="Fermer le calendrier"><svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '</div>' +
      '<div class="dpk__body">' +
        '<div class="dpk__cal">' +
          '<button type="button" class="dpk__nav dpk__nav--prev" data-step="-1" aria-label="Mois précédent"><svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>' +
          '<button type="button" class="dpk__nav dpk__nav--next" data-step="1" aria-label="Mois suivant"><svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>' +
          '<div class="dpk__months"></div>' +
        '</div>' +
      '</div>' +
      '<div class="dpk__foot"><p class="dpk__info" aria-live="polite"></p>' +
        '<button type="button" class="dpk__clear">Effacer</button>' +
        '<button type="button" class="btn btn--sm dpk__ok">Valider</button></div>';
    document.body.appendChild(dp);
    var bg = document.createElement("div"); bg.className = "dpk__bg"; bg.hidden = true; document.body.appendChild(bg);
    dp._bg = bg;
    bg.addEventListener("click", function () { dpClose(); });

    dp.addEventListener("click", function (e) {
      var t = e.target.closest("button"); if (!t) return;
      if (t.classList.contains("dpk__d")) return pick(t.getAttribute("data-v"));
      if (t.hasAttribute("data-step")) { shift(+t.getAttribute("data-step")); return; }
      if (t.hasAttribute("data-n")) return preset(+t.getAttribute("data-n"));
      if (t.hasAttribute("data-k")) { st.k = t.getAttribute("data-k") === "d" && st.a ? "d" : "a"; paint(); return; }
      if (t.classList.contains("dpk__clear")) { st.a = st.d = ""; st.k = "a"; commit(); paint(); return; }
      if (t.classList.contains("dpk__ok") || t.classList.contains("dpk__close")) dpClose(true);
    });
    dp.addEventListener("mouseover", function (e) {
      var t = e.target.closest(".dpk__d");
      var v = t && st.k === "d" && st.a && !st.d ? t.getAttribute("data-v") : "";
      if (v !== st.hover) { st.hover = v; paint(); }
    });
    dp.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); dpClose(true); return; }
      var t = e.target.closest(".dpk__d"); if (!t) return;
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step) return;
      e.preventDefault();
      var v = addDays(t.getAttribute("data-v"), step);
      var b = dp.querySelector('.dpk__d[data-v="' + v + '"]');
      if (!b) { shift(step > 0 ? 1 : -1); b = dp.querySelector('.dpk__d[data-v="' + v + '"]'); }
      if (b) b.focus();
    });
    document.addEventListener("mousedown", function (e) {
      if (dp.hidden || dp.contains(e.target) || e.target.closest("[data-dp-open]")) return;
      dpClose();
    });
    window.addEventListener("resize", function () { if (!dp.hidden) place(); });
  }

  function months() { return window.innerWidth < 700 ? 3 : 2; }
  function render() {
    var s = season(st.scope), html = "", n = months();
    for (var i = 0; i < n; i++) {
      var m = new Date(st.view.getFullYear(), st.view.getMonth() + i, 1, 12);
      var y = m.getFullYear(), mo = m.getMonth();
      var start = (m.getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate();
      html += '<div class="dpk__m"><p class="dpk__mt">' + MONTHS[mo] + " " + y + '</p><table role="grid"><thead><tr>' +
        DOW.map(function (d) { return '<th scope="col" abbr="' + d + '">' + d.charAt(0).toUpperCase() + d.slice(1, 2) + "</th>"; }).join("") + "</tr></thead><tbody><tr>";
      for (var c = 0; c < start; c++) html += "<td></td>";
      for (var d = 1; d <= days; d++) {
        var v = y + "-" + pad(mo + 1) + "-" + pad(d), md = v.slice(5);
        var closed = md < s.open || md > s.close;
        html += '<td data-v="' + v + '"><button type="button" class="dpk__d' + (closed ? " is-closed" : "") + (v === TODAY ? " is-today" : "") +
          '" data-v="' + v + '" tabindex="-1" aria-label="' + fmtLong(v) + (closed ? ", fermé" : "") + '">' + d + "</button></td>";
        if ((start + d) % 7 === 0 && d < days) html += "</tr><tr>";
      }
      html += "</tr></tbody></table></div>";
    }
    $(".dpk__months", dp).innerHTML = html;
    var first = new Date(st.view.getFullYear(), st.view.getMonth(), 1, 12);
    var min = parse(TODAY); min.setDate(1);
    $(".dpk__nav--prev", dp).disabled = first <= min;
    paint();
  }

  function paint() {
    var s = season(st.scope);
    var end = st.d || st.hover;
    $$(".dpk__d", dp).forEach(function (b) {
      var v = b.getAttribute("data-v"), td = b.parentNode;
      var ok = st.k === "d" && st.a ? (canDepart(v, s) || canArrive(v, s)) : canArrive(v, s);
      b.setAttribute("aria-disabled", String(!ok));
      var isS = v === st.a, isE = !!end && v === end && end > st.a;
      b.classList.toggle("is-start", isS);
      b.classList.toggle("is-end", isE && !!st.d);
      b.classList.toggle("is-hover", isE && !st.d);
      b.setAttribute("aria-pressed", String(isS || (isE && !!st.d)));
      td.classList.toggle("in-range", !!st.a && !!end && end > st.a && v > st.a && v < end);
      td.classList.toggle("is-preview", !st.d && !!st.hover);
      td.classList.toggle("edge-s", !!st.a && !!end && end > st.a && v === st.a);
      td.classList.toggle("edge-e", !!st.a && !!end && end > st.a && v === end);
    });
    // Tab stop : la date sélectionnée, sinon la première disponible
    var focusV = (st.k === "d" ? st.d || st.a : st.a) || "";
    var tb = focusV && dp.querySelector('.dpk__d[data-v="' + focusV + '"]');
    if (!tb) tb = dp.querySelector('.dpk__d[aria-disabled="false"]');
    $$(".dpk__d", dp).forEach(function (b) { b.tabIndex = b === tb ? 0 : -1; });

    $('[data-sum="a"]', dp).textContent = st.a ? fmtShort(st.a) : "Choisir";
    $('[data-sum="d"]', dp).textContent = st.d ? fmtShort(st.d) : "Choisir";
    $$(".dpk__sum", dp).forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-k") === st.k); });
    var info = $(".dpk__info", dp), sea = season(st.scope);
    if (st.a && st.d) { var n = nights(st.a, st.d); info.innerHTML = "<b>" + n + (n > 1 ? " nuits" : " nuit") + "</b> · du " + fmt(st.a) + " au " + fmt(st.d); }
    else if (st.a) info.textContent = "Choisissez maintenant votre date de départ.";
    else info.textContent = "Choisissez votre date d'arrivée. Ouvert du " + label(sea.open) + " au " + label(sea.close) + ".";
    $(".dpk__ok", dp).disabled = !(st.a && st.d);
  }
  function label(md) { var p = md.split("-"); return (+p[1] === 1 ? "1er" : +p[1]) + " " + MONTHS[+p[0] - 1]; }

  function pick(v) {
    var s = season(st.scope);
    var b = dp.querySelector('.dpk__d[data-v="' + v + '"]');
    if (b && b.getAttribute("aria-disabled") === "true") return;
    if (st.k === "d" && st.a && canDepart(v, s)) { st.d = v; st.hover = ""; commit(); paint(); var ok = $(".dpk__ok", dp); ok.focus(); return; }
    st.a = v; st.d = ""; st.k = "d"; st.hover = "";
    commit(); paint();
    var nb = dp.querySelector('.dpk__d[data-v="' + v + '"]'); if (nb) nb.focus();
  }
  function preset(n) {
    var s = season(st.scope);
    var a = st.a && canArrive(st.a, s) ? st.a : firstOpen(s);
    var d = addDays(a, n); if (d > maxDepart(a, s)) d = maxDepart(a, s);
    st.a = a; st.d = d; st.k = "d";
    var va = parse(a); if (va < st.view || va >= new Date(st.view.getFullYear(), st.view.getMonth() + months(), 1)) st.view = new Date(va.getFullYear(), va.getMonth(), 1, 12);
    commit(); render();
  }
  function shift(n) { st.view = new Date(st.view.getFullYear(), st.view.getMonth() + n, 1, 12); render(); }

  function commit() {
    var sc = st.scope, A = $("[name=arrivee]", sc), D = $("[name=depart]", sc);
    A.value = st.a; D.value = st.d;
    A.dispatchEvent(new Event("change", { bubbles: true })); D.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function place() {
    var sheet = window.innerWidth < 700;
    dp.classList.toggle("is-sheet", sheet); dp._bg.hidden = !sheet;
    document.body.classList.toggle("dpk-lock", sheet);
    if (sheet) { dp.style.left = dp.style.top = dp.style.width = ""; return; }
    var anchor = st.trigger.closest(".bookbar, .fields, .form") || st.trigger.parentNode;
    var r = anchor.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    var w = Math.min(Math.max(r.width, 700), vw - 32);
    dp.style.width = w + "px";
    var left = anchor.classList.contains("fields") ? r.right - w : r.left;
    if (anchor.classList.contains("form")) r = st.trigger.getBoundingClientRect();
    left = Math.max(16, Math.min(left, vw - w - 16));
    dp.style.left = left + window.scrollX + "px";
    dp.style.top = r.bottom + window.scrollY + 10 + "px";
  }

  function dpOpen(scope, k, trigger) {
    if (!dp) build();
    var s = season(scope);
    st.scope = scope; st.trigger = trigger;
    st.a = $("[name=arrivee]", scope).value; st.d = $("[name=depart]", scope).value;
    st.k = k === "d" && st.a ? "d" : "a"; st.hover = "";
    var base = parse(st.a || firstOpen(s));
    st.view = new Date(base.getFullYear(), base.getMonth(), 1, 12);
    dp.hidden = false;
    $$("[data-dp-open]", scope).forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    render(); place();
    var r = dp.getBoundingClientRect();
    if (!dp.classList.contains("is-sheet") && r.bottom > window.innerHeight) window.scrollBy({ top: r.bottom - window.innerHeight + 24, behavior: "smooth" });
    var f = dp.querySelector('.dpk__d[tabindex="0"]'); if (f) f.focus({ preventScroll: true });
  }
  function dpClose(refocus) {
    if (!dp || dp.hidden) return;
    dp.hidden = true; dp._bg.hidden = true; document.body.classList.remove("dpk-lock");
    $$("[data-dp-open]", st.scope).forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    if (refocus && st.trigger) st.trigger.focus();
  }

  $$("[data-dp]").forEach(function (scope) {
    var A = $("[name=arrivee]", scope), D = $("[name=depart]", scope), out = $("[data-nights]", scope);
    function show() {
      var va = $('[data-dp-val="a"]', scope), vd = $('[data-dp-val="d"]', scope);
      if (va) { va.textContent = A.value ? fmtShort(A.value) : "Ajouter une date"; va.classList.toggle("is-set", !!A.value); }
      if (vd) { vd.textContent = D.value ? fmtShort(D.value) : "Ajouter une date"; vd.classList.toggle("is-set", !!D.value); }
      if (A.value) { var w = $('[data-dp-open="a"]', scope); w && w.parentNode.removeAttribute("aria-invalid"); }
      if (D.value) { var w2 = $('[data-dp-open="d"]', scope); w2 && w2.parentNode.removeAttribute("aria-invalid"); }
      if (out) {
        if (A.value && D.value && D.value > A.value) { var n = nights(A.value, D.value); out.textContent = n + (n > 1 ? " nuits" : " nuit") + " · du " + fmt(A.value) + " au " + fmt(D.value); }
        else out.textContent = out.getAttribute("data-empty") || "";
      }
    }
    A.addEventListener("change", show); D.addEventListener("change", show);
    $$("[data-dp-open]", scope).forEach(function (b) {
      b.addEventListener("click", function () {
        if (dp && !dp.hidden && st.scope === scope) { var k = b.getAttribute("data-dp-open"); st.k = k === "d" && st.a ? "d" : "a"; st.trigger = b; paint(); return; }
        dpOpen(scope, b.getAttribute("data-dp-open"), b);
      });
    });
    scope._dpOpen = function (k) { dpOpen(scope, k, $('[data-dp-open="' + k + '"]', scope)); };
    show();
  });

  /* ---- Petit-déjeuner en option : total selon nuits et voyageurs ---- */
  $$("[data-bf]").forEach(function (cb) {
    var sc = cb.closest("form"), out = $("[data-bf-total]", cb.closest(".upsell")), price = +cb.getAttribute("data-bf");
    function upd() {
      var A = sc.elements.arrivee, D = sc.elements.depart, P = sc.elements.personnes;
      var p = P ? +P.value || 2 : 2;
      if (!price) { out.textContent = ""; return; }
      if (A && D && A.value && D.value && D.value > A.value) {
        var n = nights(A.value, D.value);
        out.textContent = (cb.checked ? "Ajouté : " : "Soit ") + (price * p * n) + " € pour " + p + " pers. et " + n + (n > 1 ? " matins" : " matin");
      } else out.textContent = cb.checked ? "Ajouté à votre demande" : "";
    }
    sc.addEventListener("change", upd); upd();
  });

  /* ---- Filtres des chambres ---- */
  var roomList = $("[data-rooms]");
  if (roomList) {
    var cat = "all", guests = 0;
    var count = $("[data-rooms-count]");
    var empty = $("[data-rooms-empty]");
    function apply() {
      var n = 0;
      $$(".room", roomList).forEach(function (r) {
        var ok = (cat === "all" || r.dataset.cat === cat || (" " + r.dataset.tags + " ").indexOf(" " + cat + " ") > -1) && (+r.dataset.max >= guests);
        r.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = n + (n > 1 ? " logements" : " logement");
      if (empty) empty.hidden = n !== 0;
    }
    $$("[data-filter-cat], [data-filter-tag]").forEach(function (b, i, all) {
      b.addEventListener("click", function () {
        cat = b.dataset.filterCat || b.dataset.filterTag;
        all.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        apply();
        if (roomList.classList.contains("rooms--rail")) roomList.scrollTo({ left: 0, behavior: "smooth" });
      });
    });
    $$("[data-rail]").forEach(function (b) {
      b.addEventListener("click", function () {
        var card = $(".room:not([hidden])", roomList);
        var w = card ? card.getBoundingClientRect().width + 24 : 300;
        roomList.scrollBy({ left: +b.dataset.rail * w, behavior: "smooth" });
      });
    });
    var g = $("[data-filter-guests]");
    if (g) g.addEventListener("change", function () { guests = +g.value; apply(); });
    var p = new URLSearchParams(location.search);
    if (p.get("personnes") && g) { g.value = p.get("personnes"); guests = +g.value || 0; }
    apply();
  }

  /* ---- Galerie / visionneuse ---- */
  var lb = $("#lightbox");
  if (lb) {
    var open = function (i) {
      if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
      document.body.style.overflow = "hidden";
      var tr = $(".lightbox__track", lb);
      setTimeout(function () { tr.scrollTo({ left: tr.clientWidth * (i || 0), behavior: "instant" }); tr.focus(); }, 20);
    };
    var close = function () { lb.close ? lb.close() : lb.removeAttribute("open"); document.body.style.overflow = ""; };
    $$("[data-open-gallery]").forEach(function (b) { b.addEventListener("click", function () { open(+b.dataset.openGallery || 0); }); });
    $$("[data-close-gallery]").forEach(function (b) { b.addEventListener("click", close); });
    lb.addEventListener("close", function () { document.body.style.overflow = ""; });
    var track = $(".lightbox__track", lb), cnt = $("[data-lb-count]", lb);
    var go = function (d) { track.scrollBy({ left: d * track.clientWidth, behavior: "smooth" }); };
    $$("[data-lb]", lb).forEach(function (b) { b.addEventListener("click", function () { go(+b.dataset.lb); }); });
    lb.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { e.preventDefault(); go(1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } });
    track.addEventListener("scroll", function () { cnt.textContent = Math.round(track.scrollLeft / track.clientWidth) + 1; }, { passive: true });
  }
  /* compteur de la galerie mobile */
  var gal = $(".gallery"), dots = $(".gallery__dots");
  if (gal && dots) {
    var total = $$(".ph", gal).length;
    gal.addEventListener("scroll", function () {
      var i = Math.round(gal.scrollLeft / gal.clientWidth) + 1;
      dots.textContent = i + " / " + total;
    }, { passive: true });
  }

  /* ---- Onglets collants : section active ---- */
  var tabs = $$(".tabs a");
  if (tabs.length && "IntersectionObserver" in window) {
    var map = {};
    tabs.forEach(function (t) { map[t.getAttribute("href").slice(1)] = t; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          tabs.forEach(function (t) { t.classList.remove("is-active"); });
          var t = map[e.target.id]; if (t) t.classList.add("is-active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); s && io.observe(s); });
  }

  /* ---- Formulaire de demande de réservation ---- */
  var form = $("#resa");
  if (form) {
    var p2 = new URLSearchParams(location.search);
    ["arrivee", "depart", "personnes", "chambre"].forEach(function (k) {
      var v = p2.get(k), f = form.elements[k];
      if (v && f) { f.value = v; f.dispatchEvent(new Event("change", { bubbles: true })); }
    });
    if (p2.get("petitdej") && form.elements.petitdej) { form.elements.petitdej.checked = true; form.elements.petitdej.dispatchEvent(new Event("change", { bubbles: true })); }
    var summary = $(".form__summary", form);
    function upd() {
      var a = form.elements.arrivee.value, d = form.elements.depart.value;
      if (a && d && d > a) {
        var n = nights(a, d);
        var ch = form.elements.chambre;
        var label = ch && ch.value ? ch.options[ch.selectedIndex].text.replace(/ \(\d pers\.\)$/, "") : "Logement à conseiller";
        summary.innerHTML = "<strong>" + n + (n > 1 ? " nuits" : " nuit") + "</strong> · du " + fmt(a) + " au " + fmt(d) +
          " · " + form.elements.personnes.value + " pers. · " + label + (form.elements.petitdej.checked ? " · petit-déjeuner inclus" : "");
        summary.classList.add("is-on");
      } else summary.classList.remove("is-on");
    }
    form.addEventListener("change", upd);
    upd();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      $$("[required]", form).forEach(function (f) {
        var ok = f.checkValidity();
        if (f.name === "depart" && f.value && form.elements.arrivee.value && f.value <= form.elements.arrivee.value) ok = false;
        f.setAttribute("aria-invalid", String(!ok));
        if (!ok && !bad) bad = f;
      });
      var E0 = form.elements;
      if (!E0.arrivee.value || !E0.depart.value) {
        var k = !E0.arrivee.value ? "a" : "d", tb = $('[data-dp-open="' + k + '"]', form);
        tb.parentNode.setAttribute("aria-invalid", "true");
        tb.focus(); if (form._dpOpen) form._dpOpen(k);
        return;
      }
      if (bad) { bad.focus(); return; }
      var E = form.elements;
      var ch = E.chambre.value ? E.chambre.options[E.chambre.selectedIndex].text.replace(/ \(\d pers\.\)$/, "") : "À conseiller";
      var body = [
        "Bonjour,", "",
        "Je souhaite connaître vos disponibilités et le tarif pour :",
        "- Arrivée : " + fmt(E.arrivee.value),
        "- Départ : " + fmt(E.depart.value) + " (" + nights(E.arrivee.value, E.depart.value) + " nuits)",
        "- Voyageurs : " + E.personnes.value,
        "- Logement : " + ch,
        "- Petit-déjeuner : " + (E.petitdej.checked ? "oui" : "non"), "",
        E.message.value ? E.message.value + "\n" : "",
        E.nom.value, E.email.value, E.tel.value
      ].join("\n");
      var subject = "Demande de réservation – " + fmt(E.arrivee.value) + " – " + E.nom.value;
      var ok = $(".form__ok"), btn = $("button[type=submit]", form);
      function viaMail() {
        window.location.href = "mailto:" + form.dataset.to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        ok.classList.add("is-on");
      }
      if (form.dataset.endpoint && window.fetch) {
        btn.disabled = true; btn.textContent = "Envoi en cours…";
        fetch(form.dataset.endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ _subject: subject, email: E.email.value, message: body }) })
          .then(function (r) { if (!r.ok) throw r; form.hidden = true; ok.innerHTML = "<b>Merci, votre demande est bien envoyée.</b> Nous revenons vers vous personnellement par e-mail."; ok.classList.add("is-on"); ok.focus(); })
          .catch(function () { btn.disabled = false; btn.textContent = "Envoyer ma demande"; viaMail(); });
      } else viaMail();
    });
    $$("input, select, textarea", form).forEach(function (f) { f.addEventListener("input", function () { if (f.getAttribute("aria-invalid") === "true" && f.checkValidity()) f.setAttribute("aria-invalid", "false"); }); });
  }

  /* ---- Barres de recherche : envoi vers le formulaire ---- */
  $$("form[data-search]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      var a = f.elements.arrivee, d = f.elements.depart;
      if (a && d && (!a.value || !d.value) && f._dpOpen) { e.preventDefault(); f._dpOpen(a.value ? "d" : "a"); }
    });
  });
})();

/* Barre mobile : masquée tant que le formulaire principal est visible */
(function () {
  var bar = document.querySelector(".mbar"), form = document.querySelector(".hero .bookbar");
  if (!bar || !form || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(function (e) { document.body.classList.toggle("mbar-off", e[0].isIntersecting || e[0].boundingClientRect.top > 0); }).observe(form);
})();

/* Carte Google Maps chargée seulement à la demande (performance + RGPD) */
document.querySelectorAll("[data-load-map]").forEach(function (b) {
  b.addEventListener("click", function () {
    var m = b.closest(".map"), f = m.querySelector("iframe");
    f.src = f.dataset.src; f.hidden = false; m.querySelector(".map__fallback").hidden = true; f.focus();
  });
});
