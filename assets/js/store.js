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
  const slug = shop.slug || Utils.toSlug(shop.name || "mystore") || "mystore";
  $("#storeUrl").textContent = slug + "." + APP_CONFIG.PLATFORM_DOMAIN;

  // Load sections from Supabase (cloud) or localStorage (demo)
  const loadSections = async () => {
    // Try Supabase pages table first (builder saves here with id: "builder")
    if (window.supa && shop.id) {
      try {
        const { data, error } = await window.supa
          .from("pages")
          .select("content")
          .eq("id", "builder")
          .eq("store_id", shop.id)
          .single();
        if (!error && data?.content) {
          return data.content;
        }
      } catch (err) {
        console.warn("Failed to load from pages table:", err);
      }
    }
    // Fallback to localStorage
    const local = Utils.store.get("dc_builder_sections");
    return (local && Array.isArray(local) && local.length > 0) ? local : DemoData.defaultSections(shop.theme);
  };

  const products = await DemoData.getProducts(user.id);

  // Build the storefront HTML. Try the published bundle first (demo mode),
  // otherwise render live from the builder state.
  const render = async () => {
    const target = $("#storePreview");
    let html = null;

    // 1. Try published bundle (localStorage demo mode)
    const published = Utils.store.get("dc_published_" + slug);
    if (published?.["index.html"]) {
      html = published["index.html"];
    } else {
      // 2. Live render from builder sections + real products
      const sections = await loadSections();
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