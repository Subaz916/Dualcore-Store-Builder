/* ============================================================
   DualCore — admin.js  (platform administration — demo data)
   Reads users/stores/subscriptions from localStorage in demo
   mode. In cloud mode, RLS keeps this read-only (owner-only), so
   this panel is informational unless a service role is wired up.
   ============================================================ */
(() => {
  const $ = (s) => document.querySelector(s);

  renderSidebar("dashboard");
  renderTopbar("Admin");

  const renderAdmin = async () => {
    const mode = window.supa ? "Supabase mode — local demo records shown below" : "Demo mode — localStorage records";
    $("#adminMode").textContent = mode;

    const users = Utils.store.get("dc_users", []);
    const stores = Utils.store.get("dc_stores", []);
    const subs = Utils.store.get("dc_subscriptions", []);
    const profiles = Utils.store.get("dc_profiles", []);

    const paidCount = subs.filter(s => (s.plan === "basic" || s.plan === "premium") && s.status === "active").length;
    const published = stores.filter(s => s.status === "published").length;

    $("#statUsers").textContent = users.length;
    $("#statStores").textContent = stores.length;
    $("#statPaid").textContent = paidCount;
    $("#statPublished").textContent = published;

    const byUser = (uid) => {
      const store = stores.find(s => s.user_id === uid);
      const sub = subs.find(s => s.user_id === uid);
      return { store, sub };
    };

    const rows = [...users].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    const tbody = $("#usersTable");
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">No accounts yet — sign up at signup.html</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((u) => {
      const { store, sub } = byUser(u.id);
      const name = u.name || profiles.find(p => p.id === u.id)?.name || "—";
      const plan = sub?.plan || "free";
      const planBadge = plan === "premium" ? "badge-violet" : plan === "basic" ? "badge-success" : "badge-primary";
      const storeName = store?.name || "—";
      const storeStatus = store ? (store.status === "published" ? "badge-success" : "badge-ghost") : "badge-ghost";
      return `<tr>
        <td><div class="td-flex">
          <span class="avatar" style="background:${Utils.avatarColor(name)}">${Utils.initials(name)}</span>
          <b>${Utils.esc(name)}</b>
        </div></td>
        <td>${Utils.esc(u.email || "—")}</td>
        <td>${u.created_at ? Utils.fmtDate(u.created_at) : "—"}</td>
        <td>${Utils.esc(storeName)} <span class="badge ${storeStatus}" style="margin-left:6px">${store?.status || "—"}</span></td>
        <td><span class="badge ${planBadge}">${plan.toUpperCase()}</span></td>
        <td class="muted">${sub ? Utils.daysLeft(sub.end_date) + "d left" : "—"}</td>
      </tr>`;
    }).join("");
  };

  $("#adminRefresh").onclick = () => { toast("info", "Refreshing…"); renderAdmin(); };
  renderAdmin();
})();