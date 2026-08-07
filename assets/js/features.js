/* ============================================================
   DualCore — features.js
   ============================================================ */

(() => {
  const FEATURES = [
    { icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", title: "Visual Store Builder", desc: "Drag sections, reorder, duplicate, hide and restyle in real time with undo, redo and autosave.", color: "#5C6EFF" },
    { icon: "M14 3v5a1 1 0 0 0 1 1h5M15 3h4a1 1 0 0 1 1 1v4M3 9h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3M3 15h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3M15 21h5a1 1 0 0 0 1-1v-4", title: "30 Hand-crafted Themes", desc: "Fashion to gaming to coffee — every theme is responsive, animated and SEO-ready.", color: "#7C4DFF" },
    { icon: "M20 12v9H4v-9M2 7h20v5H2z", title: "Products & Variants", desc: "Unlimited products with SKU, barcode, inventory, images, variants, tags and digital downloads.", color: "#00C896" },
    { icon: "M3 3v18h18M18 17V9M13 17V5M8 17v-3", title: "Analytics", desc: "Visitors, sales, conversion, top products and traffic sources — live and real-time.", color: "#F59E0B" },
    { icon: "M21 7h-5L12 2 8 7H3a1 1 0 0 0-1 1v2a3 3 0 0 0 3 3 3 3 0 0 0 5.2 2.2L13 18v1a2 2 0 1 0 4 0v-1l1.8-4.8A3 3 0 0 0 22 10V8a1 1 0 0 0-1-1z", title: "Orders & Invoices", desc: "Track pending, paid, cancelled and refunded orders with customer details and invoices.", color: "#EF4444" },
    { icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", title: "Customers & Accounts", desc: "Customer profiles with addresses, wishlists, order history and saved cards.", color: "#0EA5E9" },
    { icon: "M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10c-2.5-2.5-4-6-4-10s1.5-7.5 4-10z", title: "Custom Domains", desc: "Publish to your subdomain, then connect any domain you own with one click + free SSL.", color: "#8B5CF6" },
    { icon: "M2 7h20v10H2zM6 12h4", title: "Billing & Plans", desc: "Transparent monthly plans in PKR. Upgrade, downgrade or cancel — changes apply next cycle.", color: "#10B981" },
    { icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z", title: "Settings & Branding", desc: "Logo, favicon, colors, fonts, announcement bars, cookie banners and mega menus.", color: "#6366F1" },
    { icon: "M13 2 3 14h7l-1 8 10-12h-7l1-8z", title: "AI Tools", desc: "AI product descriptions, SEO suggestions and image help — on Premium.", color: "#F97316" },
    { icon: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4l1.4-1.4M17.7 6.3l1.4-1.4", title: "Realtime Dashboard", desc: "A beautiful overview of revenue, orders, visitors and recent activity — refreshed live.", color: "#14B8A6" },
    { icon: "M21 12a9 9 0 1 1-9-9c2.5 0 4.5 1 6 2.6L21 3v9z", title: "Security First", desc: "Row Level Security, JWT sessions, email verification and storage policies protect your data.", color: "#3B82F6" },
  ];

  const grid = $("#featuresGrid");
  if (!grid) return;
  grid.innerHTML = FEATURES.map((f, i) => `
    <div class="card card-hover feature-card reveal" data-delay="${i % 3}">
      <div class="feature-icon" style="background:${f.color}1A;color:${f.color}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${f.icon}"/></svg>
      </div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </div>`).join("");
  Utils.initReveal();
})();