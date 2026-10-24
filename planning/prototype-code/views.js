/*
 * Main views (Tervezés / Autók / Profil), the shared modal and toasts for the B direction mock.
 * Prototype code only.
 */

const icon = (name, extra = "") => `<svg class="ic ${extra}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- Views: one visible at a time; each registers a render function ---------- */
const Views = {
  current: "plan",
  renderers: {},

  register(name, render) {
    this.renderers[name] = render;
  },

  // A side view (cars, profile): floating panel on desktop, full screen on phones.
  addPanel(name, label) {
    const app = document.querySelector(".app");
    app.insertAdjacentHTML("beforeend", `<section class="side-view ${name}-view" data-view-panel="${name}" aria-label="${label}" hidden></section>`);
    return app.querySelector(`[data-view-panel="${name}"]`);
  },

  show(view) {
    const app = document.querySelector(".app");
    this.current = view;
    app.dataset.view = view;
    document.querySelectorAll("[data-view-panel]").forEach((panel) => (panel.hidden = panel.dataset.viewPanel !== view));
    document.querySelectorAll("[data-nav]").forEach((item) => {
      item.classList.toggle("active", item.dataset.nav === view);
      item.setAttribute("aria-current", item.dataset.nav === view ? "page" : "false");
    });
    this.renderers[view]?.();
    if (location.hash !== `#${view}`) history.replaceState(null, "", `${location.search}#${view}`);
    window.dispatchEvent(new Event("resize")); // the map redraws the route beside the visible panel
  },

  // Re-renders the current view, e.g. after signing in or out.
  refresh() {
    this.renderers[this.current]?.();
  },

  bindNav() {
    document.querySelectorAll("[data-nav]").forEach((item) =>
      item.addEventListener("click", (e) => {
        e.preventDefault();
        this.show(item.dataset.nav);
      })
    );
  },
};

/* ---------- Modal: centred dialog / dropdown on desktop, bottom sheet on phones ---------- */
const Modal = {
  overlay: null,
  box: null,
  returnFocus: null,

  init() {
    document.body.insertAdjacentHTML("beforeend", `<div class="overlay" hidden><div class="modal" role="dialog" aria-modal="true"></div></div>`);
    this.overlay = document.querySelector(".overlay");
    this.box = this.overlay.querySelector(".modal");
    this.overlay.addEventListener("click", (e) => e.target === this.overlay && this.close());
    document.addEventListener("keydown", (e) => e.key === "Escape" && !this.overlay.hidden && this.close());
  },

  open(html, label, variant) {
    this.returnFocus = document.activeElement;
    this.box.className = `modal modal--${variant}`;
    this.box.setAttribute("aria-label", label);
    this.box.innerHTML = `<div class="modal-grabber" aria-hidden="true"></div>${html}`;
    this.box.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => this.close()));
    this.overlay.hidden = false;
    return this.box;
  },

  close() {
    this.overlay.hidden = true;
    this.box.innerHTML = "";
    this.returnFocus?.focus?.();
  },
};

/* ---------- Toast: short confirmation at the bottom ---------- */
const Toast = {
  show(text) {
    document.querySelector(".toast")?.remove();
    document.body.insertAdjacentHTML("beforeend", `<div class="toast" role="status">${icon("check")}${escapeHtml(text)}</div>`);
    setTimeout(() => document.querySelector(".toast")?.remove(), 2600);
  },
};
