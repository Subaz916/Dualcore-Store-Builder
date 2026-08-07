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

  /* ---------- Template definitions (pre-built store layouts) ---------- */
  const TEMPLATES = [
    {
      id: "minimal",
      name: "Minimal",
      description: "Clean, distraction-free layout focused on your products",
      category: "General",
      theme: "minimal",
      thumbnail: "🎨",
      sections: [
        { type: "hero", title: "Welcome to your store", subtitle: "Discover our curated collection of premium products", button: "Shop Now", secondary: "Learn More", visible: true },
        { type: "products", title: "Featured Products", layout: "grid", count: 8, visible: true },
        { type: "categories", title: "Shop by Category", visible: true },
        { type: "testimonials", title: "What Our Customers Say", visible: true },
        { type: "newsletter", title: "Stay Updated", subtitle: "Subscribe for exclusive offers and new arrivals", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "fashion",
      name: "Fashion Boutique",
      description: "Elegant design for clothing and apparel stores",
      category: "Fashion",
      theme: "fashion",
      thumbnail: "👗",
      sections: [
        { type: "hero", title: "New Season Collection", subtitle: "Discover the latest trends in fashion", button: "Shop Collection", secondary: "View Lookbook", visible: true },
        { type: "categories", title: "Shop by Category", visible: true },
        { type: "products", title: "New Arrivals", layout: "grid", count: 8, visible: true },
        { type: "gallery", title: "Lookbook", visible: true },
        { type: "testimonials", title: "Customer Favorites", visible: true },
        { type: "newsletter", title: "Join the Style Club", subtitle: "Get 15% off your first order + early access to sales", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "electronics",
      name: "Electronics Store",
      description: "Modern tech-focused layout with product specs",
      category: "Electronics",
      theme: "electronics",
      thumbnail: "📱",
      sections: [
        { type: "hero", title: "Latest Technology", subtitle: "Cutting-edge gadgets and electronics at your fingertips", button: "Explore Products", secondary: "Compare Models", visible: true },
        { type: "categories", title: "Product Categories", visible: true },
        { type: "products", title: "Featured Gadgets", layout: "grid", count: 8, visible: true },
        { type: "faq", title: "Tech Support & FAQ", visible: true },
        { type: "testimonials", title: "Verified Buyer Reviews", visible: true },
        { type: "newsletter", title: "Tech Deals Alert", subtitle: "Be the first to know about flash sales and new releases", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "furniture",
      name: "Furniture & Home",
      description: "Warm, inviting layout for home decor and furniture",
      category: "Home",
      theme: "furniture",
      thumbnail: "🛋️",
      sections: [
        { type: "hero", title: "Transform Your Space", subtitle: "Handcrafted furniture for modern living", button: "Shop Furniture", secondary: "Design Ideas", visible: true },
        { type: "categories", title: "Room by Room", visible: true },
        { type: "products", title: "Best Sellers", layout: "grid", count: 8, visible: true },
        { type: "gallery", title: "Room Inspiration", visible: true },
        { type: "video", title: "Behind the Craft", visible: true },
        { type: "testimonials", title: "Happy Homeowners", visible: true },
        { type: "newsletter", title: "Design Tips", subtitle: "Subscribe for decor ideas and exclusive offers", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "beauty",
      name: "Beauty & Cosmetics",
      description: "Glamorous layout for beauty, skincare, and makeup",
      category: "Wellness",
      theme: "beauty",
      thumbnail: "💄",
      sections: [
        { type: "hero", title: "Glow Up Your Routine", subtitle: "Clean beauty products that actually work", button: "Shop Skincare", secondary: "Shop Makeup", visible: true },
        { type: "categories", title: "Shop by Concern", visible: true },
        { type: "products", title: "Top Rated", layout: "grid", count: 8, visible: true },
        { type: "gallery", title: "Real Results", visible: true },
        { type: "testimonials", title: "Glowing Reviews", visible: true },
        { type: "faq", title: "Beauty FAQ", visible: true },
        { type: "newsletter", title: "Beauty Insider", subtitle: "Exclusive tips, tutorials & 20% off first order", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "food",
      name: "Food & Restaurant",
      description: "Appetizing layout for restaurants, cafes, and food delivery",
      category: "Food & Drink",
      theme: "food",
      thumbnail: "🍔",
      sections: [
        { type: "hero", title: "Fresh & Delicious", subtitle: "Order your favorites for delivery or pickup", button: "View Menu", secondary: "Order Now", visible: true },
        { type: "categories", title: "Our Menu", visible: true },
        { type: "products", title: "Popular Dishes", layout: "list", count: 8, visible: true },
        { type: "testimonials", title: "Customer Favorites", visible: true },
        { type: "gallery", title: "Food Gallery", visible: true },
        { type: "contact", title: "Visit Us", visible: true },
        { type: "newsletter", title: "Hungry for More?", subtitle: "Get exclusive deals and new menu alerts", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "jewelry",
      name: "Jewelry & Accessories",
      description: "Luxurious layout for fine jewelry and accessories",
      category: "Accessories",
      theme: "jewelry",
      thumbnail: "💎",
      sections: [
        { type: "hero", title: "Timeless Elegance", subtitle: "Handcrafted jewelry for every occasion", button: "Shop Collection", secondary: "Custom Design", visible: true },
        { type: "categories", title: "Collections", visible: true },
        { type: "products", title: "Featured Pieces", layout: "grid", count: 8, visible: true },
        { type: "gallery", title: "Detail View", visible: true },
        { type: "testimonials", title: "Cherished Moments", visible: true },
        { type: "faq", title: "Care & Sizing", visible: true },
        { type: "newsletter", title: "Jewelry Insider", subtitle: "New collections, styling tips & exclusive access", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "sports",
      name: "Sports & Fitness",
      description: "Energetic layout for sports gear and fitness equipment",
      category: "Active",
      theme: "sports",
      thumbnail: "🏋️",
      sections: [
        { type: "hero", title: "Train Harder", subtitle: "Professional gear for serious athletes", button: "Shop Gear", secondary: "Training Plans", visible: true },
        { type: "categories", title: "Sports Categories", visible: true },
        { type: "products", title: "Top Equipment", layout: "grid", count: 8, visible: true },
        { type: "video", title: "Workout Demos", visible: true },
        { type: "testimonials", title: "Athlete Reviews", visible: true },
        { type: "faq", title: "Equipment Guide", visible: true },
        { type: "newsletter", title: "Performance Tips", subtitle: "Training guides, nutrition & member discounts", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "books",
      name: "Books & Media",
      description: "Cozy layout for bookstores and media shops",
      category: "Media",
      theme: "books",
      thumbnail: "📚",
      sections: [
        { type: "hero", title: "Discover Your Next Read", subtitle: "Curated books for every reader", button: "Browse Books", secondary: "Bestsellers", visible: true },
        { type: "categories", title: "Genres", visible: true },
        { type: "products", title: "New Releases", layout: "grid", count: 8, visible: true },
        { type: "testimonials", title: "Reader Reviews", visible: true },
        { type: "faq", title: "Shipping & Returns", visible: true },
        { type: "newsletter", title: "Book Club", subtitle: "Monthly picks, author interviews & reading guides", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "digital",
      name: "Digital Products",
      description: "Streamlined layout for software, templates, and downloads",
      category: "Digital",
      theme: "digital",
      thumbnail: "💻",
      sections: [
        { type: "hero", title: "Digital Solutions", subtitle: "Tools and templates to boost your productivity", button: "View Products", secondary: "Free Resources", visible: true },
        { type: "categories", title: "Product Types", visible: true },
        { type: "products", title: "Popular Downloads", layout: "grid", count: 8, visible: true },
        { type: "testimonials", title: "User Success Stories", visible: true },
        { type: "faq", title: "Licensing & Support", visible: true },
        { type: "newsletter", title: "Product Updates", subtitle: "New releases, tips & exclusive discounts", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "courses",
      name: "Online Courses",
      description: "Educational layout for course creators and educators",
      category: "Digital",
      theme: "courses",
      thumbnail: "🎓",
      sections: [
        { type: "hero", title: "Learn Something New", subtitle: "Expert-led courses for career growth", button: "Browse Courses", secondary: "Free Preview", visible: true },
        { type: "categories", title: "Learning Paths", visible: true },
        { type: "products", title: "Featured Courses", layout: "grid", count: 8, visible: true },
        { type: "video", title: "Course Preview", visible: true },
        { type: "testimonials", title: "Student Success", visible: true },
        { type: "faq", title: "Learning FAQ", visible: true },
        { type: "newsletter", title: "Weekly Knowledge", subtitle: "Free lessons, tips & course discounts", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "pets",
      name: "Pet Supplies",
      description: "Friendly layout for pet food, toys, and accessories",
      category: "Lifestyle",
      theme: "pets",
      thumbnail: "🐾",
      sections: [
        { type: "hero", title: "Happy Pets, Happy Life", subtitle: "Premium care for your furry family members", button: "Shop for Dogs", secondary: "Shop for Cats", visible: true },
        { type: "categories", title: "Pet Categories", visible: true },
        { type: "products", title: "Best Sellers", layout: "grid", count: 8, visible: true },
        { type: "testimonials", title: "Pet Parent Reviews", visible: true },
        { type: "gallery", title: "Happy Customers", visible: true },
        { type: "faq", title: "Pet Care Guide", visible: true },
        { type: "newsletter", title: "Pet Tips", subtitle: "Care guides, new products & subscriber perks", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "kids",
      name: "Kids & Toys",
      description: "Playful layout for children's products and toys",
      category: "Lifestyle",
      theme: "kids",
      thumbnail: "🧸",
      sections: [
        { type: "hero", title: "Play, Learn, Grow", subtitle: "Safe, fun toys for every age", button: "Shop by Age", secondary: "Educational Toys", visible: true },
        { type: "categories", title: "Toy Categories", visible: true },
        { type: "products", title: "Top Picks", layout: "grid", count: 8, visible: true },
        { type: "gallery", title: "Playtime Moments", visible: true },
        { type: "testimonials", title: "Parent Approved", visible: true },
        { type: "faq", title: "Safety & Age Guide", visible: true },
        { type: "newsletter", title: "Parenting Tips", subtitle: "Activity ideas, developmental guides & sales", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
    {
      id: "luxury",
      name: "Luxury & Premium",
      description: "Sophisticated layout for high-end products",
      category: "Accessories",
      theme: "luxury",
      thumbnail: "💎",
      sections: [
        { type: "hero", title: "Exceptional Quality", subtitle: "Curated luxury for discerning tastes", button: "View Collection", secondary: "Private Viewing", visible: true },
        { type: "categories", title: "Collections", visible: true },
        { type: "products", title: "Signature Pieces", layout: "grid", count: 6, visible: true },
        { type: "gallery", title: "Craftsmanship", visible: true },
        { type: "testimonials", title: "Distinguished Clients", visible: true },
        { type: "video", title: "Our Story", visible: true },
        { type: "newsletter", title: "Exclusive Access", subtitle: "Invitation-only previews & private sales", visible: true },
        { type: "footer", title: "Footer", visible: true },
      ]
    },
  ];

  const getTemplates = () => TEMPLATES;
  const getTemplate = (id) => TEMPLATES.find(t => t.id === id);

  return {
    svgImage, hashColor, getProducts, getOrders, getCustomers,
    getAnalytics, getNotifications, defaultSections,
    getTemplates, getTemplate,
  };
})();

window.DemoData = DemoData;