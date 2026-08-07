/* ============================================================
   DualCore — template-select.js  (template gallery page)
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("template-select");
  renderTopbar("Choose Template", "Pick a starting design for your store");

  const TEMPLATES = DemoData.getTemplates();
  const categories = [...new Set(TEMPLATES.map(t => t.category))];

  const renderFilters = () => {
    const wrap = $("#templateFilters");
    wrap.innerHTML = `<button class="chip active" data-cat="all">All</button>` +
      categories.map(c => `<button class="chip" data-cat="${c}">${c}</button>`).join("");
    wrap.querySelectorAll(".chip").forEach(ch => {
      ch.onclick = () => {
        wrap.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
        ch.classList.add("active");
        renderGrid(ch.dataset.cat, $("#templateSearch").value);
      };
    });
  };

  const renderGrid = (cat = "all", q = "") => {
    const grid = $("#templateGrid");
    const list = TEMPLATES.filter(t => {
      const matchCat = cat === "all" || t.category === cat;
      const matchQ = t.name.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase()) || t.id.includes(q.toLowerCase());
      return matchCat && matchQ;
    });

    grid.innerHTML = list.map(t => {
      const theme = Storefront.getTheme(t.theme);
      return `
      <div class="card card-hover theme-card reveal" data-template="${t.id}" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
        <div class="theme-preview" style="background:linear-gradient(135deg, ${theme.soft}, ${theme.accent}22);padding:24px;text-align:center;position:relative;min-height:200px;display:flex;flex-direction:column;justify-content:center;align-items:center">
          <div style="font-size:4rem;margin-bottom:12px">${t.thumbnail}</div>
          <span class="chip" style="background:${theme.accent};color:#fff;border:none;font-weight:700;font-size:.7rem;padding:4px 10px;border-radius:8px">${t.category}</span>
        </div>
        <div class="theme-body" style="padding:20px;flex:1;display:flex;flex-direction:column">
          <div>
            <h3 style="font-size:1.1rem;margin-bottom:6px">${t.name}</h3>
            <p class="muted" style="font-size:.85rem;line-height:1.5">${t.description}</p>
          </div>
          <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border)">
            <div class="flex gap-2" style="margin-bottom:10px">
              <span class="badge badge-ghost" style="font-size:.7rem">${t.sections.length} sections</span>
              <span class="badge badge-ghost" style="font-size:.7rem">${t.theme} theme</span>
            </div>
            <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:14px">
              ${t.sections.slice(0, 5).map(s => `<span class="badge badge-ghost" style="font-size:.65rem">${s.type}</span>`).join("")}
              ${t.sections.length > 5 ? `<span class="badge badge-ghost" style="font-size:.65rem">+${t.sections.length - 5} more</span>` : ""}
            </div>
            <div class="flex gap-8">
              <button class="btn btn-primary theme-use" data-template="${t.id}" style="flex:1">Use This Template</button>
              <button class="btn btn-ghost theme-preview-btn" data-template="${t.id}" title="Quick preview">Preview</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join("");

    grid.querySelectorAll(".theme-use").forEach(btn => {
      btn.onclick = async () => {
        const templateId = btn.dataset.template;
        const template = DemoData.getTemplate(templateId);
        if (!template) return;

        // Store template in localStorage for builder to pick up
        Utils.store.set("dc_selected_template", templateId);
        toast("success", `Loading ${template.name} template...`);
        setTimeout(() => location.href = "builder.html", 500);
      };
    });

    grid.querySelectorAll(".theme-preview-btn").forEach(btn => {
      btn.onclick = () => {
        const template = DemoData.getTemplate(btn.dataset.template);
        if (!template) return;
        const th = Storefront.getTheme(template.theme);
        // Build sections from template
        const sections = template.sections.map((s, i) => ({
          id: Utils.uid(),
          type: s.type,
          title: s.title,
          visible: s.visible !== false,
          ...s
        }));
        const html = Storefront.renderPage(sections, { name: "Preview Store", tagline: "Previewing " + template.name, theme: template.theme });
        const w = window.open("", "_blank", "width=1200,height=800");
        if (w) { w.document.open(); w.document.write(html); w.document.close(); }
      };
    });

    Utils.initReveal();
  };

  renderFilters();
  renderGrid();
  $("#templateSearch").addEventListener("input", Utils.debounce(e => {
    const active = $("#templateFilters .chip.active")?.dataset?.cat || "all";
    renderGrid(active, e.target.value);
  }, 200));
})();