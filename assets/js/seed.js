/* ============================================================
   DualCore — data.js
   Data access helpers + placeholder graphics (NO demo data).
   Returns only rows that actually exist in storage.
   ============================================================ */

const DemoData = (() => {

  const IMG_COLORS = ["#5C6EFF", "#7C4DFF", "#00C896", "#F59E0B", "#EF4444", "#0EA5E9", "#EC4899", "#10B981", "#8B5CF6", "#F97316"];

  const svgImage = (seed, label) =>
    "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${seed}"/><stop offset="1" stop-color="${seed}aa"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="200" font-family="Arial" font-size="22" fill="#ffffff" text-anchor="middle" opacity=".9">${label}</text><text x="200" y="232" font-family="Arial" font-size="13" fill="#ffffff" text-anchor="middle" opacity=".55">DualCore Preview</text></svg>`);

  const hashColor = (s) => {
    let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return IMG_COLORS[h % IMG_COLORS.length];
  };

  /* ---------- Products (real rows only) ---------- */
  const getProducts = async (userId) =>
    Utils.db.select("products", { eq: { user_id: userId }, order: "created_at", asc: false });

  /* ---------- Orders (real rows only) ---------- */
  const getOrders = async (userId) =>
    Utils.db.select("orders", { eq: { user_id: userId }, order: "created_at", asc: false });

  /* ---------- Customers (real rows only) ---------- */
  const getCustomers = async (userId) =>
    Utils.db.select("customers", { eq: { user_id: userId }, order: "created_at", asc: false });

  /* ---------- Analytics (real rows only — none generated) ---------- */
  const getAnalytics = () => Utils.store.get("dc_analytics", []);

  /* ---------- Notifications (stored ones only) ---------- */
  const getNotifications = (user) =>
    Utils.store.get("dc_notifications_" + (user?.id || "demo"), []);

  /* ---------- Store page sections (default structure for builder) ---------- */
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