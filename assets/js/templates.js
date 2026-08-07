/* ============================================================
   DualCore — templates.js  (theme gallery)
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("templates");
  renderTopbar("Templates", "Choose a starting theme");

  const THEMES = Storefront.THEMES;
  const categories = [
    ["fashion", "Clothing", "Fashion"],
    ["electronics", "Electronics", "Electronics"],
    ["furniture", "Furniture", "Home"],
    ["jewelry", "Jewelry", "Accessories"],
    ["shoes", "Shoes", "Fashion"],
    ["food", "Food", "Food & Drink"],
    ["restaurant", "Restaurant", "Food & Drink"],
    ["coffee", "Coffee", "Food & Drink"],
    ["bakery", "Bakery", "Food & Drink"],
    ["books", "Books", "Media"],
    ["sports", "Sports", "Active"],
    ["beauty", "Beauty", "Wellness"],
    ["perfume", "Perfume", "Wellness"],
    ["gaming", "Gaming", "Digital"],
    ["pets", "Pets", "Lifestyle"],
    ["digital", "Digital Products", "Digital"],
    ["courses", "Courses", "Digital"],
    ["medical", "Medical", "Wellness"],
    ["agency", "Agency", "Business"],
    ["portfolio", "Portfolio", "Business"],
    ["photography", "Photography", "Media"],
    ["cars", "Cars", "Motor"],
    ["bike", "Bike", "Motor"],
    ["flowers", "Flowers", "Lifestyle"],
    ["homedecor", "Home Decor", "Home"],
    ["organic", "Organic", "Food & Drink"],
    ["kids", "Kids", "Lifestyle"],
    ["luxury", "Luxury", "Accessories"],
    ["minimal", "Minimal", "Business"],
  ];

  const catName = (slug) => categories.find(c => c[0] === slug)?.[2] || "General";

  const renderFilters = () => {
    const cats = [...new Set(categories.map(c => c[2]))];
    const wrap = $("#themeFilters");
    wrap.innerHTML = `<button class="chip active" data-cat="all">All</button>` +
      cats.map(c => `<button class="chip" data-cat="${c}">${c}</button>`).join("");
    wrap.querySelectorAll(".chip").forEach(ch => {
      ch.onclick = () => {
        wrap.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
        ch.classList.add("active");
        renderGrid(ch.dataset.cat, $("#themeSearch").value);
      };
    });
  };

  const renderGrid = (cat = "all", q = "") => {
    const grid = $("#themeGrid");
    const list = THEMES.filter(t => {
      const c = catName(t.slug);
      const matchCat = cat === "all" || c === cat;
      const matchQ = t.name.toLowerCase().includes(q.toLowerCase()) || t.slug.includes(q.toLowerCase());
      return matchCat && matchQ;
    });

    grid.innerHTML = list.map(t => {
      const cat = catName(t.slug);
      return `
      <div class="card card-hover theme-card reveal" data-theme="${t.slug}" style="padding:0;overflow:hidden">
        <div class="theme-preview" style="background:linear-gradient(135deg, ${t.soft}, ${t.accent}22)">
          <div class="theme-preview-nav">
            <span style="background:${t.accent};color:#fff;border-radius:8px;padding:4px 10px;font-size:.7rem;font-weight:700">${t.name}</span>
            <span class="chip" style="border-color:rgba(255,255,255,.4);color:${t.accent}">${cat}</span>
          </div>
          <div class="mini-hero" style="background:linear-gradient(120deg, ${t.accent}, ${t.accent}88)">
            <div style="color:#fff;font-weight:800;font-size:1rem;font-family:${t.font}">Big bold headline</div>
            <div style="color:rgba(255,255,255,.8);font-size:.7rem;margin-top:4px">Subtitle text for hero section</div>
            <div style="display:flex;gap:6px;margin-top:10px">
              <span style="background:#fff;color:${t.accent};border-radius:99px;padding:4px 12px;font-size:.65rem;font-weight:700">Button</span>
              <span style="border:1px solid #fff;color:#fff;border-radius:99px;padding:4px 12px;font-size:.65rem">Ghost</span>
            </div>
          </div>
        </div>
        <div class="theme-body" style="padding:16px">
          <div class="flex-between">
            <div>
              <h3 style="font-size:1rem;margin-bottom:2px">${t.name}</h3>
              <p class="muted" style="font-size:.78rem">${cat} theme · ${Utils.esc(t.font.split(",")[0])} fonts</p>
            </div>
          </div>
          <div class="flex" style="gap:8px;margin-top:14px">
            <button class="btn btn-primary btn-sm theme-use" data-theme="${t.slug}">Use this theme</button>
            <button class="btn btn-ghost btn-sm theme-preview-btn" data-theme="${t.slug}" title="Quick preview">Preview</button>
          </div>
        </div>
      </div>`;
    }).join("");

grid.querySelectorAll(".theme-use").forEach(btn => {
      btn.onclick = async () => {
        const shop = (await Utils.db.select("stores", { limit: 1 }))[0] || {};
        shop.theme = btn.dataset.theme;
        Utils.store.set("dc_shop", shop);
        if (shop.id) Utils.db.update("stores", { id: shop.id }, { theme: shop.theme }).catch(() => {});
        toast("success", `${btn.dataset.theme} theme applied — open the builder to customize.`);
        setTimeout(() => location.href = "builder.html", 800);
      };
    });

    grid.querySelectorAll(".theme-preview-btn").forEach(btn => {
      btn.onclick = () => {
        const th = Storefront.getTheme(btn.dataset.theme);
        const sections = DemoData.defaultSections(btn.dataset.theme);
        const html = Storefront.renderPage(sections, { name: "Preview Store", tagline: "Previewing " + th.name, theme: btn.dataset.theme });
        const w = window.open("", "_blank", "width=1200,height=800");
        if (w) { w.document.open(); w.document.write(html); w.document.close(); }
      };
    });

    Utils.initReveal();
  };

  renderFilters();
  renderGrid();
  $("#themeSearch").addEventListener("input", Utils.debounce(e => {
    const active = $("#themeFilters .chip.active")?.dataset?.cat || "all";
    renderGrid(active, e.target.value);
  }, 200));
})();