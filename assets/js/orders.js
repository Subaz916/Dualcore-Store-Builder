/* ============================================================
   DualCore — orders.js
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("orders");
  renderTopbar("Orders", "Track & fulfill");

  let orders = await DemoData.getOrders(user.id);
  let statusFilter = "all";
  let q = "";
  let page = 1;
  const PER = 10;

  const badgeCls = { paid: "badge-success", pending: "badge-warn", shipped: "badge-primary", cancelled: "badge-danger", refunded: "badge-ghost" };

  const filtered = () => {
    let list = orders;
    if (statusFilter !== "all") list = list.filter(o => o.status === statusFilter);
    if (q) list = list.filter(o => (o.id + o.customer_name + o.customer_email).toLowerCase().includes(q.toLowerCase()));
    return list;
  };

  const render = () => {
    const list = filtered();
    $("#ordersCount").textContent = `${list.length} orders`;
    const pages = Math.max(1, Math.ceil(list.length / PER));
    page = Math.min(page, pages);
    const slice = list.slice((page - 1) * PER, page * PER);

    $("#ordersTable").innerHTML = slice.length ? slice.map(o => `
      <tr>
        <td><span class="td-title">#${o.id.slice(-6).toUpperCase()}</span></td>
        <td>
          <div class="td-flex">
            <span class="avatar avatar-sm" style="background:${Utils.avatarColor(o.customer_name)}">${Utils.initials(o.customer_name)}</span>
            <div>
              <div class="td-title">${Utils.esc(o.customer_name)}</div>
              <div class="td-sub">${o.customer_email}</div>
            </div>
          </div>
        </td>
        <td>${o.items.length}</td>
        <td><b>${Utils.fmtMoney(o.total)}</b></td>
        <td>
          <select class="select order-status" data-id="${o.id}" style="padding:6px 10px;font-size:.8rem;border-radius:99px;width:auto;font-weight:600">
            ${["pending", "paid", "shipped", "refunded", "cancelled"].map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td class="muted">${Utils.timeAgo(o.created_at)}</td>
        <td>
          <div class="flex gap-1">
            <button class="btn btn-ghost btn-sm order-view" data-id="${o.id}">View</button>
            <button class="btn btn-ghost btn-sm order-invoice" data-id="${o.id}">🧾 Invoice</button>
          </div>
        </td>
      </tr>`).join("")
      : `<tr><td colspan="7" style="text-align:center;padding:50px;color:var(--muted)">No orders found</td></tr>`;

    bindStatus();
    $("#ordersPagination").innerHTML = Array.from({ length: pages }, (_, i) => i + 1)
      .map(p => `<button class="page-btn ${p === page ? "active" : ""}" data-page="${p}">${p}</button>`).join("");
    $("#ordersPagination").querySelectorAll(".page-btn").forEach(b => b.onclick = () => { page = +b.dataset.page; render(); });
  };

  const bindStatus = () => {
    $("#ordersTable").querySelectorAll(".order-status").forEach(sel => {
      sel.onchange = async () => {
        const id = sel.dataset.id;
        const newStatus = sel.value;
        orders = orders.map(o => o.id === id ? { ...o, status: newStatus } : o);
        await Utils.db.update("orders", { id }, { status: newStatus });
        toast("success", `Order marked as ${newStatus}`);
      };
    });
    $("#ordersTable").querySelectorAll(".order-view").forEach(b => b.onclick = () => viewOrder(b.dataset.id));
    $("#ordersTable").querySelectorAll(".order-invoice").forEach(b => b.onclick = () => invoiceOrder(b.dataset.id));
  };

  /* ---------- Order detail modal ---------- */
  const viewOrder = (id) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const items = o.items.map(it => `
      <div class="flex-between" style="padding:10px 0;border-bottom:1px dashed var(--border)">
        <span>${Utils.esc(it.name)}</span><b>${Utils.fmtMoney(it.price)}</b>
      </div>`).join("");
    Components.openModal(`
      <div class="modal-head"><h3>Order #${o.id.slice(-6).toUpperCase()}</h3><button class="modal-x" data-close>×</button></div>
      <div class="modal-body">
        <div class="grid grid-2" style="gap:12px;margin-bottom:18px">
          <div class="card" style="padding:14px;border-radius:12px">
            <div class="td-sub" style="text-transform:uppercase">Customer</div>
            <b>${Utils.esc(o.customer_name)}</b><br>
            <span class="muted" style="font-size:.85rem">${Utils.esc(o.customer_email)}<br>${Utils.esc(o.phone || "")}</span>
          </div>
          <div class="card" style="padding:14px;border-radius:12px">
            <div class="td-sub" style="text-transform:uppercase">Shipping</div>
            <span class="muted" style="font-size:.85rem">${Utils.esc(o.address || "")}<br>${Utils.esc(o.city || "")}</span>
          </div>
        </div>
        <b style="font-size:.85rem">Items</b>
        ${items}
        <div class="flex-between" style="margin-top:16px;font-weight:800;font-size:1.05rem">
          <span>Total</span><span>${Utils.fmtMoney(o.total)}</span>
        </div>
      </div>
      <div class="modal-foot">
        <span class="badge ${badgeCls[o.status]}">${o.status}</span>
        <button class="btn btn-ghost" data-close>Close</button>
      </div>`);
  };

  /* ---------- Invoice (printable) ---------- */
  const invoiceOrder = (id) => {
    const o = orders.find(x => x.id === id);
    if (!o) return;
    const shop = Utils.store.get("dc_shop") || { name: "My Store" };
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) { toast("warn", "Allow pop-ups to print invoices"); return; }
    const rows = o.items.map(it => `<tr><td>${Utils.esc(it.name)}</td><td>1</td><td style="text-align:right">${Utils.fmtMoney(it.price)}</td></tr>`).join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice</title>
      <style>body{font-family:Inter,Arial,sans-serif;max-width:640px;margin:40px auto;color:#0F172A;padding:0 20px}
      h1{font-size:1.6rem;margin-bottom:4px}.muted{color:#64748B;font-size:.85rem}
      table{width:100%;border-collapse:collapse;margin:28px 0}td,th{padding:12px;border-bottom:1px solid #E7EBF3}
      th{text-align:left;font-size:.78rem;text-transform:uppercase;color:#64748B}
      .total{font-size:1.3rem;font-weight:800}.print{padding:12px 22px;border-radius:99px;background:#5C6EFF;color:#fff;border:none;cursor:pointer}
      .meta{display:flex;justify-content:space-between;margin-top:40px;border-top:1px solid #E7EBF3;padding-top:14px;font-size:.8rem;color:#64748B}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1>${Utils.esc(shop.name)}</h1><div class="muted">${Utils.esc(shop.tagline || "")}</div></div>
        <div style="text-align:right"><b>INVOICE</b><div class="muted">#${o.id.slice(-8).toUpperCase()}<br>${Utils.fmtDate(o.created_at)}</div></div>
      </div>
      <table><thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Price</th></tr></thead><tbody>${rows}
        <tr><td colspan="2" style="text-align:right">Shipping</td><td style="text-align:right">PKR 150</td></tr>
        <tr><td colspan="2" style="text-align:right"><b>Total</b></td><td class="total" style="text-align:right">${Utils.fmtMoney(o.total)}</td></tr>
      </tbody></table>
      <div class="meta"><span>Bill to: ${Utils.esc(o.customer_name)}<br>${Utils.esc(o.customer_email)}</span>
      <button class="print" onclick="window.print()">Print invoice</button></div>
    </body></html>`);
    w.document.close();
  };

  // filters + search
  $("#orderFilters").querySelectorAll(".chip").forEach(ch => {
    ch.onclick = () => {
      $("#orderFilters").querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
      ch.classList.add("active");
      statusFilter = ch.dataset.status;
      page = 1;
      render();
    };
  });
  $("#orderSearch").addEventListener("input", Utils.debounce(e => { q = e.target.value; page = 1; render(); }, 200));
  $("#exportOrders").onclick = () => {
    Utils.downloadFile("orders.csv", Utils.toCSV(orders.map(o => ({
      id: o.id, customer: o.customer_name, email: o.customer_email, total: o.total, status: o.status, date: o.created_at,
    }))), "text/csv");
    toast("success", "Orders exported");
  };

  render();
})();