/* ============================================================
   DualCore — app.js  (global bootstrap)
   ============================================================ */

window.LOGO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>';

/* ---------- Theme ---------- */
window.applyTheme = () => {
  const saved = Utils.store.get("dc_theme");
  const dark = saved === "dark" || (saved === null && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const moon = Utils.$("#themeMoon"), sun = Utils.$("#themeSun");
  if (moon) moon.style.display = dark ? "none" : "";
  if (sun) sun.style.display = dark ? "" : "none";
};

/* ---------- Splash ---------- */
const splash = () => {
  if (!document.getElementById("dcSplash")) {
    const el = document.createElement("div");
    el.id = "dcSplash";
    el.className = "loader-screen";
    el.innerHTML = `<div class="loader-box">
        <div class="logo-mark">${window.LOGO_SVG}</div>
        <div class="spinner"></div>
        <div class="loader-text">DUALCORE</div></div>`;
    document.body.prepend(el);
  }
  setTimeout(() => {
    const el = document.getElementById("dcSplash");
    if (el) { el.classList.add("done"); setTimeout(() => el.remove(), 600); }
  }, 500);
};

/* ---------- Ripple effect on buttons ---------- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const ink = document.createElement("span");
  ink.className = "ripple-ink";
  const size = Math.max(rect.width, rect.height);
  ink.style.width = ink.style.height = size + "px";
  ink.style.left = (e.clientX - rect.left - size / 2) + "px";
  ink.style.top = (e.clientY - rect.top - size / 2) + "px";
  btn.appendChild(ink);
  setTimeout(() => ink.remove(), 650);
});

/* ---------- Sidebar (dashboard family) ---------- */
window.renderSidebar = (active) => {
  const holder = document.getElementById("sidebarMount");
  if (!holder) return;
  const items = [
    ["dashboard", "dashboard.html", "Overview", "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4l1.4-1.4M17.7 6.3l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
    ["builder", "builder.html", "Store Builder", "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"],
    ["products", "products.html", "Products", "M20 12v9H4v-9M2 7h20v5H2zM12 22v-10M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
    ["orders", "orders.html", "Orders", "M21 7h-5L12 2 8 7H3a1 1 0 0 0-1 1v2a3 3 0 0 0 3 3 3 3 0 0 0 5.2 2.2L13 18v1a2 2 0 1 0 4 0v-1l1.8-4.8A3 3 0 0 0 22 10V8a1 1 0 0 0-1-1z"],
    ["customers", "customers.html", "Customers", "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"],
    ["analytics", "analytics.html", "Analytics", "M3 3v18h18M18 17V9M13 17V5M8 17v-3"],
    ["templates", "templates.html", "Templates", "M14 3v5a1 1 0 0 0 1 1h5M15 3h4a1 1 0 0 1 1 1v4M3 9h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3M3 15h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3M15 21h5a1 1 0 0 0 1-1v-4"],
    ["billing", "billing.html", "Billing", "M2 7h20v10H2zM6 12h4"],
    ["domains", "domains.html", "Domains", "M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10c-2.5-2.5-4-6-4-10s1.5-7.5 4-10z"],
    ["settings", "settings.html", "Settings", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"],
  ];
  const storeLinks = [
    ["store", "store.html", "View Store", "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"],
    ["publish", "publish.html", "Publish", "M12 2v14m-5-5 5 5 5-5M5 22h14"],
  ];

  const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

  holder.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-head">
        <a href="dashboard.html" class="logo">
          <span class="logo-mark">${window.LOGO_SVG || ""}</span>
          <span>DualCore</span>
        </a>
        <button class="modal-x sidebar-close" id="sidebarClose" aria-label="Close menu">×</button>
      </div>

      <nav class="sidebar-nav">
        <p class="sidebar-label">Manage</p>
        ${items.map(([key, href, label, d]) => `
          <a href="${href}" class="sidebar-link ${active === key ? "active" : ""}" data-key="${key}">
            ${icon(d)}<span>${label}</span>${key === "orders" ? '<span class="sidebar-badge" id="sidebarOrderBadge"></span>' : ""}
          </a>`).join("")}

        <p class="sidebar-label">Launch</p>
        ${storeLinks.map(([key, href, label, d]) => `
          <a href="${href}" class="sidebar-link ${active === key ? "active" : ""}" data-key="${key}">
            ${icon(d)}<span>${label}</span>
          </a>`).join("")}

        <p class="sidebar-label">Platform</p>
        <a href="admin.html" class="sidebar-link ${active === "admin" ? "active" : ""}" data-key="admin">
          ${icon("M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM3.4 20a9 9 0 0 1 17.2 0")}<span>Admin Panel</span>
        </a>
      </nav>

      <div class="sidebar-foot">
        <div class="sidebar-plan-card">
          <div class="flex-between" style="margin-bottom:8px">
            <span class="badge badge-primary" id="sidebarPlanBadge">FREE TRIAL</span>
            <a href="billing.html" class="magic-link" style="font-size:.8rem">Upgrade</a>
          </div>
          <div class="progress-bar"><span id="sidebarTrialBar" style="width:100%"></span></div>
          <p class="muted" style="font-size:.78rem;margin-top:8px" id="sidebarTrialText">3 days left on trial</p>
        </div>
        <button class="sidebar-user" id="sidebarUser">
          <span class="avatar" id="sidebarAvatar">?</span>
          <span class="sidebar-user-info">
            <b id="sidebarUserName">Loading…</b>
            <small id="sidebarUserEmail"></small>
          </span>
        </button>
        <button class="sidebar-logout" id="sidebarLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Log out
        </button>
      </div>
    </aside>
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>`;

  const sidebar = Utils.$("#sidebar");
  const open = () => { sidebar.classList.add("open"); document.body.classList.add("sidebar-open"); };
  const close = () => { sidebar.classList.remove("open"); document.body.classList.remove("sidebar-open"); };
  Utils.$("#sidebarClose").onclick = close;
  Utils.$("#sidebarBackdrop").onclick = close;

  Utils.$("#sidebarLogout").onclick = async () => {
    const ok = await Components.confirmDialog({ title: "Log out?", message: "You'll need to sign in again to manage your store.", confirmText: "Log out" });
    if (!ok) return;
    await Auth.signOut();
    location.href = "index.html";
  };

  Utils.$("#sidebarUser").onclick = () => { location.href = "settings.html"; };

  populateUser();
};

async function populateUser() {
  const user = await Auth.getUser();
  const name = user?.name || "Store Owner";
  Utils.$("#sidebarAvatar").textContent = Utils.initials(name);
  Utils.$("#sidebarAvatar").style.background = Utils.avatarColor(name);
  Utils.$("#sidebarUserName").textContent = name;
  Utils.$("#sidebarUserEmail").textContent = user?.email || "";
  const initial = user?.email?.split("@")[0]?.toLowerCase() || "demo";
  Utils.store.set("dc_shop_slug", initial);

  const sub = await Auth.getSubscription(user?.id);
  const badge = Utils.$("#sidebarPlanBadge");
  if (sub) {
    badge.textContent = sub.plan.toUpperCase();
    if (sub.plan === "basic") badge.className = "badge badge-success";
    else if (sub.plan === "premium") badge.className = "badge badge-violet";
    else badge.className = "badge badge-primary";
    const left = Utils.daysLeft(sub.end_date);
    const bar = Utils.$("#sidebarTrialBar");
    const txt = Utils.$("#sidebarTrialText");
    if (sub.plan === "free") {
      const pct = Math.max(0, Math.min(100, (left / APP_CONFIG.MAX_TRIAL_DAYS) * 100));
      bar.style.width = pct + "%";
      txt.textContent = left > 0 ? `${left} day${left > 1 ? "s" : ""} left on trial` : "Trial expired — upgrade to publish";
    } else {
      bar.style.width = "100%";
      txt.textContent = `Renews ${Utils.fmtDate(sub.end_date)}`;
    }
  }
}

/* ---------- Mobile topbar (dashboard family) ---------- */
window.renderTopbar = (title, subtitle = "") => {
  const holder = document.getElementById("topbarMount");
  if (!holder) return;
  holder.innerHTML = `
    <div class="topbar">
      <button class="btn-icon" id="topbarBurger" aria-label="Open menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
      <div class="topbar-titles"><h1>${Utils.esc(title)}</h1>${subtitle ? `<p>${Utils.esc(subtitle)}</p>` : ""}</div>
      <div class="topbar-actions" id="topbarActions"></div>
    </div>`;
  Utils.$("#topbarBurger").onclick = () => Utils.$("#sidebar").classList.add("open");
};

/* ---------- Guard: redirect guests away from app pages ---------- */
window.requireAuth = async (redirect = "login.html") => {
  const ok = await Utils.isSignedIn();
  if (!ok) location.href = redirect;
  return ok;
};

/* ---------- Bootstrap ---------- */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  if (!document.body.classList.contains("app-page") || document.body.classList.contains("has-splash")) {
    // splash only for landing pages
  }
  const noSplash = document.body.classList.contains("no-splash");
  if (!noSplash) splash();
});