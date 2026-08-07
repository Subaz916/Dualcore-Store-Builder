/* ============================================================
   DualCore — products.js
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("products");
  renderTopbar("Products", "Manage inventory & pricing");

  let products = await DemoData.getProducts(user.id);
  let filter = "all";
  let q = "";

  const emptyState = (title = "No products yet") => `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12v9H4v-9M2 7h20v5H2z"/></svg></div>
      <h3>${title}</h3>
      <p>Add your first product to start building your store catalog.</p>
      <button class="btn btn-primary" id="emptyAdd">＋ Add a product</button>
    </div>`;

  const bindFilters = () => {
    document.querySelectorAll(".chip[data-filter]").forEach(ch => {
      ch.onclick = () => {
        document.querySelectorAll(".chip[data-filter]").forEach(x => x.classList.remove("active"));
        ch.classList.add("active");
        filter = ch.dataset.filter;
        renderGrid();
      };
    });
  };

  const renderGrid = () => {
    let list = products;
    if (q) list = list.filter(p => (p.name + " " + (p.sku || "")).toLowerCase().includes(q.toLowerCase()));
    if (filter === "active") list = list.filter(p => p.status === "active");
    if (filter === "draft") list = list.filter(p => p.status === "draft");
    if (filter === "low") list = list.filter(p => p.stock <= 5);
    if (filter === "featured") list = list.filter(p => p.featured);

    $("#productCount").textContent = `${list.length} of ${products.length} products`;
    const gridView = $("#productView");
    gridView.innerHTML = list.length ? list.map(p => `
      <article class="card product-card" data-id="${p.id}">
        <div class="product-thumb">
          <img src="${p.images?.[0] || DemoData.svgImage("#5C6EFF", "Product")}" alt="${Utils.esc(p.name)}" loading="lazy">
          ${p.featured ? `<span class="badge badge-violet" style="position:absolute;top:10px;left:10px">★ Featured</span>` : ""}
        </div>
        <div class="product-body">
          <h3>${Utils.esc(p.name)}</h3>
          <p>${Utils.esc(p.category || "")} · ${p.stock > 0 ? p.stock + " in stock" : "out of stock"}</p>
          <div class="flex align-center gap-1">
            ${p.compare_at ? `<s class="muted">${Utils.fmtMoney(p.compare_at)}</s>` : ""}
            <b class="product-price">${Utils.fmtMoney(p.price)}</b>
          </div>
        </div>
        <div class="product-foot">
          <span class="badge ${p.status === "active" ? "badge-success" : "badge-warn"}">${p.status}</span>
          <div class="flex gap-1">
            <button class="btn btn-ghost btn-sm product-edit" data-id="${p.id}">✎</button>
            <button class="btn btn-icon btn-del product-del" data-id="${p.id}" aria-label="Delete">🗑</button>
          </div>
        </div>
      </article>`).join("") : emptyState();

    gridView.querySelectorAll(".product-edit").forEach(b => b.onclick = () => openProductModal(b.dataset.id));
    gridView.querySelectorAll(".product-del").forEach(b => b.onclick = () => deleteProduct(b.dataset.id));
  };

  const deleteProduct = async (id) => {
    const ok = await Components.confirmDialog({ title: "Delete product?", message: "This removes the product from your store. It can't be undone.", danger: true, confirmText: "Delete" });
    if (!ok) return;
    products = products.filter(p => p.id !== id);
    await Utils.db.remove("products", { id });
    renderGrid();
    toast("success", "Product deleted");
  };

  const openProductModal = (id) => {
    const existing = products.find(p => p.id === id) || {};
    const m = Components.openModal(`
      <div class="modal-head"><h3>${existing.id ? "Edit product" : "Add product"}</h3><button class="modal-x" data-close>×</button></div>
      <form id="productForm" class="modal-body" novalidate>
        <div class="field"><label>Product name</label><input class="input" id="p-name" value="${Utils.esc(existing.name || "")}" required></div>
        <div class="grid grid-2" style="gap:0 14px">
          <div class="field"><label>Price (PKR)</label><input class="input" type="number" id="p-price" value="${existing.price ?? ""}" min="0" required></div>
          <div class="field"><label>Compare-at price</label><input class="input" type="number" id="p-compare" value="${existing.compare_at ?? ""}" min="0"></div>
          <div class="field"><label>SKU</label><input class="input" id="p-sku" value="${Utils.esc(existing.sku || "")}"></div>
          <div class="field"><label>Stock</label><input class="input" type="number" id="p-stock" value="${existing.stock ?? 0}" min="0"></div>
          <div class="field"><label>Category</label><input class="input" id="p-cat" value="${Utils.esc(existing.category || "")}"></div>
          <div class="field"><label>Tags</label><input class="input" id="p-tags" value="${Utils.esc((existing.tags || []).join(","))}"></div>
        </div>
        <div class="field"><label>Description</label><textarea class="textarea" id="p-desc" rows="3">${Utils.esc(existing.description || "")}</textarea></div>
        <div class="flex" style="gap:20px;margin-bottom:16px">
          <label class="flex align-center gap-1" style="cursor:pointer"><input type="checkbox" id="p-featured" ${existing.featured ? "checked" : ""} style="accent-color:var(--primary)"> Featured</label>
          <label class="flex align-center gap-1" style="cursor:pointer"><input type="checkbox" id="p-digital" ${existing.type === "digital" ? "checked" : ""} style="accent-color:var(--primary)"> Digital download</label>
          <select class="select" id="p-status" style="width:auto;padding:8px 12px">
            <option value="active" ${existing.status !== "draft" ? "selected" : ""}>Active</option>
            <option value="draft" ${existing.status === "draft" ? "selected" : ""}>Draft</option>
          </select>
        </div>
        <div class="modal-foot" style="padding:0;border:none;display:flex;gap:10px;justify-content:flex-end">
          <button type="button" class="btn btn-ghost" data-close>Cancel</button>
          <button class="btn btn-primary" type="submit" id="productSave">${existing.id ? "Save changes" : "Add product"}</button>
        </div>
      </form>`, { width: 620 });

    const overlay = m.overlay;
    const close = () => { overlay.remove(); };
    Utils.$(".modal-x", overlay).onclick = close;
    overlay.querySelectorAll("[data-close]").forEach(b => b.onclick = close);

    const form = Utils.$("#productForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const price = parseFloat($("#p-price").value) || 0;
      const name = $("#p-name").value.trim();
      if (!name) { toast("warn", "Product name is required"); return; }

      const data = {
        id: existing.id || Utils.uid(),
        user_id: user.id,
        name,
        price,
        compare_at: parseFloat($("#p-compare").value) || null,
        sku: $("#p-sku").value.trim() || ("SKU-" + Utils.randInt(1000, 99999)),
        stock: parseInt($("#p-stock").value) || 0,
        category: $("#p-cat").value.trim(),
        tags: $("#p-tags").value.split(",").map(s => s.trim()).filter(Boolean),
        description: $("#p-desc").value.trim(),
        featured: $("#p-featured").checked,
        type: $("#p-digital").checked ? "digital" : "physical",
        status: $("#p-status").value,
        images: existing.images || [DemoData.svgImage(DemoData.hashColor(name), name)],
        created_at: existing.created_at || new Date().toISOString(),
      };

      if (!existing.id) {
        products.unshift(data);
        await Utils.db.insert("products", data);
        toast("success", "Product added");
      } else {
        products = products.map(x => x.id === data.id ? { ...x, ...data } : x);
        await Utils.db.update("products", { id: data.id }, data);
        toast("success", "Product updated");
      }
      overlay.remove();
      renderGrid();
    });
  };

  $("#addProductBtn").onclick = () => openProductModal(null);
  const emptyAdd = $("#emptyAdd");
  if (emptyAdd) emptyAdd.onclick = () => openProductModal(null);
  $("#exportBtn").onclick = () => {
    Utils.downloadFile("products.csv", Utils.toCSV(products.map(p => ({
      name: p.name, price: p.price, sku: p.sku, stock: p.stock, category: p.category, status: p.status,
    }))), "text/csv");
    toast("success", "CSV exported");
  };
  $("#productSearch").addEventListener("input", Utils.debounce(e => { q = e.target.value; renderGrid(); }, 200));
  bindFilters();

  renderGrid();
})();