/* ============================================================
   DualCore — pricing.js
   ============================================================ */

(() => {
  const $ = Utils.$;

  const PLANS = [
    {
      key: "free", name: "Free", price: "Free", period: "3-day trial", cta: "Start free", url: "signup.html",
      desc: "Try the full builder, no card required.",
      feats: [["1 store", 1], ["Design with all 30 themes", 1], ["Add unlimited products (preview)", 1], ["Dashboard access", 1], ["Publish website", 0], ["Custom domain", 0], ["Checkout & payments", 0]],
      pop: null,
    },
    {
      key: "basic", name: "Basic", price: 300, monthly: 300, yearly: 240, note: "For launching your first real store.",
      desc: "Everything you need to go live and start selling.",
      feats: [["Publish website", 1], ["Unlimited products & orders", 1], ["Custom domain + free SSL", 1], ["Built-in checkout", 1], ["Coupons & discounts", 1], ["Customer accounts", 1], ["Analytics (basic)", 1], ["Standard support", 1]],
      pop: "Most popular",
    },
    {
      key: "premium", name: "Premium", price: 1000, monthly: 1000, yearly: 800, note: "For brands that want everything.",
      desc: "Everything in Basic, plus serious growth tools.",
      feats: [["Everything in Basic", 1], ["Advanced analytics & reports", 1], ["Premium themes", 1], ["AI product descriptions", 1], ["AI SEO suggestions", 1], ["Abandoned cart recovery", 1], ["Email marketing", 1], ["Staff accounts", 1], ["Priority support", 1]],
      pop: "Power sellers",
    },
  ];

  const COMPARE_ROWS = [
    ["Publish website", [0, 1, 1]],
    ["Free subdomain (you.dualcore.shop)", [1, 1, 1]],
    ["Custom domain + SSL", [0, 1, 1]],
    ["Checkout & payments", [0, 1, 1]],
    ["Unlimited products", [0, 1, 1]],
    ["Unlimited orders", [0, 1, 1]],
    ["Customer accounts", [0, 1, 1]],
    ["All 30 themes", [1, 1, 1]],
    ["Premium themes", [0, 0, 1]],
    ["Analytics dashboard", [0, 1, 1]],
    ["Advanced analytics", [0, 0, 1]],
    ["Abandoned cart recovery", [0, 0, 1]],
    ["Email marketing", [0, 0, 1]],
    ["Coupons & discounts", [0, 1, 1]],
    ["AI product descriptions", [0, 0, 1]],
    ["AI SEO assistant", [0, 0, 1]],
    ["Staff accounts", [0, 0, 1]],
    ["Priority support", [0, 0, 1]],
  ];

  let yearly = false;

  const renderPlans = () => {
    const wrap = $("#pricingPlans");
    if (!wrap) return;
    wrap.innerHTML = PLANS.map((p, i) => {
      const price = p.key === "free" ? "Free" : (yearly ? p.yearly : p.monthly) + "";
      const per = p.key === "free" ? "3-day trial" : (yearly ? "/year" : "/month");
      return `
      <div class="card plan-card plan-select ${p.pop && p.key !== "free" ? "plan-popular" : ""} ${i > 0 ? "" : "reveal"}" data-plan="${p.key}" data-delay="${i}">
        ${p.pop && p.key !== "free" ? `<span class="plan-label">${p.pop.toUpperCase()}</span>` : ""}
        <div class="plan-name">${p.name}</div>
        <div class="plan-price price-anim" data-price="${price}" "><span>${price}</span><small>${per}</small></div>
        <p class="plan-desc">${p.desc}</p>
        <ul class="plan-feats">
          ${p.feats.map(([t, ok]) => `<li class="${ok ? "" : "dim"}">
            ${ok ? '<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>'
                 : '<svg class="cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>'}
            <span>${t}</span></li>`).join("")}
        </ul>
        <a href="${p.url}${p.key !== "free" ? "?plan=" + p.key : ""}" class="btn ${p.key === "free" ? "btn-ghost" : p.key === "basic" ? "btn-primary" : "btn-outline"}">
          ${p.key === "free" ? "Start Free" : yearly ? "Start yearly" : "Choose " + p.name}
        </a>
      </div>`;
    }).join("");

    wrap.querySelectorAll(".plan-select").forEach(card => {
      const priceWrap = card.querySelector(".plan-price");
      const key = card.dataset.plan;
      const p = PLANS.find(x => x.key === key);
      if (key === "free") return;
      priceWrap.innerHTML = `<span>PKR ${yearly ? p.yearly.toLocaleString() : p.monthly.toLocaleString()}</span><small>${yearly ? "/year" : "/month"}</small>`;
    });
    Utils.initReveal();
  };

  const renderCompare = () => {
    const wrap = $("#compareTable");
    if (!wrap) return;
    wrap.innerHTML = `
      <thead><tr>
        <th>Feature</th><th>Free</th><th class="col-pop">Basic</th><th>Premium</th>
      </tr></thead>
      <tbody>
        ${COMPARE_ROWS.map(([name, cells]) => `<tr>
          <td>${name}</td>
          ${cells.map((v, i) => `<td class="${i === 1 ? "col-pop" : ""}">${
            v ? '<svg class="yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" style="width:18px;height:18px"><path d="M20 6 9 17l-5-5"/></svg>'
               : '<svg class="no" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" style="width:18px;height:18px"><path d="m6 6 12 12M18 6 6 18"/></svg>'
          }</td>`).join("")}
        </tr>`).join("")}
      </tbody>`;
  };

  const toggle = $("#billingCycle");
  toggle?.addEventListener("change", () => {
    yearly = toggle.checked;
    renderPlans(true);
    toast("info", yearly ? "Yearly pricing selected — save 20%" : "Monthly pricing selected");
  });

  renderPlans();
  renderCompare();
})();