/* ============================================================
   DualCore — seed.js
   Demo data seeding + fallback storefront content.
   ============================================================ */

const DemoData = (() => {
  const NAMES = {
    products: [
      ["Aurora Silk Dress", "fashion", 5499, "Elegant evening dress with a flowing silhouette."],
      ["Nova Wireless Headphones", "electronics", 18999, "Studio-grade sound with active noise cancellation."],
      ["Oak Lounge Chair", "furniture", 32999, "Handcrafted oak frame with cloud-soft cushions."],
      ["Celeste Gold Necklace", "jewelry", 12500, "18k gold-plated pendant with cubic zirconia."],
      ["Urban Runner Sneakers", "shoes", 8999, "Feather-light sneakers built for city miles."],
      ["Artisan Espresso Blend", "food", 1450, "Single-origin beans, roasted in small batches."],
      ["Zen Ceramic Pour-Over Set", "coffee", 4200, "Complete manual brew kit for coffee lovers."],
      ["Sourdough Starter Kit", "bakery", 1800, "Everything you need to bake fresh sourdough."],
      ["Midnight Fantasy Novel", "books", 1299, "A gripping page-turner from a bestselling author."],
      ["Pro Fitness Kit", "sports", 6999, "Resistance bands, mat and guide — full home gym."],
    ],
  };

  const IMG_COLORS = ["#5C6EFF", "#7C4DFF", "#00C896", "#F59E0B", "#EF4444", "#0EA5E9", "#EC4899", "#10B981", "#8B5CF6", "#F97316"];

  const svgImage = (seed, label) =>
    "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${seed}"/><stop offset="1" stop-color="${seed}aa"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="200" font-family="Arial" font-size="22" fill="#ffffff" text-anchor="middle" opacity=".9">${label}</text><text x="200" y="232" font-family="Arial" font-size="13" fill="#ffffff" text-anchor="middle" opacity=".55">DualCore Preview</text></svg>`);

  const hashColor = (s) => {
    let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return IMG_COLORS[h % IMG_COLORS.length];
  };

  /* ---------- Products (all users) ---------- */
  const getProducts = async (userId) => {
    const list = await Utils.db.select("products", { order: "created_at", asc: false });
    if (list.length) return list;
    const rows = NAMES.products.map((n, i) => ({
      id: Utils.uid(), user_id: userId, name: n[0], category: n[1], price: n[2],
      compare_at: i % 3 === 0 ? Math.round(n[2] * 1.25) : null,
      description: n[3], sku: "SKU-" + (1000 + i), stock: [24, 8, 0, 15, 30, 60, 12, 9, 40, 18][i],
      images: [svgImage(hashColor(n[0]), n[0])], tags: [n[1], "featured"],
      featured: i < 4, status: i === 2 ? "draft" : "active",
      created_at: new Date(Date.now() - i * 864e5).toISOString(),
    }));
    await Utils.db.upsert("products", rows);
    return rows;
  };

  /* ---------- Orders (all users) ---------- */
  const getOrders = async (userId) => {
    const list = await Utils.db.select("orders", { order: "created_at", asc: false });
    if (list.length) return list;
    const statuses = ["paid", "paid", "pending", "paid", "shipped", "cancelled", "paid", "refunded", "pending", "paid"];
    const names = ["Ayesha Khan", "Bilal Ahmed", "Fatima Noor", "Hamza Sheikh", "Iqra Saeed", "Junaid Malik", "Kiran Batool", "Moeen Ali", "Nadia Javed", "Omar Farooq"];
    const cities = ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi", "Multan", "Hyderabad", "Peshawar"];
    const products = await getProducts(userId);
    const rows = names.map((n, i) => {
      const items = [products[i % products.length], products[(i + 3) % products.length]].filter(Boolean).slice(0, (i % 2) + 1);
      const total = items.reduce((s, p) => s + p.price, 0) + 150;
      return {
        id: Utils.uid(), user_id: userId, customer_name: n, customer_email: n.replace(" ", ".").toLowerCase() + "@gmail.com",
        phone: "03" + Utils.randInt(0, 9) + "-" + Utils.randInt(1000000, 9999999),
        address: `${Utils.randInt(1, 200)} Street ${Utils.randInt(1, 30)}, ${cities[i % cities.length]}`,
        city: cities[i % cities.length], status: statuses[i],
        items, total, currency: "PKR",
        created_at: new Date(Date.now() - i * 1.4 * 864e5).toISOString(),
      };
    });
    await Utils.db.upsert("orders", rows);
    return rows;
  };

  /* ---------- Customers ---------- */
  const getCustomers = async (userId) => {
    const list = await Utils.db.select("customers", { order: "created_at", asc: false });
    if (list.length) return list;
    const orders = await getOrders(userId);
    const seen = {};
    const rows = orders.map((o) => {
      const email = o.customer_email;
      if (seen[email]) return null;
      seen[email] = true;
      return {
        id: Utils.uid(), user_id: userId, name: o.customer_name, email,
        phone: o.phone, city: o.city, orders_count: 1 + Utils.randInt(0, 4),
        total_spent: 5000 + Utils.randInt(0, 40) * 1000,
        created_at: new Date(Date.now() - Utils.randInt(1, 60) * 864e5).toISOString(),
      };
    }).filter(Boolean);
    await Utils.db.upsert("customers", rows);
    return rows;
  };

  /* ---------- Analytics series (last 30 days) ---------- */
  const getAnalytics = () => {
    let s = Utils.store.get("dc_analytics");
    if (s) return s;
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const w = 0.6 + Math.sin(i / 4) * 0.35;
      days.push({
        date: d.toISOString().slice(0, 10),
        visitors: Math.round((120 + Utils.rand(0, 200)) * w),
        orders: Math.round((3 + Utils.rand(0, 8)) * w),
        revenue: Math.round((20000 + Utils.rand(0, 60000)) * w),
      });
    }
    Utils.store.set("dc_analytics", days);
    return days;
  };

  /* ---------- Notifications ---------- */
  const getNotifications = (user) => {
    const list = Utils.store.get("dc_notifications_" + (user?.id || "demo"));
    if (list) return list;
    const rows = [
      { id: Utils.uid(), type: "order", title: "New order received", desc: "Fatima Noor ordered Auror Silk Dress — PKR 5,649", time: new Date(Date.now() - 2e5).toISOString(), read: false },
      { id: Utils.uid(), type: "store", title: "Trial reminder", desc: "Your free trial ends soon. Upgrade to keep publishing.", time: new Date(Date.now() - 864e5).toISOString(), read: false },
      { id: Utils.uid(), type: "tip", title: "Product tip", desc: "Add more product photos — stores with 5+ images convert 2x better.", time: new Date(Date.now() - 2 * 864e5).toISOString(), read: true },
      { id: Utils.uid(), type: "billing", title: "Analytics ready", desc: "Your weekly report is ready to view.", time: new Date(Date.now() - 3 * 864e5).toISOString(), read: true },
    ];
    Utils.store.set("dc_notifications_" + (user?.id || "demo"), rows);
    return rows;
  };

  /* ---------- Store page sections (default content for builder) ---------- */
  const defaultSections = (theme = "minimal") => [
    { id: Utils.uid(), type: "hero", title: "Welcome to your store", subtitle: "Edit this hero with your brand story, image and call to action.", image: null, button: "Shop now", visible: true },
    { id: Utils.uid(), type: "products", title: "Featured Products", layout: "grid", count: 8, visible: true },
    { id: Utils.uid(), type: "categories", title: "Shop by Category", visible: true },
    { id: Utils.uid(), type: "testimonials", title: "What customers say", visible: true },
    { id: Utils.uid(), type: "newsletter", title: "Join our list", subtitle: "Get 10% off your first order.", visible: true },
    { id: Utils.uid(), type: "footer", title: "Footer", visible: true },
  ];

  return {
    svgImage, hashColor, getProducts, getOrders, getCustomers,
    getAnalytics, getNotifications, defaultSections,
  };
})();

window.DemoData = DemoData;