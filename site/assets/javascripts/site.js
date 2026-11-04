/* Site behaviour — kept deliberately small.
   1. In-page language toggle for pages that hold both languages in one file
      (news posts). All other pages are separate static EN / UA files.
   2. Gentle reveal-on-scroll for elements marked .reveal (skipped when the
      reader prefers reduced motion). */
(function () {
  var root = document.documentElement;

  /* 1 ── inline EN/UA toggle */
  var buttons = document.querySelectorAll("[data-set-lang]");
  if (buttons.length) {
    var apply = function (lang) {
      document.querySelectorAll("[data-en]").forEach(function (el) {
        var v = el.getAttribute(lang === "uk" ? "data-ua" : "data-en");
        if (v !== null) el.innerHTML = v;
      });
      document.querySelectorAll("[data-href-en]").forEach(function (el) {
        el.href = (lang === "uk" && el.getAttribute("data-href-ua")) || el.getAttribute("data-href-en");
      });
      buttons.forEach(function (b) {
        var on = b.getAttribute("data-set-lang") === lang;
        b.classList.toggle("is-current", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      root.setAttribute("lang", lang === "uk" ? "uk" : "en");
      try { localStorage.setItem("site-lang", lang); } catch (e) {}
    };
    var start = root.getAttribute("data-inline-lang") === "uk" ? "uk" : "en";
    apply(start);
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-set-lang")); });
    });
  }

  /* 2 ── reveal on scroll */
  var items = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!items.length) return;
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el) { io.observe(el); });
}());
