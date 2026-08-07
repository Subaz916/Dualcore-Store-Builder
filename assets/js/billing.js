/* ============================================================
   DualCore — billing.js
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("billing");
  renderTopbar("Billing", "Plans & payments");

  let sub = await Auth.getSubscription(user.id);
  const planList = [
    { key: "free", name: "Free", price: "PKR 0", per: "3-day trial", save: "", desc: "Try the builder", feats: ["Design store", "Preview website", "All 30 themes", "No publish / checkout"] },
    { key: "basic", name: "Basic", price: "PKR 300", per: "/month", save: "Save 20% with yearly", feats: ["Publish website", "Unlimited products & orders", "Custom domain + SSL", "Checkout & coupons", "Analytics", "Customer accounts"] },
    { key: "premium", name: "Premium", price: "PKR 1,000", per: "/month", save: "Save 20% with yearly", feats: ["Everything in Basic", "Advanced analytics", "AI descriptions & SEO", "Abandoned cart recovery", "Staff accounts", "Priority support"] },
  ];
  const popular = "basic";

  const renderSummary = () => {
    const days = Utils.daysLeft(sub.end_date);
    const expired = sub.plan === "free" && days <= 0;
    $("#billingSummary").innerHTML = `
      <div>
        <span class="badge ${expired ? "badge-danger" : sub.plan === "premium" ? "badge-violet" : sub.plan === "basic" ? "badge-success" : "badge-primary"}" style="margin-bottom:8px">
          ${sub.plan.toUpperCase()}
        </span>
        <h2 style="font-size:1.4rem">You're on the <span class="gradient-text">${sub.plan}</span> plan</h2>
        <p class="muted" style="margin-top:4px">
          ${sub.plan === "free"
            ? expired ? "Trial expired — upgrade to keep publishing." : `${days} day${days === 1 ? "" : "s"} left in your free trial.`
            : `Renews ${Utils.fmtDate(sub.end_date)} · ${sub.payment_method || "Card"}`}
        </p>
      </div>
      <div class="flex gap-2">
        ${sub.plan !== "free" ? `<button class="btn btn-ghost" id="cancelPlan">Cancel subscription</button>` : ""}
        ${expired || sub.plan === "free" ? `<a href="#plans" class="btn btn-primary" id="scrollToPlans">Upgrade now</a>` : ""}
      </div>`;

    $("#scrollToPlans")?.addEventListener("click", () => location.hash = "#plans");
    $("#cancelPlan")?.addEventListener("click", async () => {
      const ok = await Components.confirmDialog({ title: "Cancel subscription?", message: "Your store will keep working until the end of the billing period, then switch to the free trial limits.", danger: true, confirmText: "Cancel plan" });
      if (!ok) return;
      sub = { ...sub, plan: "free", status: "active", end_date: sub.end_date };
      await Utils.db.update("subscriptions", { id: sub.id }, { plan: "free", status: "active" });
      toast("info", "Subscription cancelled. You'll keep access until " + Utils.fmtDate(sub.end_date));
      renderSummary(); renderPlans();
    });
  };

  const renderPlans = () => {
    $("#billingPlans").innerHTML = planList.map(p => {
      const isCurrent = sub.plan === p.key;
      const isPopular = p.key === popular;
      return `
      <div class="card plan-card ${isPopular ? "plan-popular" : ""}">
        ${isPopular ? `<span class="plan-label">MOST POPULAR</span>` : ""}
        ${isCurrent ? `<span class="badge badge-success" style="position:absolute;top:${isPopular ? 34 : 14}px;right:14px">Current plan</span>` : ""}
        <div class="plan-name">${p.name}</div>
        <div class="plan-price">${p.price}<small>${p.per}</small></div>
        <p class="plan-desc">${p.save}</p>
        <ul class="plan-feats">
          ${p.feats.map(f => `<li><svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>${f}</li>`).join("")}
        </ul>
        ${isCurrent ? `<button class="btn btn-ghost" disabled>Current plan</button>`
          : p.key === "free"
            ? `<button class="btn btn-ghost" data-downgrade="${p.key}">Switch to free</button>`
            : `<button class="btn ${isPopular ? "btn-primary" : "btn-outline"}" data-upgrade="${p.key}">Choose ${p.name}</button>`}
      </div>`;
    }).join("");

    $("#billingPlans").querySelectorAll("[data-upgrade]").forEach(b => {
      b.onclick = () => upgradePlan(b.dataset.upgrade);
    });
    $("#billingPlans").querySelectorAll("[data-downgrade]").forEach(b => {
      b.onclick = async () => {
        const ok = await Components.confirmDialog({ title: "Switch to free plan?", message: "Publishing and checkout will be paused once your paid period ends.", confirmText: "Downgrade" });
        if (!ok) return;
        await Utils.db.update("subscriptions", { id: sub.id }, { plan: "free" });
        sub.plan = "free";
        toast("info", "Downgraded to free plan");
        renderSummary(); renderPlans();
      };
    });
  };

  const upgradePlan = async (plan) => {
    // Multi-step: choose payment method → confirm
    Components.openModal(`
      <div class="modal-head"><h3>Upgrade to ${plan === "basic" ? "Basic" : "Premium"} — PKR ${plan === "basic" ? "300" : "1,000"}/month</h3><button class="modal-x" data-close>×</button></div>
      <form id="payForm" class="modal-body" novalidate>
        <div class="field"><label>Name on card</label><input class="input" id="payName" required placeholder="Full name"></div>
        <div class="field"><label>Card number</label><input class="input" id="payCard" required placeholder="4242 4242 4242 4242" inputmode="numeric" maxlength="19"></div>
        <div class="grid grid-2" style="gap:0 14px">
          <div class="field"><label>Expiry</label><input class="input" id="payExp" placeholder="MM/YY" maxlength="5" required></div>
          <div class="field"><label>CVC</label><input class="input" id="payCvc" placeholder="123" maxlength="4" required></div>
        </div>
        <div class="field">
          <label class="flex align-center gap-1" style="cursor:pointer;font-size:.9rem">
            <input type="checkbox" id="paySave" checked style="accent-color:var(--primary)"> Save card for future payments
          </label>
        </div>
        <p class="muted" style="font-size:.8rem">Test mode: this is a demo checkout. In production you'd connect a gateway (Stripe/PayFast). No real charge is made.</p>
        <div class="modal-foot" style="padding:16px 0 0;border:none">
          <button type="button" class="btn btn-ghost" data-close>Cancel</button>
          <button class="btn btn-primary" type="submit" id="payBtn">Pay PKR ${plan === "basic" ? "300" : "1,000"}</button>
        </div>
      </form>`);

    const card = $("#payCard");
    card.addEventListener("input", () => {
      let v = card.value.replace(/\D/g, "").slice(0, 16);
      card.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
    });
    const exp = $("#payExp");
    exp.addEventListener("input", () => {
      let v = exp.value.replace(/\D/g, "").slice(0, 4);
      exp.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v;
    });

    $("#payForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#payBtn");
      Components.btnLoading(btn, true);
      await new Promise(r => setTimeout(r, 900)); // simulate gateway
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 864e5);
      const updated = {
        id: sub.id || Utils.uid(), user_id: user.id, plan, status: "active",
        start_date: now.toISOString(), end_date: end.toISOString(),
        renewal: "monthly", payment_method: "Card ····" + $("#payCard").value.replace(/\s/g, "").slice(-4),
        created_at: sub.created_at || now.toISOString(),
      };
      sub = updated;
      if (updated.id === sub.id) await Utils.db.upsert("subscriptions", [updated]);
      document.querySelectorAll(".modal-backdrop").forEach(x => x.remove());
      toast("success", `You're on ${plan.toUpperCase()} now! 🚀`);
      renderSummary(); renderPlans(); renderInvoices();
    });
  };

  const renderInvoices = () => {
    const inv = sub.plan !== "free" ? [
      { id: "INV-2026-001", date: new Date(sub.start_date || Date.now()).toISOString(), amount: sub.plan === "basic" ? 300 : 1000, status: "Paid" },
      { id: "INV-2025-014", date: new Date(Date.now() - 32 * 864e5).toISOString(), amount: sub.plan === "basic" ? 300 : 1000, status: "Paid" },
    ] : [];
    $("#invoiceList").innerHTML = inv.length ? inv.map(i => `
      <div class="invoice-row">
        <div><b>${i.id}</b><div class="muted" style="font-size:.8rem">${Utils.fmtDate(i.date)}</div></div>
        <div class="flex align-center gap-2"><b>${Utils.fmtMoney(i.amount)}</b>
          <span class="badge badge-success">${i.status}</span>
          <button class="btn btn-ghost btn-sm">⬇ PDF</button></div>
      </div>`).join("") : `<div class="empty-state" style="padding:40px 16px"><p class="muted">No invoices yet — invoices appear after your first paid upgrade.</p></div>`;
  };

  renderSummary();
  renderPlans();
  renderInvoices();
})();