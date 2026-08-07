/* ============================================================
   DualCore — domains.js
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("domains");
  renderTopbar("Domains", "Connect your brand");

  const shop = Utils.store.get("dc_shop") || {};
  const sub = await Auth.getSubscription(user.id);
  const paid = Auth.planPaid(sub);
  const slug = shop.slug || Utils.toSlug(shop.name || "mystore") || "mystore";

  $("#subdomainName").textContent = slug + "." + APP_CONFIG.PLATFORM_DOMAIN;

  const renderCustom = () => {
    const domain = shop.custom_domain;
    const card = $("#customDomainCard");
    if (domain) {
      card.classList.remove("hidden");
      $("#customDomainName").textContent = domain;
      $("#customDomainStatus").textContent = "Connected — SSL active";
    }
  };

  $("#connectDomain").onclick = async () => {
    const input = $("#customDomainInput");
    const d = input.value.trim().toLowerCase().replace(/^https?:\/\//, "");
    if (!paid) {
      toast("warn", "Custom domains need the Basic plan or higher.");
      setTimeout(() => location.href = "billing.html", 900);
      return;
    }
    if (!d || !d.includes(".")) {
      toast("error", "Enter a valid domain like www.mystore.com");
      return;
    }
    // simulate DNS verification (real impl would check DNS record)
    Components.btnLoading($("#connectDomain"), true);
    await new Promise(r => setTimeout(r, 1200));
    Components.btnLoading($("#connectDomain"), false);
    shop.custom_domain = d;
    Utils.store.set("dc_shop", shop);
    await Utils.db.update("stores", { id: shop.id }, { custom_domain: d }).catch(() => {});
    toast("success", `Connected ${d} — SSL is being issued (can take a few hours).`);
    input.value = "";
    renderCustom();
  };

  $("#removeDomain").onclick = async () => {
    const ok = await Components.confirmDialog({ title: "Remove custom domain?", message: "Your store will fall back to the free subdomain.", confirmText: "Remove" });
    if (!ok) return;
    delete shop.custom_domain;
    Utils.store.set("dc_shop", shop);
    await Utils.db.update("stores", { id: shop.id }, { custom_domain: null }).catch(() => {});
    $("#customDomainCard").classList.add("hidden");
    toast("info", "Custom domain removed");
  };

  renderCustom();
})();