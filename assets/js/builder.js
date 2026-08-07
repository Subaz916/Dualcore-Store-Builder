/* ============================================================
   DualCore — builder.js  (visual store builder logic)
   ============================================================ */

(() => {
  const $ = Utils.$;
  const $$ = Utils.$$;

  const LIBRARY = [
    { group: "Basics", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", items: [
      { type: "hero", label: "Hero", desc: "Big banner with title & CTA" },
      { type: "products", label: "Products", desc: "Product grid / list" },
      { type: "categories", label: "Categories", desc: "Shop-by-category tiles" },
    ]},
    { group: "Social proof", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", items: [
      { type: "testimonials", label: "Testimonials", desc: "Customer quotes" },
      { type: "gallery", label: "Gallery", desc: "Image lookbook" },
    ]},
    { group: "Engage", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", items: [
      { type: "video", label: "Video", desc: "Embed a video" },
      { type: "faq", label: "FAQ", desc: "Questions & answers" },
      { type: "newsletter", label: "Newsletter", desc: "Email signup" },
      { type: "contact", label: "Contact", desc: "Contact form" },
    ]},
  ];

  const EDITOR_SCHEMAS = {
    hero: [
      { key: "eyebrow", label: "Eyebrow text", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "button", label: "Button text", type: "text" },
      { key: "secondary", label: "Secondary button text", type: "text" },
      { key: "image", label: "Image URL", type: "text" },
    ],
    products: [
      { key: "title", label: "Section title", type: "text" },
      { key: "count", label: "Number of products", type: "number" },
      { key: "layout", label: "Layout", type: "select", options: [["grid", "Grid"], ["list", "List"]] },
    ],
    categories: [
      { key: "title", label: "Section title", type: "text" },
      { key: "cats", label: "Categories (comma separated)", type: "text" },
    ],
    testimonials: [
      { key: "title", label: "Section title", type: "text" },
      { key: "t1", label: "Testimonial 1", type: "textarea" },
      { key: "t2", label: "Testimonial 2", type: "textarea" },
      { key: "t3", label: "Testimonial 3", type: "textarea" },
    ],
    gallery: [
      { key: "title", label: "Section title", type: "text" },
      { key: "images", label: "Image URLs (comma separated)", type: "textarea" },
    ],
    video: [
      { key: "title", label: "Section title", type: "text" },
      { key: "videoUrl", label: "Video URL (mp4)", type: "text" },
    ],
    faq: [
      { key: "title", label: "Section title", type: "text" },
      { key: "q1", label: "Question 1", type: "text" },
      { key: "a1", label: "Answer 1", type: "textarea" },
      { key: "q2", label: "Question 2", type: "text" },
      { key: "a2", label: "Answer 2", type: "textarea" },
      { key: "q3", label: "Question 3", type: "text" },
      { key: "a3", label: "Answer 3", type: "textarea" },
    ],
    newsletter: [
      { key: "title", label: "Section title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
    ],
    contact: [
      { key: "title", label: "Section title", type: "text" },
    ],
  };

  let sections = [];
  let history = [];
  let historyIndex = -1;
  let selectedId = null;
  let products = [];

  const loadState = () => {
    const saved = Utils.store.get("dc_builder_sections");
    if (saved && Array.isArray(saved)) sections = saved;
    else {
      sections = DemoData.defaultSections();
      Utils.store.set("dc_builder_sections", sections);
    }
    pushHistory(false);
  };

  const pushHistory = (record = true) => {
    if (record) {
      history = history.slice(0, historyIndex + 1);
      history.push(JSON.stringify(sections));
      if (history.length > 50) history.shift();
      historyIndex = history.length - 1;
    } else {
      history = [JSON.stringify(sections)];
      historyIndex = 0;
    }
    $("undoBtn").disabled = historyIndex <= 0;
    $("redoBtn").disabled = historyIndex >= history.length - 1;
  };

  const save = () => {
    Utils.store.set("dc_builder_sections", sections);
    Components.progress.pulse();
    // persist to Supabase if available (page-level snapshot)
    if (window.supa) {
      Utils.db.upsert("pages", [{ id: "builder", store_id: (Utils.store.get("dc_shop") || {}).id, content: sections, updated_at: new Date().toISOString() }]).catch(() => {});
    }
  };

  const autosave = Utils.debounce(() => { save(); toast("info", "Auto-saved ✓"); }, 1400);

  /* ---------- Section library ---------- */
  const renderLibrary = () => {
    const wrap = $("#sectionLibrary");
    wrap.innerHTML = LIBRARY.map(g => `
      <div class="section-group">
        <h4>${g.group}</h4>
        ${g.items.map(i => `
          <div class="section-item" draggable="true" data-type="${i.type}">
            <span class="section-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${g.icon}"/></svg></span>
            <span>${i.label}</span>
            <small class="muted" style="display:block;font-size:.72rem">${i.desc}</small>
          </div>`).join("")}
      </div>`).join("");
  };

  const newSection = (type) => {
    const base = { id: Utils.uid(), type, visible: true, title: defaultTitle(type) };
    const seed = {
      hero: { eyebrow: "New collection", title: "Welcome to the collection", subtitle: "Discover hand-picked products loved by thousands of happy customers.", button: "Shop now", secondary: "Learn more", image: null },
      products: { title: "Featured Products", count: 8, layout: "grid" },
      categories: { title: "Shop by Category", cats: "Fashion, Electronics, Home, Beauty, Sports, Books" },
      testimonials: { title: "What customers say" },
      gallery: { title: "Gallery" },
      video: { title: "Video" },
      faq: { title: "Frequently asked questions" },
      newsletter: { title: "Join our list", subtitle: "Get 10% off your first order." },
      contact: { title: "Get in touch" },
    };
    return { ...base, ...(seed[type] || {}) };
  };

  const defaultTitle = (t) => ({ hero: "Hero", products: "Products", categories: "Categories", testimonials: "Testimonials", gallery: "Gallery", video: "Video", faq: "FAQ", newsletter: "Newsletter", contact: "Contact" }[t] || "Section");

  /* ---------- Render canvas ---------- */
  const renderCanvas = () => {
    const canvas = $("#canvas");
    const shop = Utils.store.get("dc_shop") || { name: "My Store", tagline: "", theme: "minimal" };
    $("#deviceUrl").textContent = (Utils.toSlug(shop.name || "mystore") || "mystore") + ".dualcore.shop";
    $("#storeNameInput").value = shop.name || "";
    $("#storeTaglineInput").value = shop.tagline || "";

    // inject live product data into products sections
    const sectionsForRender = sections.map(s => {
      if (s.type === "products") {
        return { ...s, products: products.filter(p => p.status === "active").slice(0, s.count || 8) };
      }
      return s;
    });

    if (!sectionsForRender.length) {
      canvas.innerHTML = `<div class="canvas-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;opacity:.4"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>
        <h3>Your store is empty</h3>
        <p class="muted">Drag sections from the left panel to start building</p>
      </div>`;
      return;
    }

    canvas.innerHTML = sectionsForRender.map(s => Storefront.renderSection(s)).join("");
    // mark selected
    if (selectedId) {
      const el = canvas.querySelector(`[data-id="${selectedId}"]`);
      if (el) el.classList.add("selected");
    }
    bindCanvasEvents(canvas);
  };

  const bindCanvasEvents = (canvas) => {
    // section tools
    canvas.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const wrap = btn.closest(".sf-wrap");
        const id = wrap.dataset.id;
        const idx = sections.findIndex(s => s.id === id);
        const act = btn.dataset.action;
        if (act === "edit") selectSection(id);
        if (act === "dup") { sections.splice(idx, 0, { ...sections[idx], id: Utils.uid() }); pushHistory(); renderCanvas(); toast("success", "Section duplicated"); }
        if (act === "hide") { sections[idx].visible = !sections[idx].visible; pushHistory(); renderCanvas(); toast("info", sections[idx].visible ? "Section shown" : "Section hidden"); }
        if (act === "del") {
          Components.confirmDialog({ title: "Delete section?", message: `Delete "${sections[idx].title || sections[idx].type}"? This can't be undone.`, danger: true, confirmText: "Delete" }).then(ok => {
            if (!ok) return;
            sections.splice(idx, 1); if (selectedId === id) closeEditor(); pushHistory(); renderCanvas(); toast("success", "Section deleted");
          });
        }
        autosave();
      });
    });

    // drag reorder on canvas
    canvas.querySelectorAll(".sf-wrap").forEach(wrap => {
      wrap.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", wrap.dataset.id);
        wrap.classList.add("dragging");
      });
      wrap.addEventListener("dragend", () => wrap.classList.remove("dragging"));
      wrap.addEventListener("dragover", (e) => e.preventDefault());
      wrap.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData("text/plain");
        const toId = wrap.dataset.id;
        if (fromId === toId) return;
        const from = sections.findIndex(s => s.id === fromId);
        const to = sections.findIndex(s => s.id === toId);
        if (from < 0 || to < 0) return;
        const [moved] = sections.splice(from, 1);
        sections.splice(to, 0, moved);
        pushHistory(); renderCanvas(); autosave();
        toast("success", "Section moved");
      });
    });

    // click to select
    canvas.querySelectorAll(".sf-wrap").forEach(wrap => {
      wrap.addEventListener("click", (e) => {
        if (e.target.closest("[data-action]")) return;
        selectSection(wrap.dataset.id);
      });
    });
  };

  /* ---------- Section editor ---------- */
  const selectSection = (id) => {
    selectedId = id;
    const s = sections.find(x => x.id === id);
    if (!s) return;
    renderCanvas();
    const editor = $("#sectionEditor");
    editor.classList.remove("hidden");
    $("#editorTitle").textContent = `Edit ${defaultTitle(s.type)}`;
    const schema = EDITOR_SCHEMAS[s.type] || [];
    const fields = [];

    // common: visible toggle
    fields.push(`<div class="editor-field checkbox"><input type="checkbox" id="fld-visible" ${s.visible ? "checked" : ""}><label for="fld-visible">Show on store</label></div>`);

    for (const f of schema) {
      if (f.type === "select") {
        fields.push(`<div class="editor-field"><label>${f.label}</label>
          <select class="select" id="fld-${f.key}">${f.options.map(([v, l]) => `<option value="${v}" ${s[f.key] === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>`);
      } else if (f.type === "textarea") {
        fields.push(`<div class="editor-field"><label>${f.label}</label><textarea class="textarea" id="fld-${f.key}" rows="3">${Utils.esc(s[f.key] || "")}</textarea></div>`);
      } else if (f.type === "number") {
        fields.push(`<div class="editor-field"><label>${f.label}</label><input class="input" type="number" id="fld-${f.key}" value="${s[f.key] ?? ""}"></div>`);
      } else {
        fields.push(`<div class="editor-field"><label>${f.label}</label><input class="input" type="text" id="fld-${f.key}" value="${Utils.esc(s[f.key] || "")}"></div>`);
      }
    }
    $("#editorFields").innerHTML = fields.join("");

    // listeners
    $$("#editorFields input, #editorFields select, #editorFields textarea").forEach(el => {
      el.addEventListener("input", () => {
        const s2 = sections.find(x => x.id === selectedId);
        const key = el.id.replace("fld-", "");
        if (key === "visible") s2.visible = el.checked;
        else {
          const schema2 = EDITOR_SCHEMAS[s2.type] || [];
          const isCats = key === "cats";
          if (isCats) s2.cats = el.value;
          else s2[key] = key === "count" ? parseInt(el.value) || 8 : el.value;
          // normalize categories list for rendering
          if (s2.type === "categories") s2.categories = s2.cats.split(",").map(c => c.trim()).filter(Boolean);
        }
        pushHistory();
        renderCanvas();
        selectSection(selectedId); // re-render editor with saved values
        autosave();
      });
    });
  };

  const closeEditor = () => {
    selectedId = null;
    $("#sectionEditor").classList.add("hidden");
    renderCanvas();
  };

  /* ---------- Drag from library ---------- */
  const bindLibraryDrag = () => {
    $$(".section-item").forEach(item => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", "new:" + item.dataset.type);
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
    });
    const canvas = $("#canvas");
    canvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      canvas.classList.add("drop-zone");
    });
    canvas.addEventListener("dragleave", (e) => {
      if (!canvas.contains(e.relatedTarget)) canvas.classList.remove("drop-zone");
    });
    canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      canvas.classList.remove("drop-zone");
      const data = e.dataTransfer.getData("text/plain");
      if (!data) return;
      if (data.startsWith("new:")) {
        const type = data.replace("new:", "");
        const s = newSection(type);
        sections.push(s);
        pushHistory(); renderCanvas(); autosave();
        selectSection(s.id);
        toast("success", `${defaultTitle(type)} added`);
      }
    });
  };

  /* ---------- Undo / redo ---------- */
  const undo = () => {
    if (historyIndex <= 0) return;
    historyIndex--;
    sections = JSON.parse(history[historyIndex]);
    renderCanvas(); closeEditor(); save();
  };
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    sections = JSON.parse(history[historyIndex]);
    renderCanvas(); closeEditor(); save();
  };

  /* ---------- Device switching ---------- */
  const setDevice = (d) => {
    document.body.dataset.device = d;
    const canvasWrap = $("#canvasWrap");
    canvasWrap.setAttribute("data-device", d);
  };

  /* ---------- Theme ---------- */
  const renderThemeControls = () => {
    const shop = Utils.store.get("dc_shop") || { theme: "minimal" };
    const select = $("#themeSelect");
    select.innerHTML = Storefront.THEMES.map(t => `<option value="${t.slug}" ${shop.theme === t.slug ? "selected" : ""}>${t.name}</option>`).join("");
    const theme = Storefront.getTheme(shop.theme);
    $("#themePrimary").value = shop.theme_color || theme.accent;
    $("#themeFont").value = shop.theme_font || theme.font;
    $("#themeRadius").value = shop.theme_radius || "16";
  };

  /* Apply theme colors onto the canvas as CSS vars */
  const applyThemeToCanvas = () => {
    const shop = Utils.store.get("dc_shop") || { theme: "minimal" };
    const th = Storefront.getTheme(shop.theme);
    const canvas = $("#canvas");
    if (!canvas) return;
    canvas.style.setProperty("--t-accent", shop.theme_color || th.accent);
    canvas.style.setProperty("--t-soft", shop.theme_soft || th.soft);
    canvas.style.setProperty("--t-font", shop.theme_font || th.font);
    canvas.style.setProperty("--t-radius", (shop.theme_radius || "16") + "px");
    canvas.style.fontFamily = shop.theme_font || th.font;
  };

  /* ---------- Init ---------- */
  const init = async () => {
    await requireAuth();
    const user = await Auth.getUser();
    if (!user) return;
    const shopList = await Utils.db.select("stores", { limit: 1 });
    const shop = shopList[0] || {};
    Utils.store.set("dc_shop", shop);
    try {
      products = await DemoData.getProducts(user.id);
    } catch {
      products = [];
    }

    renderSidebar("builder");
    renderTopbar("Store Builder", "Design your storefront");

    // mobile sidebar toggle
    const topbarActions = Utils.$("#topbarActions");
    if (topbarActions) {
      topbarActions.innerHTML = `
        <button class="btn-icon canvas-toggle" id="canvasToggle" aria-label="Open sidebar" style="display:none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>`;
      Utils.$("#canvasToggle").onclick = () => Utils.$("#builderSidebar").classList.toggle("open");
    }

    loadState();
    renderLibrary();
    renderThemeControls();
    applyThemeToCanvas();
    renderCanvas();
    bindLibraryDrag();

    $("undoBtn").onclick = undo;
    $("redoBtn").onclick = redo;
    $("#deviceSelect").onchange = (e) => setDevice(e.target.value);
    $("#previewBtn").onclick = () => {
      // open a preview window with the rendered page
      const shop2 = { ...(Utils.store.get("dc_shop") || {}), name: $("#storeNameInput").value || "My Store", tagline: $("#storeTaglineInput").value };
      Utils.store.set("dc_shop", shop2);
      const html = Storefront.renderPage(sections, shop2);
      const w = window.open("", "_blank", "width=1200,height=800");
      if (w) { w.document.open(); w.document.write(html); w.document.close(); }
      else toast("warn", "Pop-up blocked — allow pop-ups for preview");
    };
    $("#publishBtn").onclick = () => location.href = "publish.html";
    $("#closeEditor").onclick = closeEditor;

    // tabs
    $$("#builderTabs .tab").forEach(tab => {
      tab.onclick = () => {
        $$("#builderTabs .tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        ["sections", "theme", "settings"].forEach(p => $("#panel" + p[0].toUpperCase() + p.slice(1)).style.display = p === tab.dataset.tab ? "block" : "none");
      };
    });

    // section search
    $("#sectionSearch").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      $$(".section-group").forEach(g => {
        let any = false;
        g.querySelectorAll(".section-item").forEach(it => {
          const show = it.textContent.toLowerCase().includes(q);
          it.style.display = show ? "" : "none";
          if (show) any = true;
        });
        g.style.display = any ? "" : "none";
      });
    });

    // theme apply
    $("#applyTheme").onclick = () => {
      const shop3 = Utils.store.get("dc_shop") || {};
      shop3.theme = $("#themeSelect").value;
      shop3.theme_color = $("#themePrimary").value;
      shop3.theme_font = $("#themeFont").value;
      shop3.theme_radius = $("#themeRadius").value;
      Utils.store.set("dc_shop", shop3);
      Utils.db.update("stores", { id: shop3.id }, { theme: shop3.theme }).catch(() => {});
      toast("success", "Theme applied — preview updated");
      applyThemeToCanvas();
      renderCanvas();
    };

    // settings save
    $("#saveSettings").onclick = async () => {
      const shop4 = Utils.store.get("dc_shop") || {};
      shop4.name = $("#storeNameInput").value.trim() || "My Store";
      shop4.tagline = $("#storeTaglineInput").value.trim();
      Utils.store.set("dc_shop", shop4);
      if (shop4.id) Utils.db.update("stores", { id: shop4.id }, { name: shop4.name, tagline: shop4.tagline }).catch(() => {});
      toast("success", "Store settings saved");
      applyThemeToCanvas();
      renderCanvas();
    };

    // keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && e.key.toLowerCase() === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "Escape") closeEditor();
    });

    save();
  };

  init();
})();