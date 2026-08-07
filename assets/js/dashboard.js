/* ============================================================
   DualCore — dashboard.js
   ============================================================ */

(async () => {
  await requireAuth();
  const $ = Utils.$;
  const user = await Auth.getUser();
  if (!user) return;
  const shop = (await Utils.db.select("stores", { limit: 1 }))[0] || {};
  Utils.store.set("dc_shop", shop);

  renderSidebar("dashboard");
  const greeting = ["Good morning", "Good afternoon", "Good evening"][Math.floor((new Date().getHours()) / 8)] || "Hello";
  const greetingEl = $(".page-head h1");
  if (greetingEl) greetingEl.innerHTML = greetingEl.innerHTML.replace("{greeting}", greeting);
  $("#dashUserName").textContent = (user.name || "Store Owner").split(" ")[0];

  renderTopbar("Dashboard");

  const [products, orders, customers] = await Promise.all([
    DemoData.getProducts(user.id),
    DemoData.getOrders(user.id),
    DemoData.getCustomers(user.id),
  ]);
  const analytics = DemoData.getAnalytics();

  const totalRevenue = orders.filter(o => ["paid", "shipped"].includes(o.status)).reduce((s, o) => s + o.total, 0);
  const revenueToday = analytics.reduce((s, d) => d.date === new Date().toISOString().slice(0, 10) ? s + d.revenue : s, 0);
  const prevRevenue = totalRevenue * 0.82;
  const revDelta = Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);

  /* ---------- Stats ---------- */
  const statIcons = {
    revenue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 7h-5L12 2 8 7H3a1 1 0 0 0-1 1v2a3 3 0 0 0 3 3 3 3 0 0 0 5.2 2.2L13 18v1a2 2 0 1 0 4 0v-1l1.8-4.8A3 3 0 0 0 22 10V8a1 1 0 0 0-1-1z"/></svg>',
    customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>',
    products: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 12v9H4v-9M2 7h20v5H2z"/></svg>',
  };
  const statColors = { revenue: "#5C6EFF", orders: "#7C4DFF", customers: "#00C896", products: "#F59E0B" };
  const stats = [
    { key: "revenue", label: "Total revenue", value: Utils.fmtMoney(totalRevenue), trend: `+${revDelta}%`, up: revDelta >= 0, sub: "vs last month" },
    { key: "orders", label: "Orders", value: Utils.fmtNum(orders.length), trend: `+${orders.filter(o => o.status === "paid").length} paid`, up: true, sub: "pending: " + orders.filter(o => o.status === "pending").length },
    { key: "customers", label: "Customers", value: Utils.fmtNum(customers.length), trend: "+12%", up: true, sub: "this week" },
    { key: "products", label: "Products", value: Utils.fmtNum(products.length), trend: products.filter(p => p.status !== "active").length + " draft", up: false, sub: "live: " + products.filter(p => p.status === "active").length },
  ];
  $("#statGrid").innerHTML = stats.map(s => `
    <div class="card stat-card reveal visible">
      <div class="stat-top">
        <span class="stat-label">${s.label}</span>
        <span class="stat-icon" style="background:${statColors[s.key]}18;color:${statColors[s.key]}">${statIcons[s.key]}</span>
      </div>
      <div class="stat-value">${s.value}</div>
      <div class="flex-between">
        <span class="stat-trend ${s.up ? "trend-up" : "trend-down"}">${s.up ? "↗" : "↘"} ${s.trend}</span>
        <span class="muted" style="font-size:.76rem">${s.sub}</span>
      </div>
    </div>`).join("");

  /* ---------- Revenue + orders chart ---------- */
  const labels = analytics.map(d => {
    const dt = new Date(d.date + "T00:00:00");
    return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  });
  Charts.line($("#revenueChart"), {
    labels,
    series: [
      { values: analytics.map(d => d.revenue), color: "#5C6EFF", area: true },
      { values: analytics.map(d => d.orders * 900), color: "#00C896", area: false },
    ],
    format: (v) => "PKR " + Utils.fmtShort(v),
  });

  /* ---------- Orders by status (real data, no fake sources) ---------- */
  const statusColors = { paid: "#5C6EFF", shipped: "#00C896", pending: "#F59E0B", cancelled: "#EF4444", refunded: "#10B981" };
  const traffic = Object.entries(statusColors).map(([s, color]) => ({
    label: s[0].toUpperCase() + s.slice(1), color,
    value: orders.filter(o => o.status === s).reduce((sum, o) => sum + o.total, 0),
  })).filter(t => t.value > 0);
  if (traffic.length) {
    Charts.donut($("#trafficDonut"), { data: traffic, format: (v) => Utils.fmtShort(v) });
    $("#trafficLegend").innerHTML = traffic.map(t => `
    <div class="flex-between" style="padding:7px 0;font-size:.86rem">
      <span class="flex align-center gap-1" style="color:var(--muted)"><i style="width:10px;height:10px;border-radius:3px;background:${t.color}"></i>${t.label}</span>
      <b>${Utils.fmtShort(t.value)}</b>
    </div>`).join("");
  } else {
    $("#trafficDonut").innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:190px;text-align:center;color:var(--muted);font-size:.85rem">No orders yet.<br>Revenue by status will show here.</div>`;
    $("#trafficLegend").innerHTML = "";
  }

  /* ---------- Top products ---------- */
  const soldByProduct = {};
  orders.forEach(o => (o.items || []).forEach(it => { soldByProduct[it.id] = (soldByProduct[it.id] || 0) + 1; }));
  const topProducts = products
    .map(p => ({ p, sold: soldByProduct[p.id] || 0 }))
    .sort((a, b) => b.sold - a.sold).slice(0, 4);
  $("#topProducts").innerHTML = topProducts.length ? topProducts.map(({ p, sold }, i) => {
    const max = Math.max(1, ...topProducts.map(t => t.sold));
    return `
    <div style="padding:10px 0;border-bottom:1px dashed var(--border);${i === topProducts.length - 1 ? "border:none" : ""}">
      <div class="flex-between" style="margin-bottom:8px">
        <div class="td-flex"><span class="thumb-sm-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v9H4v-9M2 7h20v5H2z"/></svg></span>
          <span class="td-title" style="font-size:.88rem">${Utils.esc(p.name)}</span>
        </div>
        <b style="font-size:.86rem">${sold} sold</b>
      </div>
      <div class="progress-bar"><span style="width:${(sold / max) * 100}%;background:linear-gradient(90deg,#5C6EFF,#7C4DFF)"></span></div>
    </div>`;
  }).join("") : `<div class="empty-state" style="grid-column:1/-1;border:none"><div class="empty-icon" style="opacity:.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12v9H4v-9M2 7h20v5H2z"/></svg></div><p style="margin-top:8px">No products yet — add products to see top sellers.</p></div>`;

  /* ---------- Recent orders ---------- */
  const badgeCls = { paid: "badge-success", pending: "badge-warn", shipped: "badge-primary", cancelled: "badge-danger", refunded: "badge-ghost" };
  $("#recentOrders").innerHTML = orders.slice(0, 6).map(o => `
    <tr>
      <td><span class="td-title">#${o.id.slice(-6).toUpperCase()}</span></td>
      <td><div class="td-flex"><span class="avatar avatar-sm" style="background:${Utils.avatarColor(o.customer_name)}">${Utils.initials(o.customer_name)}</span>
        <div><div class="td-title">${Utils.esc(o.customer_name)}</div><div class="td-sub">${o.customer_email}</div></div></div></td>
      <td>${o.items.length}</td>
      <td><b>${Utils.fmtMoney(o.total)}</b></td>
      <td><span class="badge ${badgeCls[o.status]}">${o.status}</span></td>
      <td class="muted">${Utils.timeAgo(o.created_at)}</td>
    </tr>`).join("");

  /* ---------- Activity (derived from real orders; empty state when none) ---------- */
  const actIcons = {
    order: ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v9H4v-9M2 7h20v5H2z"/></svg>', "#5C6EFF"],
    visitor: ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>', "#7C4DFF"],
    sale: ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/></svg>', "#00C896"],
    tip: ['<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>', "#F59E0B"],
  };
  const actRows = orders.slice(0, 5).map(o => [
    "order", "New order received", `${o.customer_name} · ${o.items.length} item${o.items.length === 1 ? "" : "s"} · ${Utils.fmtMoney(o.total)}`, o.created_at,
  ]);
  $("#activityFeed").innerHTML = actRows.length ? actRows.map(([t, title, desc, ts]) => {
    const [ic, color] = actIcons[t];
    return `<div class="activity-item">
      <span class="activity-dot" style="background:${color}18;color:${color}">${ic}</span>
      <div><b>${title} #${oId(ts)}</b><p>${desc}</p></div>
      <span class="activity-time">${Utils.timeAgo(ts)}</span>
    </div>`;
  }).join("") : `<div class="empty-state" style="grid-column:1/-1;border:none"><div class="empty-icon" style="opacity:.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12v9H4v-9M2 7h20v5H2z"/></svg></div><p style="margin-top:8px">No activity yet — sales and orders will appear here.</p></div>`;

  function oId(ts) {
    const o = orders.find(x => x.created_at === ts);
    return o ? o.id.slice(-6).toUpperCase() : "";
  }

  /* ---------- Notifications badge ---------- */
  const notifs = DemoData.getNotifications(user);
  const unread = notifs.filter(n => !n.read).length;
  const orderBadge = $("#sidebarOrderBadge");
  if (orderBadge) orderBadge.textContent = unread;

  /* ---------- Global search ---------- */
  const search = $("#dashSearch");
  if (search) {
    search.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && search.value.trim()) {
        location.href = "products.html?q=" + encodeURIComponent(search.value.trim());
      }
    });
  }

  /* ---------- Chart redraw on resize ---------- */
  let t;
  window.addEventListener("resize", Utils.debounce(() => {
    Charts.line($("#revenueChart"), {
      labels,
      series: [
        { values: analytics.map(d => d.revenue), color: "#5C6EFF", area: true },
        { values: analytics.map(d => d.orders * 900), color: "#00C896", area: false },
      ],
      format: (v) => "PKR " + Utils.fmtShort(v),
    });
  }, 250));
})();