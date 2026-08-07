/* ============================================================
   DualCore — customers.js
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("customers");
  renderTopbar("Customers", "Know your buyers");

  let customers = await DemoData.getCustomers(user.id);
  const orders = await DemoData.getOrders(user.id);

  const render = (q = "") => {
    const list = q
      ? customers.filter(c => (c.name + c.email + (c.city || "")).toLowerCase().includes(q.toLowerCase()))
      : customers;
    $("#customerCount").textContent = `${list.length} customers`;

    $("#customersTable").innerHTML = list.map(c => {
      const lastOrder = orders.find(o => o.customer_email === c.email);
      const status = c.orders_count > 3 ? "VIP" : c.orders_count > 0 ? "active" : "new";
      const badge = { VIP: "badge-violet", active: "badge-success", new: "badge-primary" }[status];
      return `
      <tr>
        <td>
          <div class="td-flex">
            <span class="avatar avatar-sm" style="background:${Utils.avatarColor(c.name)}">${Utils.initials(c.name)}</span>
            <div>
              <div class="td-title">${Utils.esc(c.name)}</div>
              <div class="td-sub">${c.email}</div>
            </div>
          </div>
        </td>
        <td>${Utils.esc(c.city || "—")}</td>
        <td>${c.orders_count}</td>
        <td><b>${Utils.fmtMoney(c.total_spent)}</b></td>
        <td class="muted">${Utils.timeAgo(lastOrder?.created_at)}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td><button class="btn btn-ghost btn-sm customer-view" data-email="${c.email}">View</button></td>
      </tr>`;
    }).join("") || `<tr><td colspan="7" style="text-align:center;padding:50px;color:var(--muted)">No customers found</td></tr>`;

    $("#customersTable").querySelectorAll(".customer-view").forEach(b => {
      b.onclick = () => {
        const c = list.find(x => x.email === b.dataset.email);
        if (!c) return;
        const theirOrders = orders.filter(o => o.customer_email === c.email);
        const items = theirOrders.map(o => `
          <div class="flex-between" style="padding:8px 0;border-bottom:1px dashed var(--border);font-size:.88rem">
            <span>#${o.id.slice(-6).toUpperCase()} · ${Utils.fmtDate(o.created_at)}</span>
            <b>${Utils.fmtMoney(o.total)}</b>
          </div>`).join("") || '<p class="muted" style="font-size:.88rem">No orders yet</p>';
        Components.openModal(`
          <div class="modal-head"><h3>${Utils.esc(c.name)}</h3><button class="modal-x" data-close>×</button></div>
          <div class="modal-body">
            <div class="flex align-center gap-2" style="margin-bottom:18px">
              <span class="avatar avatar-lg" style="background:${Utils.avatarColor(c.name)}">${Utils.initials(c.name)}</span>
              <div>
                <b>${Utils.esc(c.email)}</b><br>
                <span class="muted" style="font-size:.85rem">${Utils.esc(c.phone || "")} · ${Utils.esc(c.city || "")}</span>
              </div>
            </div>
            <div class="grid grid-2" style="gap:12px;margin-bottom:18px">
              <div class="card" style="padding:14px;border-radius:12px"><div class="td-sub">Orders</div><b style="font-size:1.3rem">${c.orders_count}</b></div>
              <div class="card" style="padding:14px;border-radius:12px"><div class="td-sub">Total spent</div><b style="font-size:1.3rem">${Utils.fmtMoney(c.total_spent)}</b></div>
            </div>
            <b style="font-size:.9rem">Order history</b>
            <div style="margin-top:8px">${items}</div>
          </div>
          <div class="modal-foot"><button class="btn btn-ghost" data-close>Close</button></div>`);
      };
    });
  };

  $("#customerSearch").addEventListener("input", Utils.debounce(e => render(e.target.value), 200));
  $("#exportCustomers").onclick = () => {
    Utils.downloadFile("customers.csv", Utils.toCSV(customers.map(c => ({
      name: c.name, email: c.email, phone: c.phone, city: c.city, orders: c.orders_count, total: c.total_spent,
    }))), "text/csv");
    toast("success", "Customers exported");
  };

  render();
})();