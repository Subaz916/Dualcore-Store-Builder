/* ============================================================
   DualCore — components.js  (toast, modal, loader, confirm)
   ============================================================ */

const Components = (() => {
  const ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 12v4"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4M12 17.5h.01"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
  };

  /* ---------------- Toast ---------------- */
  const toast = (type = "info", message, ms = 3800) => {
    let stack = Utils.$(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
      <div class="toast-msg">${Utils.esc(message)}</div>
      <button class="toast-close" aria-label="Dismiss">×</button>`;
    stack.appendChild(el);
    const kill = () => { el.classList.add("toast-out"); setTimeout(() => el.remove(), 420); };
    el.querySelector(".toast-close").onclick = kill;
    if (ms) setTimeout(kill, ms);
    return el;
  };

  /* ---------------- Confirm dialog ---------------- */
  const confirmDialog = ({ title = "Are you sure?", message = "", confirmText = "Confirm", danger = false, cancelText = "Cancel" }) => {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-backdrop open";
      overlay.innerHTML = `
        <div class="modal" style="max-width:420px">
          <div class="modal-head"><h3>${Utils.esc(title)}</h3>
            <button class="modal-x" data-close aria-label="Close">×</button></div>
          <div class="modal-body"><p class="muted" style="margin:0">${Utils.esc(message)}</p></div>
          <div class="modal-foot">
            <button class="btn btn-ghost" data-cancel>${Utils.esc(cancelText)}</button>
            <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm>${Utils.esc(confirmText)}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const done = (val) => { overlay.remove(); resolve(val); };
      overlay.querySelector("[data-close]").onclick = () => done(false);
      overlay.querySelector("[data-cancel]").onclick = () => done(false);
      overlay.querySelector("[data-confirm]").onclick = () => done(true);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) done(false); });
      Utils.onEscape(() => done(false));
    });
  };

  /* ---------------- Modal ---------------- */
  const openModal = (html, { width = 500 } = {}) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.innerHTML = `<div class="modal" style="max-width:${width}px">${html}</div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));
    const close = () => { overlay.classList.remove("open"); setTimeout(() => overlay.remove(), 300); };
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    const x = overlay.querySelector("[data-close]");
    if (x) x.onclick = close;
    Utils.onEscape(close);
    return { overlay, close, el: overlay.querySelector(".modal") };
  };

  /* ---------------- Loader ---------------- */
  const loader = {
    show(text = "Loading…") {
      let el = Utils.$("#app-loader");
      if (!el) {
        el = document.createElement("div");
        el.id = "app-loader";
        el.className = "loader-screen";
        document.body.appendChild(el);
      }
      el.innerHTML = `<div class="loader-box">
          <div class="logo-mark">${LOGO_SVG}</div>
          <div class="spinner"></div>
          <div class="loader-text">${Utils.esc(text)}</div></div>`;
      return el;
    },
    hide() {
      const el = Utils.$("#app-loader");
      if (el) { el.classList.add("done"); setTimeout(() => el.remove(), 600); }
    },
    done() { this.hide(); },
  };

  /* ---------------- Splash screen on page load ---------------- */
  const splash = () => {
    const el = document.createElement("div");
    el.className = "loader-screen";
    el.innerHTML = `<div class="loader-box">
        <div class="logo-mark">${LOGO_SVG}</div>
        <div class="spinner"></div>
        <div class="loader-text">DUALCORE</div></div>`;
    document.body.prepend(el);
    window.addEventListener("load", () => setTimeout(() => {
      el.classList.add("done");
      setTimeout(() => el.remove(), 600);
      document.body.classList.add("page-enter");
    }, 350));
  };

  /* ---------------- Button loading state ---------------- */
  const btnLoading = (btn, loading, { keepText = false } = {}) => {
    if (loading) {
      btn.dataset.text = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = keepText ? `<span class="loader-inline"></span>&nbsp;${btn.dataset.text}` : `<span class="loader-inline"></span>`;
      btn.style.pointerEvents = "none";
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.text || btn.innerHTML;
      btn.style.pointerEvents = "";
    }
  };

  /* ---------------- Progress bar (top) ---------------- */
  const progress = {
    bar: null,
    init() {
      if (!this.bar) {
        this.bar = document.createElement("div");
        this.bar.className = "scroll-progress";
        document.body.appendChild(this.bar);
      }
    },
    set(pct) { this.init(); this.bar.style.width = pct + "%"; },
    pulse() {
      this.init();
      this.bar.style.width = "30%";
      setTimeout(() => this.bar.style.width = "70%", 300);
      setTimeout(() => this.bar.style.width = "100%", 800);
    },
  };

  return { toast, confirmDialog, openModal, loader, splash, btnLoading, progress };
})();

window.toast = Components.toast;
window.Components = Components;