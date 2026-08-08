/* ============================================================
   DualCore — admin.js  (platform administration — demo data)
   Reads users/stores/subscriptions from Supabase or localStorage.
   ============================================================ */

(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  renderSidebar("admin");
  renderTopbar("Admin", "Platform administration");

  let users = [];
  let stores = [];
  let subs = [];
  let profiles = [];

  const loadData = async () => {
    // Try Supabase first if available, otherwise fallback to localStorage
    if (window.supa) {
      try {
        const { data: storeList } = await window.supa.from("stores").select("*");
        const { data: subList } = await window.supa.from("subscriptions").select("*");
        const { data: profileList } = await window.supa.from("profiles").select("*");
        
        stores = storeList || [];
        subs = subList || [];
        profiles = profileList || [];
        
        // Mapped mock users from profiles for display
        users = profiles.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email || `${p.name?.toLowerCase().replace(/\s/g, '') || 'user'}@example.com`,
          created_at: p.created_at
        }));
      } catch (err) {
        console.warn("Failed to load admin data from Supabase, using localStorage", err);
        fallbackLocal();
      }
    } else {
      fallbackLocal();
    }
  };

  const fallbackLocal = () => {
    users = Utils.store.get("dc_users", []);
    stores = Utils.store.get("dc_stores", []);
    subs = Utils.store.get("dc_subscriptions", []);
    profiles = Utils.store.get("dc_profiles", []);
  };

  const renderStats = () => {
    const mode = window.supa ? "Supabase mode — live data" : "Demo mode — localStorage records";
    $("#adminMode").textContent = mode;

    const paidCount = subs.filter(s => (s.plan === "basic" || s.plan === "premium") && s.status === "active").length;
    const published = stores.filter(s => s.status === "published").length;

    $("#statUsers").textContent = users.length;
    $("#statStores").textContent = stores.length;
    $("#statPaid").textContent = paidCount;
    $("#statPublished").textContent = published;
  };

  /* ---------- Tab Navigation ---------- */
  const setupTabs = () => {
    $$(".admin-tab").forEach(tab => {
      tab.onclick = () => {
        $$(".admin-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        $$(".admin-panel").forEach(p => p.classList.remove("active"));
        const panelId = "panel" + tab.dataset.panel.charAt(0).toUpperCase() + tab.dataset.panel.slice(1);
        const panel = $("#" + panelId);
        if (panel) panel.classList.add("active");
      };
    });
  };

  /* ---------- Tab 1: Users ---------- */
  const renderUsers = () => {
    const tbody = $("#usersTable");
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">No accounts found</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map((u) => {
      const store = stores.find(s => s.user_id === u.id);
      const sub = subs.find(s => s.user_id === u.id);
      const name = u.name || "—";
      const plan = sub?.plan || "free";
      const planBadge = plan === "premium" ? "badge-violet" : plan === "basic" ? "badge-success" : "badge-primary";
      const isBanned = u.banned === true;
      const rowClass = isBanned ? "style='opacity: 0.6; background: rgba(239, 68, 68, 0.05)'" : "";

      return `<tr ${rowClass}>
        <td><div class="td-flex">
          <span class="avatar" style="background:${Utils.avatarColor(name)}">${Utils.initials(name)}</span>
          <div>
            <b>${Utils.esc(name)}</b>
            ${isBanned ? '<br><span class="badge badge-danger" style="font-size:0.65rem">Banned</span>' : ''}
          </div>
        </div></td>
        <td>${Utils.esc(u.email || "—")}</td>
        <td>${u.created_at ? Utils.fmtDate(u.created_at) : "—"}</td>
        <td>
          <select class="select change-plan" data-uid="${u.id}" style="padding:6px; font-size:.8rem; width:auto; font-weight:600">
            <option value="free" ${plan === 'free' ? 'selected' : ''}>FREE</option>
            <option value="basic" ${plan === 'basic' ? 'selected' : ''}>BASIC</option>
            <option value="premium" ${plan === 'premium' ? 'selected' : ''}>PREMIUM</option>
          </select>
        </td>
        <td class="muted">${sub ? Utils.daysLeft(sub.end_date) + "d left" : "—"}</td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm toggle-ban" data-uid="${u.id}">
              ${isBanned ? "Unban" : "Ban"}
            </button>
          </div>
        </td>
      </tr>`;
    }).join("");

    bindUserEvents();
  };

  const bindUserEvents = () => {
    $$(".change-plan").forEach(sel => {
      sel.onchange = async () => {
        const uid = sel.dataset.uid;
        const newPlan = sel.value;
        const end = new Date();
        end.setDate(end.getDate() + 30); // extend by 30 days
        
        let sub = subs.find(s => s.user_id === uid);
        if (sub) {
          sub.plan = newPlan;
          sub.end_date = end.toISOString();
          sub.status = "active";
        } else {
          sub = { id: Utils.uid(), user_id: uid, plan: newPlan, status: "active", start_date: new Date().toISOString(), end_date: end.toISOString() };
          subs.push(sub);
        }

        if (window.supa) {
          try {
            await window.supa.from("subscriptions").upsert(sub);
          } catch(e) {}
        }
        
        Utils.store.set("dc_subscriptions", subs);
        toast("success", `Plan updated to ${newPlan.toUpperCase()}`);
        renderAdmin();
      };
    });

    $$(".toggle-ban").forEach(btn => {
      btn.onclick = async () => {
        const uid = btn.dataset.uid;
        const u = users.find(x => x.id === uid);
        if (!u) return;

        const isBanned = u.banned === true;
        u.banned = !isBanned;

        if (window.supa) {
          try {
            await window.supa.from("profiles").update({ banned: u.banned }).eq("id", uid);
          } catch(e) {}
        }

        Utils.store.set("dc_users", users);
        toast("info", u.banned ? "User account banned" : "User account unbanned");
        renderAdmin();
      };
    });
  };

  /* ---------- Tab 2: Stores ---------- */
  const renderStores = () => {
    const tbody = $("#storesTable");
    if (!stores.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center;padding:24px">No stores found</td></tr>`;
      return;
    }

    tbody.innerHTML = stores.map((s) => {
      const statusBadge = s.status === "published" ? "badge-success" : "badge-ghost";
      const subdomain = `${s.slug || Utils.toSlug(s.name || 'mystore')}.dualcore.shop`;
      return `<tr>
        <td><b>${Utils.esc(s.name || "My Store")}</b></td>
        <td><a href="store.html" target="_blank" style="color:var(--primary)">${subdomain}</a></td>
        <td>${s.custom_domain ? `<code>${Utils.esc(s.custom_domain)}</code>` : '<span class="muted">—</span>'}</td>
        <td><span class="badge ${statusBadge}">${s.status || "draft"}</span></td>
        <td class="muted">${s.published_at ? Utils.fmtDate(s.published_at) : "Never"}</td>
        <td>
          <button class="btn btn-ghost btn-sm delete-store" data-id="${s.id}" style="color:var(--danger)">Delete</button>
        </td>
      </tr>`;
    }).join("");

    bindStoreEvents();
  };

  const bindStoreEvents = () => {
    $$(".delete-store").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const store = stores.find(s => s.id === id);
        if (!store) return;

        Components.confirmDialog({
          title: "Delete Store?",
          message: `Are you sure you want to delete "${store.name || 'this store'}"? This action is permanent.`,
          danger: true,
          confirmText: "Delete Store"
        }).then(async (ok) => {
          if (!ok) return;

          stores = stores.filter(s => s.id !== id);
          Utils.store.set("dc_stores", stores);

          if (window.supa) {
            try {
              await window.supa.from("stores").delete().eq("id", id);
            } catch(e) {}
          }

          toast("success", "Store deleted successfully");
          renderAdmin();
        });
      };
    });
  };

  /* ---------- Tab 3: Feature Flags & Announcements ---------- */
  const setupFeaturesAndBroadcast = () => {
    // Feature Flags loading
    const flags = Utils.store.get("dc_flags", { domains: true, grace: false, sync: true });
    $("#flagDomains").checked = flags.domains !== false;
    $("#flagTrialGrace").checked = flags.grace === true;
    $("#flagSync").checked = flags.sync !== false;

    $("#saveFlagsBtn").onclick = () => {
      const nextFlags = {
        domains: $("#flagDomains").checked,
        grace: $("#flagTrialGrace").checked,
        sync: $("#flagSync").checked
      };
      Utils.store.set("dc_flags", nextFlags);
      toast("success", "Feature flags saved!");
    };

    // Broadcast Announcement Form
    $("#broadcastForm").onsubmit = async (e) => {
      e.preventDefault();
      const title = $("#bcTitle").value.trim();
      const message = $("#bcMessage").value.trim();

      const notification = {
        id: Utils.uid(),
        title,
        message,
        type: "broadcast",
        created_at: new Date().toISOString()
      };

      // Store in notifications list
      const notifications = Utils.store.get("dc_notifications", []);
      notifications.unshift(notification);
      Utils.store.set("dc_notifications", notifications);

      if (window.supa) {
        try {
          await window.supa.from("notifications").insert(notification);
        } catch(e) {}
      }

      toast("success", "Announcement broadcasted to all dashboards! ⚡");
      $("#bcTitle").value = "";
      $("#bcMessage").value = "";
    };
  };

  const renderAdmin = async () => {
    await loadData();
    renderStats();
    renderUsers();
    renderStores();
  };

  $("#adminRefresh").onclick = () => { toast("info", "Refreshing…"); renderAdmin(); };

  // Init sequence
  setupTabs();
  setupFeaturesAndBroadcast();
  renderAdmin();

})();