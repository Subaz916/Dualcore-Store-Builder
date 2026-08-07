/* ============================================================
   DualCore — analytics.js
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("analytics");
  renderTopbar("Analytics", "Store performance");

  const [products, orders] = await Promise.all([DemoData.getProducts(user.id), DemoData.getOrders(user.id)]);
  const all = DemoData.getAnalytics();

  let range = 30;

  /* ---- Stat cards ---- */
  const renderStats = () => {
    const days = all.slice(-range);
    const visitors = days.reduce((s, d) => s + d.visitors, 0);
    const revenue = orders.filter(o => ["paid", "shipped"].includes(o.status)).reduce((s, o) => s + o.total, 0);
    const ordersCount = days.reduce((s, d) => s + d.orders, 0);
    const conversion = visitors ? ((ordersCount / visitors) * 100).toFixed(1) : 0;
    const prev = all.slice(-range * 2, -range);
    const prevRev = prev.reduce((s, d) => s + d.revenue, 0);
    const delta = prevRev ? Math.round(((revenue - prevRev) / prevRev) * 100) : 0;

    const stats = [
      { label: "Visitors", value: Utils.fmtNum(visitors), icon: "visitor", color: "#5C6EFF", trend: "+18%", up: true },
      { label: "Orders", value: Utils.fmtNum(ordersCount), icon: "orders", color: "#7C4DFF", trend: "+9%", up: true },
      { label: "Revenue", value: Utils.fmtMoney(revenue), icon: "revenue", color: "#00C896", trend: `${delta >= 0 ? "+" : ""}${delta}%`, up: delta >= 0 },
      { label: "Conversion rate", value: conversion + "%", icon: "convert", color: "#F59E0B", trend: "0.2% up", up: true },
    ];
    const icons = {
      visitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
      orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 7h-5L12 2 8 7H3a1 1 0 0 0-1 1v2a3 3 0 0 0 3 3 3 3 0 0 0 5.2 2.2L13 18v1a2 2 0 1 0 4 0v-1l1.8-4.8A3 3 0 0 0 22 10V8a1 1 0 0 0-1-1z"/></svg>',
      revenue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3"/></svg>',
      convert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m22 2-11 11M22 2v7M22 2h-7M11 13 9 9H6l-4 4 4 4h3l-3 3h5l4-4h3l4-4h0"/></svg>',
    };
    $("#flexStatGrid").innerHTML = stats.map(s => `
      <div class="card stat-card">
        <div class="stat-top"><span class="stat-label">${s.label}</span>
          <span class="stat-icon" style="background:${s.color}18;color:${s.color}">${icons[s.icon]}</span></div>
        <div class="stat-value">${s.value}</div>
        <span class="stat-trend ${s.up ? "trend-up" : "trend-down"}">${s.up ? "↗" : "↘"} ${s.trend}</span>
      </div>`).join("");
  };

  const renderCharts = () => {
    const days = all.slice(-range);
    const labels = days.map(d => { const dt = new Date(d.date + "T00:00:00"); return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); });

    Charts.line($("#visitorsChart"), {
      labels,
      series: [
        { values: days.map(d => d.visitors), color: "#5C6EFF", area: true },
        { values: days.map(d => d.orders * 12), color: "#00C896", area: false },
      ],
      format: Utils.fmtShort,
    });

    Charts.bars($("#revenueChartAnalytics"), {
      labels,
      values: days.map(d => d.revenue),
      color: "#7C4DFF",
    });

    // donut
    // orders by status donut (real revenue, no fake sources)
    const statusColors = { paid: "#5C6EFF", shipped: "#00C896", pending: "#F59E0B", cancelled: "#EF4444", refunded: "#10B981" };
    const traffic = Object.entries(statusColors).map(([s, color]) => ({
      label: s[0].toUpperCase() + s.slice(1), color,
      value: orders.filter(o => o.status === s).reduce((sum, o) => sum + o.total, 0),
    })).filter(t => t.value > 0);
    if (traffic.length) {
      Charts.donut($("#trafficDonut"), { data: traffic, size: 150, thickness: 18, format: (v) => Utils.fmtShort(v) });
      $("#trafficLegend2").innerHTML = traffic.map(t => `
      <div class="flex-between" style="padding:6px 0;font-size:.85rem">
        <span class="flex align-center gap-1" style="color:var(--muted)"><i style="width:10px;height:10px;border-radius:3px;background:${t.color}"></i>${t.label}</span>
        <b>${Utils.fmtShort(t.value)}</b>
      </div>`).join("");
    } else {
      $("#trafficDonut").innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:150px;color:var(--muted);font-size:.85rem;text-align:center">No orders yet</div>`;
      $("#trafficLegend2").innerHTML = "";
    }

    // top products (real sold counts from orders)
    const soldByProduct = {};
    orders.forEach(o => (o.items || []).forEach(it => { soldByProduct[it.id] = (soldByProduct[it.id] || 0) + 1; }));
    $("#topProductsAnalytics").innerHTML = products
      .map(p => ({ p, sold: soldByProduct[p.id] || 0 }))
      .sort((a, b) => b.sold - a.sold).slice(0, 5)
      .map(({ p, sold }, i) => `
      <div class="flex-between" style="padding:11px 0;border-bottom:1px dashed var(--border);${i === 4 ? "border:none" : ""}">
        <div class="td-flex">
          <span style="width:26px;font-weight:800;font-family:var(--font-display);color:var(--muted)">${i + 1}</span>
          <img class="thumb-sm" src="${p.images?.[0] || ""}" alt="" onerror="this.style.display='none'">
          <span class="td-title" style="font-size:.88rem">${Utils.esc(p.name)}</span>
        </div>
        <div class="flex align-center gap-2"><b style="font-size:.88rem">${sold}</b><span class="muted" style="font-size:.75rem">sold</span></div>
      </div>`).join("") || `<div style="text-align:center;padding:30px;color:var(--muted);font-size:.85rem">No products yet</div>`;

    // funnel
    const visitors = days.slice(-range).reduce((s, d) => s + d.visitors, 0);
    const viewProduct = Math.round(visitors * 0.42);
    const addToCart = Math.round(viewProduct * 0.38);
    const checkout = Math.round(addToCart * 0.62);
    const purchase = Math.round(checkout * 0.48);
    const funnel = [
      ["Visitors", visitors],
      ["Product views", viewProduct],
      ["Add to cart", addToCart],
      ["Begin checkout", checkout],
      ["Purchased", purchase],
    ];
    const maxW = funnel[0][1];
    $("#funnel").innerHTML = funnel.map(([label, val], i) => `
      <div style="margin-bottom:14px">
        <div class="flex-between" style="font-size:.82rem;margin-bottom:6px">
          <span style="font-weight:600">${label}</span><b>${Utils.fmtNum(val)}</b>
        </div>
        <div class="progress-bar"><span style="width:${(val / maxW) * 100}%;background:linear-gradient(90deg, ${["#5C6EFF", "#6C7BF0", "#7C4DFF", "#8F5BFF", "#00C896"][i]}, ${["#7C4DFF", "#00C896", "#00C896", "#00C896", "#00C896"][i]})"></span></div>
      </div>`).join("");
  };

  $("#rangeSelect").onchange = (e) => {
    range = +e.target.value;
    renderStats();
    renderCharts();
  };

  $("#exportAnalytics").onclick = () => {
    Utils.downloadFile("analytics-report.csv", Utils.toCSV(all.slice(-range).map(d => ({ date: d.date, visitors: d.visitors, orders: d.orders, revenue: d.revenue }))), "text/csv");
    toast("success", "Analytics report exported");
  };

  renderStats();
  renderCharts();
})();