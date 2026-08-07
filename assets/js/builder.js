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
      { type: "footer", label: "Footer", desc: "Store footer with links" },
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
    footer: [
      { key: "title", label: "Section title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  };

  const SECTION_STYLE_SCHEMA = [
    { key: "paddingTop", label: "Padding top", type: "select", options: [["none", "None"], ["sm", "Small (32px)"], ["md", "Medium (64px)"], ["lg", "Large (96px)"], ["xl", "Extra large (128px)"]] },
    { key: "paddingBottom", label: "Padding bottom", type: "select", options: [["none", "None"], ["sm", "Small (32px)"], ["md", "Medium (64px)"], ["lg", "Large (96px)"], ["xl", "Extra large (128px)"]] },
    { key: "background", label: "Background", type: "select", options: [["transparent", "Transparent"], ["white", "White"], ["soft", "Theme soft"], ["accent", "Theme accent"], ["dark", "Dark"]] },
    { key: "bgColor", label: "Custom bg color", type: "color" },
    { key: "textColor", label: "Text color", type: "select", options: [["default", "Default"], ["light", "Light (on dark)"], ["muted", "Muted"]] },
    { key: "fullWidth", label: "Full width (no container)", type: "checkbox" },
    { key: "divider", label: "Show bottom divider", type: "checkbox" },
  ];

  let sections = [];
  let history = [];
  let historyIndex = -1;
  let selectedId = null;
  let products = [];

  const loadState = () => {
    const saved = Utils.store.get("dc_builder_sections");
    if (saved && Array.isArray(saved) && saved.length > 0) sections = saved;
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
      footer: { title: "Footer", description: "Beautiful products, delivered fast. Built with DualCore." },
    };
    return { ...base, ...(seed[type] || {}) };
  };

  const defaultTitle = (t) => ({ hero: "Hero", products: "Products", categories: "Categories", testimonials: "Testimonials", gallery: "Gallery", video: "Video", faq: "FAQ", newsletter: "Newsletter", contact: "Contact", footer: "Footer" }[t] || "Section");

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

    // Image upload for hero and gallery
    if (s.type === "hero") {
      fields.push(renderImageUpload("image", s.image, "Hero background image"));
    }
    if (s.type === "gallery") {
      fields.push(renderImageUpload("images", s.images, "Gallery images (multiple)"));
    }

    $("#editorFields").innerHTML = fields.join("");

    // Image upload listeners
    if (s.type === "hero" || s.type === "gallery") {
      bindImageUploads(s);
    }

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

    // Render section style fields
    renderSectionStyles(s);
  };

  /* ---------- Image upload helpers ---------- */
  const renderImageUpload = (key, currentValue, label) => {
    const images = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
    return `
      <div class="editor-field">
        <label>${label}</label>
        <div class="image-upload" data-key="${key}">
          <button type="button" class="upload-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            ${images.length ? "Change image" : "Upload image"}
          </button>
          <input type="file" accept="image/*" ${images.length > 1 ? "multiple" : ""} data-target="${key}">
          <div class="upload-preview">
            ${images.map((img, i) => `<div class="preview-item"><img src="${img}" alt="Preview ${i+1}"><button type="button" class="remove-img" data-index="${i}">×</button></div>`).join("")}
          </div>
        </div>
      </div>`;
  };

  const bindImageUploads = (section) => {
    $$(".image-upload").forEach(upload => {
      const key = upload.dataset.key;
      const btn = upload.querySelector(".upload-btn");
      const input = upload.querySelector("input[type=file]");
      const preview = upload.querySelector(".upload-preview");

      btn.onclick = () => input.click();

      input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        btn.innerHTML = `<span class="loader-inline"></span> Uploading...`;
        btn.disabled = true;

        try {
          const urls = await Promise.all(files.map(f => Utils.uploadFile(f, "sections")));
          const s2 = sections.find(x => x.id === selectedId);
          if (key === "images") {
            s2.images = [...(s2.images || []), ...urls];
          } else {
            s2[key] = urls[0];
          }
          pushHistory();
          renderCanvas();
          selectSection(selectedId);
          toast("success", "Image uploaded");
        } catch (err) {
          toast("error", "Upload failed: " + err.message);
        } finally {
          btn.disabled = false;
          btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg> Change image`;
        }
      };

      // Remove image
      preview?.addEventListener("click", (e) => {
        const removeBtn = e.target.closest(".remove-img");
        if (!removeBtn) return;
        const index = parseInt(removeBtn.dataset.index);
        const s2 = sections.find(x => x.id === selectedId);
        if (key === "images") {
          s2.images.splice(index, 1);
        } else {
          s2[key] = null;
        }
        pushHistory();
        renderCanvas();
        selectSection(selectedId);
        toast("info", "Image removed");
      });
    });
  };

  /* ---------- Section style fields ---------- */
  const renderSectionStyles = (s) => {
    const style = s.style || {};
    const fields = SECTION_STYLE_SCHEMA.map(f => {
      const val = style[f.key] ?? (f.type === "checkbox" ? false : (f.options?.[0]?.[0] || ""));
      if (f.type === "select") {
        return `<div class="section-style-field"><label>${f.label}</label>
          <select class="select" id="style-${f.key}">${f.options.map(([v, l]) => `<option value="${v}" ${val === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>`;
      } else if (f.type === "color") {
        return `<div class="section-style-field"><label>${f.label}</label>
          <div class="color-row"><input type="color" class="input" id="style-${f.key}" value="${val || "#ffffff"}"></div></div>`;
      } else if (f.type === "checkbox") {
        return `<div class="section-style-field checkbox"><input type="checkbox" id="style-${f.key}" ${val ? "checked" : ""}><label for="style-${f.key}">${f.label}</label></div>`;
      }
      return "";
    }).join("");

    $("#sectionStyleFields").innerHTML = fields;

    // Style listeners
    $$("#sectionStyleFields input, #sectionStyleFields select").forEach(el => {
      el.addEventListener("input", () => {
        const s2 = sections.find(x => x.id === selectedId);
        const key = el.id.replace("style-", "");
        if (!s2.style) s2.style = {};
        if (el.type === "checkbox") s2.style[key] = el.checked;
        else if (el.type === "color") s2.style[key] = el.value;
        else s2.style[key] = el.value;
        pushHistory();
        renderCanvas();
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
    const fontSelect = $("#themeFont");
    fontSelect.innerHTML = [
      "Inter, sans-serif",
      "Georgia, serif",
      "Playfair Display, serif",
      "Poppins, sans-serif",
      "Lora, serif",
      "Archivo, sans-serif",
      "Cormorant Garamond, serif",
      "Space Grotesk, sans-serif",
      "Nunito, sans-serif",
      "Sora, sans-serif",
      "Oswald, sans-serif",
      "Great Vibes, cursive",
      "Baloo 2, sans-serif",
      "Cinzel, serif",
      "Manrope, sans-serif",
      "Avenir Next, sans-serif",
      "Didot, serif",
    ].map(f => `<option value="${f}" ${(shop.theme_font || theme.font) === f ? "selected" : ""}>${f.split(",")[0]}</option>`).join("");
    $("#themeRadius").value = shop.theme_radius || "16";
    $("#themeButtonStyle").value = shop.theme_button_style || "rounded";
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
    canvas.style.setProperty("--btn-radius", shop.theme_button_style === "sharp" ? "0" : shop.theme_button_style === "pill" ? "999px" : "var(--t-radius)");
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

    // Load SEO settings
    const shopSettings = Utils.store.get("dc_shop") || {};
    $("#seoTitle").value = shopSettings.seo_title || "";
    $("#seoDescription").value = shopSettings.seo_description || "";
    $("#customDomain").value = shopSettings.custom_domain || "";

    // File upload handlers
    bindFileUploads(shopSettings);

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
      shop3.theme_button_style = $("#themeButtonStyle").value;
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

    // SEO save
    $("#saveSeo").onclick = async () => {
      const shop5 = Utils.store.get("dc_shop") || {};
      shop5.seo_title = $("#seoTitle").value.trim();
      shop5.seo_description = $("#seoDescription").value.trim();
      shop5.custom_domain = $("#customDomain").value.trim();
      Utils.store.set("dc_shop", shop5);
      if (shop5.id) Utils.db.update("stores", { id: shop5.id }, { seo_title: shop5.seo_title, seo_description: shop5.seo_description, custom_domain: shop5.custom_domain }).catch(() => {});
      toast("success", "SEO settings saved");
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

  /* ---------- File upload handlers ---------- */
  const bindFileUploads = (shop) => {
    const handleUpload = async (inputId, key) => {
      const input = $(`#${inputId}`);
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const url = await Utils.uploadFile(file, "storefront");
          const shop2 = Utils.store.get("dc_shop") || {};
          shop2[key] = url;
          Utils.store.set("dc_shop", shop2);
          if (shop2.id) Utils.db.update("stores", { id: shop2.id }, { [key]: url }).catch(() => {});
          toast("success", `${key} uploaded`);
        } catch (err) {
          toast("error", "Upload failed: " + err.message);
        }
      };
    };

    handleUpload("storeFavicon", "favicon");
    handleUpload("storeLogo", "logo");
    handleUpload("storeSocialImage", "social_image");
  };

  init();
})();