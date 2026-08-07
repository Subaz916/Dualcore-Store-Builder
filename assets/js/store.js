/* ============================================================
   DualCore — store.js  (storefront preview page)
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("store");
  renderTopbar("Store preview", "How visitors see you");

  const shop = Utils.store.get("dc_shop") || {};
  const sections = Utils.store.get("dc_builder_sections") || DemoData.defaultSections(shop.theme);
  const products = await DemoData.getProducts(user.id);
  const slug = shop.slug || Utils.toSlug(shop.name || "mystore") || "mystore";
  $("#storeUrl").textContent = slug + "." + APP_CONFIG.PLATFORM_DOMAIN;

  // Build the storefront HTML. Try the published bundle first (demo mode),
  // otherwise render live from the builder state.
  const render = () => {
    const target = $("#storePreview");
    let html = null;
    const published = Utils.store.get("dc_published_" + slug);
    if (published?.["index.html"]) html = published["index.html"];
    if (!html) {
      // live render from builder sections + real products
      const sects = sections.map(s => {
        if (s.type === "products") return { ...s, products: products.filter(p => p.status === "active").slice(0, s.count || 8) };
        return s;
      });
      html = Storefront.renderPage(sects, shop);
    }
    target.innerHTML = html;

    // allow storefront scripts (cart) to run — clone scripts as active elements
    target.querySelectorAll("script").forEach(old => {
      const s = document.createElement("script");
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  };

  $("#openNewTab").onclick = () => {
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) { toast("warn", "Allow pop-ups for this preview"); return; }
    w.document.open();
    w.document.write(document.getElementById("storePreview").innerHTML);
    w.document.close();
  };

  render();
})();