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

  /* ---- Dates : aujourd'hui minimum, départ > arrivée, nombre de nuits ---- */
  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function nights(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  var fmt = function (v) {
    try { return new Date(v + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" }); }
    catch (e) { return v; }
  };
  $$("[data-dates]").forEach(function (scope) {
    var a = $("[name=arrivee]", scope), b = $("[name=depart]", scope), out = $("[data-nights]", scope);
    if (!a || !b) return;
    var today = iso(new Date());
    a.min = today; b.min = today;
    function sync(changed) {
      if (a.value) {
        var next = new Date(a.value + "T12:00:00"); next.setDate(next.getDate() + 1);
        b.min = iso(next);
        if (changed === a && (!b.value || b.value <= a.value)) { b.value = b.min; }
      }
      if (out) {
        if (a.value && b.value && b.value > a.value) {
          var n = nights(a.value, b.value);
          out.textContent = n + (n > 1 ? " nuits" : " nuit") + " · du " + fmt(a.value) + " au " + fmt(b.value);
        } else out.textContent = out.getAttribute("data-empty") || "";
      }
    }
    a.addEventListener("change", function () { sync(a); if (!b.value || b.value <= a.value) { try { b.showPicker && b.showPicker(); } catch (e) {} } });
    b.addEventListener("change", function () { sync(b); });
    sync();
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
        var ok = (cat === "all" || r.dataset.cat === cat) && (+r.dataset.max >= guests);
        r.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = n + (n > 1 ? " logements" : " logement");
      if (empty) empty.hidden = n !== 0;
    }
    $$("[data-filter-cat]").forEach(function (b) {
      b.addEventListener("click", function () {
        cat = b.dataset.filterCat;
        $$("[data-filter-cat]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        apply();
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
      if (v && f) { f.value = v; f.dispatchEvent(new Event("change")); }
    });
    var summary = $(".form__summary", form);
    function upd() {
      var a = form.elements.arrivee.value, d = form.elements.depart.value;
      if (a && d && d > a) {
        var n = nights(a, d);
        var ch = form.elements.chambre;
        var label = ch && ch.value ? ch.options[ch.selectedIndex].text.replace(/ \(\d pers\.\)$/, "") : "Logement à conseiller";
        summary.innerHTML = "<strong>" + n + (n > 1 ? " nuits" : " nuit") + "</strong> · du " + fmt(a) + " au " + fmt(d) +
          " · " + form.elements.personnes.value + " pers. · " + label;
        summary.classList.add("is-on");
      } else summary.classList.remove("is-on");
    }
    ["arrivee", "depart", "personnes", "chambre"].forEach(function (k) { form.elements[k] && form.elements[k].addEventListener("change", upd); });
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
      if (a && d && a.value && (!d.value || d.value <= a.value)) { e.preventDefault(); d.focus(); try { d.showPicker(); } catch (x) {} }
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
