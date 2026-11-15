const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Menu mobile */
const menu = $(".menu-toggle"), nav = $(".nav");
menu?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", open ? "true" : "false");
});
$$(".nav a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open");
  menu?.setAttribute("aria-expanded", "false");
}));

/* Apparition progressive (avec petit décalage entre cartes voisines) */
const obs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target;
  const sibs = [...el.parentElement.children].filter(c => c.classList.contains("reveal"));
  const delay = Math.min(sibs.indexOf(el), 5) * 90;
  el.style.transitionDelay = delay + "ms";
  el.classList.add("visible");
  setTimeout(() => (el.style.transitionDelay = ""), 900 + delay);
  obs.unobserve(el);
}), { threshold: .1 });

/* Compteurs animés */
function runCounter(el) {
  const end = +el.dataset.count, pad = +(el.dataset.pad || 0), suf = el.dataset.suffix || "";
  const fmt = n => String(n).padStart(pad, "0") + suf;
  if (reduce) { el.textContent = fmt(end); return; }
  const t0 = performance.now(), dur = 1300;
  (function tick(t) {
    const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(end * eased));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
const cObs = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { runCounter(e.target); cObs.unobserve(e.target); }
}), { threshold: .6 });

/* Année du pied de page */
const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

/* Défilement : barre de progression, en-tête réduit, bouton retour en haut */
const header = $(".header"), bar = $("#progress"), toTop = $("#toTop");
function onScroll() {
  const h = document.documentElement.scrollHeight - innerHeight;
  if (bar && h > 0) bar.style.width = (scrollY / h * 100) + "%";
  header?.classList.toggle("scrolled", scrollY > 30);
  toTop?.classList.toggle("show", scrollY > 600);
}
addEventListener("scroll", onScroll, { passive: true }); onScroll();
toTop?.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

/* Navigation entre les pages (sans rechargement, fonctionne partout) */
const views = $$(".view"), links = $$(".nav a");
function route() {
  if (location.hash && !location.hash.startsWith("#/")) return; // ancres simples (ex. #main)
  const key = location.hash.replace(/^#\/?/, "").split("?")[0] || "accueil";
  const view = $("#view-" + key) || $("#view-404");
  views.forEach(v => { v.hidden = v !== view; v.classList.toggle("active", v === view); });
  document.title = view.dataset.title;
  $('meta[name="description"]')?.setAttribute("content", view.dataset.desc);
  links.forEach(a => {
    const on = a.getAttribute("href") === "#/" + (key === "accueil" ? "" : key);
    on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
  scrollTo({ top: 0, behavior: "auto" });
  $$(".reveal", view).forEach(el => { el.classList.remove("visible"); obs.observe(el); });
  $$("[data-count]", view).forEach(el => cObs.observe(el));
  onScroll();
}
addEventListener("hashchange", route);
route();

/* Formulaire de contact */
const form = $("#contactForm"), toast = $("#toast");
const submitBtn = form?.querySelector("button[type=submit]");
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4500);
}
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Envoi en cours…"; }
  try {
    const res = await fetch(form.action, { method: "POST", body: data, headers: { "Accept": "application/json" } });
    if (res.ok) { showToast("Merci ! Votre demande a bien été envoyée."); form.reset(); }
    else showToast("Une erreur est survenue. Réessayez ou écrivez-nous directement par email.");
  } catch (err) {
    showToast("Connexion impossible. Vérifiez votre réseau et réessayez.");
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Envoyer ma demande →"; }
  }
});
