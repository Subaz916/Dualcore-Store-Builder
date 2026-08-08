/* ============================================================
   DualCore — generator.js
   Builds the static storefront file bundle (multi-page site)
   ============================================================ */

const StoreGenerator = (() => {
  const { esc, fmtMoney } = Utils;

  const PAGE_SHELL = (shop, title, body, extra = "") => {
    const th = Storefront.getTheme();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} — ${esc(shop.name)}</title>
  <meta name="description" content="${esc(shop.tagline || "Beautiful products, fast delivery.")}">
  <meta property="og:title" content="${esc(title)} — ${esc(shop.name)}">
  <meta property="og:description" content="${esc(shop.tagline || "")}">
  <meta name="theme-color" content="${th.accent}">
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/responsive.css">
  <link rel="stylesheet" href="assets/css/animations.css">
  <!-- Supabase JS SDK -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  ${extra}
</head>
<body>
${NAVBAR(shop, title)}
<main>
${body}
</main>
${FOOTER(shop)}
<script src="assets/js/app.js"></script>
<script src="assets/js/cart.js"></script>
<script src="assets/js/search.js"></script>
<script src="assets/js/animations.js"></script>
</body>
</html>`;
  };

  const NAVBAR = (shop, active) => `
<header class="sf-nav glass">
  <a class="sf-brand" href="index.html">
    ${shop.logo_url ? `<img src="${shop.logo_url}" alt="${esc(shop.name)}" style="height:32px;display:inline-block;vertical-align:middle;margin-right:8px;border-radius:4px">` : ""}
    <span>${esc(shop.name)}</span>
  </a>
  <nav class="sf-nav-links">
    <a href="index.html" ${active === "Home" ? 'class="sf-active"' : ""}>Home</a>
    <a href="products.html" ${active === "Products" ? 'class="sf-active"' : ""}>Products</a>
    <a href="collections.html" ${active === "Collections" ? 'class="sf-active"' : ""}>Collections</a>
    <a href="about.html" ${active === "About" ? 'class="sf-active"' : ""}>About</a>
    <a href="contact.html" ${active === "Contact" ? 'class="sf-active"' : ""}>Contact</a>
  </nav>
  <div class="sf-nav-actions" style="display:flex;align-items:center;gap:12px">
    <div class="sf-search-bar" style="position:relative">
      <input type="text" id="global-search" placeholder="Search..." class="sf-search-input" style="padding:6px 12px 6px 32px;border-radius:99px;border:1px solid var(--line);font-size:.85rem;outline:none;width:150px;transition:width .3s">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--muted)"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    </div>
    <a href="cart.html" class="sf-cart" aria-label="Cart">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v9H4v-9M2 7h20v5H2z"/></svg>
      <span class="sf-cart-count">0</span>
    </a>
  </div>
</header>`;

  const FOOTER = (shop) => `
<footer class="sf-footer">
  <div class="sf-footer-grid">
    <div><h4>${esc(shop.name)}</h4><p style="color:var(--muted);font-size:.9rem">${esc(shop.tagline || "Beautiful products, delivered fast.")}</p></div>
    <div><h4>Shop</h4><a href="products.html">All products</a><a href="collections.html">Collections</a><a href="cart.html">Cart</a></div>
    <div><h4>Company</h4><a href="about.html">About</a><a href="contact.html">Contact</a><a href="blog.html">Blog</a></div>
    <div><h4>Legal</h4><a href="privacy.html">Privacy</a><a href="refund.html">Refunds</a><a href="shipping.html">Shipping</a><a href="terms.html">Terms</a></div>
  </div>
  <div class="sf-footer-bottom">
    <span>© ${new Date().getFullYear()} ${esc(shop.name)} — Powered by DualCore</span>
    <span>Secure payments · Fast delivery</span>
  </div>
</footer>`;

  /* ---------- Build the full file bundle ---------- */
  const build = (sections, shop, products = []) => {
    const files = {};
    const th = Storefront.getTheme();

    // --- index.html : full builder page ---
    files["index.html"] = Storefront.renderPage(sections, shop);

    // --- products.html : full catalog page ---
    const productGrid = `
    <section class="sf-products">
      <div class="sf-head"><span class="sf-eyebrow">Catalog</span><h2>All Products</h2></div>
      <div class="sf-filters-bar flex-between" style="margin-bottom: 24px; gap: 12px; flex-wrap: wrap; border-bottom: 1px solid var(--line); padding-bottom: 16px;">
        <div class="flex gap-2" id="category-filters" style="display:flex;gap:8px;flex-wrap:wrap">
          <!-- Category chips will be rendered by products.js -->
        </div>
        <div class="flex gap-2" style="display:flex;gap:8px;align-items:center">
          <select id="sort-select" style="padding: 8px 16px; border-radius: 99px; border: 1px solid var(--line); font-size: 0.85rem; outline: none; background: #fff; cursor:pointer">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Alphabetical: A-Z</option>
            <option value="name-desc">Alphabetical: Z-A</option>
          </select>
        </div>
      </div>
      <div class="sf-grid" id="products-grid">
        <!-- Rendered dynamically by products.js -->
      </div>
    </section>`;
    
    files["products.html"] = PAGE_SHELL(shop, "Products", productGrid, `<script src="assets/js/products.js" defer></script>`);

    // --- product.html : individual product page ---
    const productDetail = `
    <section class="sf-section">
      <div id="product-detail-container">
        <div style="display:flex;justify-content:center;padding:80px 0;"><div class="sf-spinner"></div></div>
      </div>
    </section>
    <section class="sf-section sf-related-section" style="border-top:1px solid var(--line);padding-top:50px;margin-top:30px">
      <div class="sf-head" style="text-align:left;margin-bottom:24px"><span class="sf-eyebrow">More items</span><h2>Related Products</h2></div>
      <div class="sf-grid" id="related-products-grid"></div>
    </section>`;
    
    files["product.html"] = PAGE_SHELL(shop, "Product Details", productDetail, `<script src="assets/js/products.js" defer></script>`);

    // --- collections.html : collections page ---
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    const catCards = cats.length ? cats.map(c => `
      <a class="sf-cat" href="products.html?category=${encodeURIComponent(c)}"><span>${esc(c)}</span><small>Explore →</small></a>`).join("")
      : `<a class="sf-cat" href="products.html"><span>Featured Collection</span><small>Explore →</small></a>`;
    
    files["collections.html"] = PAGE_SHELL(shop, "Collections", `
      <section class="sf-cats"><div class="sf-head"><span class="sf-eyebrow">Browse</span><h2>Collections</h2></div>
      <div class="sf-cat-grid">${catCards}</div></section>`);

    // --- content static pages ---
    const staticPages = {
      about: ["About", `
        <section class="sf-section"><div class="sf-head"><h2>About ${esc(shop.name)}</h2></div>
        <div style="max-width:680px;margin:0 auto;color:var(--muted);line-height:1.8">
        <p>Welcome to ${esc(shop.name)}. ${esc(shop.tagline || "We craft beautiful products with care.")}</p>
        <p style="margin-top:14px">We believe shopping should feel effortless — every product is curated, quality-checked, and packed with love before it reaches your door.</p>
        <p style="margin-top:14px">Questions? We're just a message away on our <a href="contact.html">contact page</a>.</p></div></section>`],
      contact: ["Contact", `
        <section class="sf-contact"><div class="sf-head"><span class="sf-eyebrow">Contact</span><h2>Get in touch</h2></div>
        <form class="sf-form sf-contact-form" style="max-width:480px;margin:0 auto">
          <input placeholder="Your name" required aria-label="Name"><input type="email" placeholder="Email" required aria-label="Email">
          <textarea placeholder="Message" rows="4" required aria-label="Message"></textarea>
          <button class="sf-btn" type="submit">Send message</button>
        </form></section>
        <script>
          document.querySelector('.sf-contact-form').addEventListener('submit', function(e){
            e.preventDefault();
            alert('Thank you! Your message has been sent. We\\'ll get back to you shortly.');
            e.target.reset();
          });
        </script>`],
      privacy: ["Privacy Policy", `<section class="sf-section"><div class="sf-head"><h2>Privacy Policy</h2></div><div style="max-width:680px;margin:0 auto;color:var(--muted)"><p>We respect your privacy. We only collect the data needed to process your orders and improve your experience. We never sell your personal information.</p><p style="margin-top:12px">You may request deletion of your data at any time by contacting us.</p></div></section>`],
      refund: ["Refund Policy", `<section class="sf-section"><div class="sf-head"><h2>Refund Policy</h2></div><div style="max-width:680px;margin:0 auto;color:var(--muted)"><p>Not happy with your order? You can request a refund within 14 days of delivery. Items must be unused and in original packaging.</p><p style="margin-top:12px">Refunds are processed within 5–7 business days to your original payment method.</p></div></section>`],
      shipping: ["Shipping Policy", `<section class="sf-section"><div class="sf-head"><h2>Shipping Policy</h2></div><div style="max-width:680px;margin:0 auto;color:var(--muted)"><p>We ship nationwide with delivery in 3–5 working days. International shipping takes 7–14 working days.</p><p style="margin-top:12px">Every order is tracked and insured until it reaches your door.</p></div></section>`],
      terms: ["Terms of Service", `<section class="sf-section"><div class="sf-head"><h2>Terms of Service</h2></div><div style="max-width:680px;margin:0 auto;color:var(--muted)"><p>By using this store you agree to fair use. Products are sold as described; prices may change without notice.</p><p style="margin-top:12px">For questions about these terms, contact us.</p></div></section>`],
      blog: ["Blog", `<section class="sf-section"><div class="sf-head"><h2>Blog</h2></div><div style="max-width:680px;margin:0 auto;color:var(--muted)"><p>Stories, guides and behind-the-scenes from ${esc(shop.name)}. New posts coming soon.</p></div></section>`],
      cart: ["Cart", `
        <section class="sf-section">
          <div class="sf-head"><h2>Your Cart</h2></div>
          <div style="max-width:680px;margin:0 auto">
            <div id="cartItems"></div>
            <div style="margin-top:22px;border-top:1px solid var(--line);padding-top:16px">
              <div class="flex-between" style="font-size:0.95rem;color:var(--muted);margin-bottom:8px">
                <span>Subtotal</span><span id="cartSubtotal">PKR 0</span>
              </div>
              <div class="flex-between" style="font-size:0.95rem;color:var(--muted);margin-bottom:8px">
                <span>Shipping</span><span id="cartShipping">PKR 150</span>
              </div>
              <div class="flex-between" style="font-weight:800;font-size:1.25rem;margin-top:12px">
                <span>Total</span><span id="cartTotal">PKR 0</span>
              </div>
            </div>
            <div style="text-align:center;margin-top:24px;display:flex;gap:12px;justify-content:center">
              <a class="sf-btn sf-btn-ghost" href="products.html">Continue Shopping</a>
              <a class="sf-btn" href="checkout.html" id="checkoutBtn">Proceed to checkout</a>
            </div>
          </div>
        </section>`],
      checkout: ["Checkout", `
        <section class="sf-section">
          <div class="sf-head"><h2>Checkout</h2></div>
          <div class="sf-checkout-container" style="display:grid;grid-template-columns:1fr 300px;gap:30px;max-width:900px;margin:0 auto">
            <div class="sf-checkout-form-wrap">
              <form class="sf-form sf-contact-form" id="checkoutForm" style="width:100%;align-items:stretch">
                <h3 style="margin-bottom:14px;font-size:1.1rem">Shipping Information</h3>
                <input placeholder="Full name" id="co-name" required aria-label="Name">
                <input type="email" placeholder="Email" id="co-email" required aria-label="Email">
                <input placeholder="Phone" id="co-phone" required aria-label="Phone">
                <input placeholder="Shipping address" id="co-address" required aria-label="Address">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <input placeholder="City" id="co-city" required aria-label="City">
                  <input placeholder="Country" id="co-country" value="Pakistan" required aria-label="Country">
                </div>
                
                <h3 style="margin-bottom:10px;margin-top:20px;font-size:1.1rem">Payment Method</h3>
                <div style="display:flex;gap:12px;margin-bottom:14px">
                  <label style="flex:1;border:1.5px solid var(--t-accent);padding:14px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:8px">
                    <input type="radio" name="payment" value="cod" checked style="width:auto">
                    <span>Cash on Delivery (COD)</span>
                  </label>
                </div>
                
                <button class="sf-btn" type="submit" id="placeOrderBtn" style="width:100%">Place order</button>
              </form>
            </div>
            
            <div class="sf-checkout-summary" style="background:var(--t-soft);padding:20px;border-radius:14px;height:fit-content">
              <h3 style="margin-bottom:14px;font-size:1.05rem">Order Summary</h3>
              <div id="summary-items" style="max-height:200px;overflow-y:auto;margin-bottom:14px"></div>
              <div style="border-top:1px solid rgba(0,0,0,0.08);padding-top:12px;font-size:0.9rem">
                <div class="flex-between" style="margin-bottom:6px;color:var(--muted)"><span>Subtotal</span><span id="summary-subtotal">PKR 0</span></div>
                <div class="flex-between" style="margin-bottom:6px;color:var(--muted)"><span>Shipping</span><span>PKR 150</span></div>
                <div class="flex-between" style="font-weight:800;font-size:1.1rem;margin-top:10px;border-top:1px dashed rgba(0,0,0,0.1);padding-top:10px">
                  <span>Total</span><span id="summary-total">PKR 0</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <script src="assets/js/checkout.js" defer></script>`],
      "404": ["Page not found", `
        <section class="sf-section" style="text-align:center">
          <h1 style="font-size:4rem">404</h1>
          <p class="muted" style="margin:10px 0 24px">This page went shopping.</p>
          <a class="sf-btn" href="index.html">Back to home</a>
        </section>`],
    };

    for (const [name, [title, body]] of Object.entries(staticPages)) {
      files[name + ".html"] = PAGE_SHELL(shop, title, body);
    }

    // --- assets/css/style.css ---
    files["assets/css/style.css"] = `/* Generated by DualCore — ${shop.name} */
${Storefront.__css()}
.sf-active{color:var(--t-accent) !important;font-weight:800}
.sf-section{max-width:1200px;margin:0 auto;padding:70px 6vw}
.sf-section-ph{text-align:center;padding:60px;color:var(--muted)}
.flex-between{display:flex;justify-content:space-between;align-items:center}
.flex{display:flex}
.gap-2{gap:8px}
.avatar{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#fff}
.avatar-sm{width:28px;height:28px;font-size:.78rem}
.muted{color:var(--muted)}
.sf-spinner{width:36px;height:36px;border:3px solid var(--t-soft);border-top-color:var(--t-accent);border-radius:50%;animation:sf-spin 0.8s linear infinite}
@keyframes sf-spin{to{transform:rotate(360deg)}}

/* Filters and chips */
.chip-btn{padding:8px 16px;border-radius:99px;border:1.5px solid var(--line);background:transparent;font-size:0.8rem;font-weight:600;cursor:pointer;transition:.2s;color:var(--muted)}
.chip-btn:hover,.chip-btn.active{border-color:var(--t-accent);color:var(--t-accent);background:var(--t-soft)}

/* Product detail layout */
.sf-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px}
.sf-detail-gallery{display:flex;flex-direction:column;gap:12px}
.sf-main-img-wrap{aspect-ratio:1;border-radius:18px;overflow:hidden;border:1px solid var(--line);background:var(--t-soft)}
.sf-main-img-wrap img{width:100%;height:100%;object-fit:cover}
.sf-thumbs{display:flex;gap:8px;overflow-x:auto}
.sf-thumb{width:64px;height:64px;border-radius:8px;border:1.5px solid var(--line);cursor:pointer;overflow:hidden;aspect-ratio:1;flex-shrink:0;background:var(--t-soft)}
.sf-thumb img{width:100%;height:100%;object-fit:cover}
.sf-thumb.active{border-color:var(--t-accent)}
.sf-detail-info{display:flex;flex-direction:column;gap:16px;align-items:flex-start}
.sf-detail-price{font-size:1.6rem;font-weight:800;color:var(--ink)}
.sf-detail-compare{text-decoration:line-through;color:var(--muted);font-size:1.1rem;margin-left:8px}
.sf-badge-discount{background:var(--t-accent);color:#fff;padding:4px 8px;border-radius:6px;font-size:0.75rem;font-weight:700}
.sf-detail-desc{font-size:0.95rem;line-height:1.7;color:var(--muted);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0;width:100%}
.sf-variant-section{width:100%}
.sf-variant-title{font-size:0.8rem;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:block}
.sf-variant-options{display:flex;gap:8px;flex-wrap:wrap}
.sf-variant-btn{padding:8px 16px;border-radius:8px;border:1.5px solid var(--line);background:#fff;font-size:0.85rem;cursor:pointer;font-weight:600;transition:.2s}
.sf-variant-btn.active{border-color:var(--t-accent);color:var(--t-accent);background:var(--t-soft)}
.sf-qty-row{display:flex;align-items:center;gap:12px}
.sf-qty-btn{width:36px;height:36px;border-radius:8px;border:1px solid var(--line);background:#fff;cursor:pointer;font-size:1.1rem;display:grid;place-items:center;font-weight:600}
.sf-qty-val{font-size:1.05rem;font-weight:700;width:24px;text-align:center}

/* Stock tag */
.sf-stock-tag{font-size:0.8rem;font-weight:700;display:flex;align-items:center;gap:6px}
.sf-stock-tag::before{content:"";width:8px;height:8px;border-radius:50%;display:inline-block}
.sf-stock-in{color:#10B981}.sf-stock-in::before{background:#10B981}
.sf-stock-low{color:#F59E0B}.sf-stock-low::before{background:#F59E0B}
.sf-stock-out{color:#EF4444}.sf-stock-out::before{background:#EF4444}

@media(max-width:768px){
  .sf-detail-grid{grid-template-columns:1fr;gap:24px}
}
`;

    // --- assets/css/responsive.css ---
    files["assets/css/responsive.css"] = `
@media(max-width:768px){
  .sf-nav-links{display:none}
  .sf-nav{padding:14px 20px}
  .sf-section{padding:48px 20px}
  .sf-hero{min-height:65vh}
  .sf-footer-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:480px){.sf-footer-grid{grid-template-columns:1fr}}`;

    // --- assets/css/animations.css ---
    files["assets/css/animations.css"] = `
.sf-hero{animation:sf-fade .8s ease}
@keyframes sf-fade{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.sf-product{transition:transform .25s ease, box-shadow .25s ease}
.sf-product:hover{transform:translateY(-5px)}
@media (prefers-reduced-motion: reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}`;

    // --- assets/js/app.js ---
    files["assets/js/app.js"] = `
(function(){
  // Load favicon if needed
  var d=document;
  var link=d.createElement('link');link.rel='icon';link.href='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="${th.accent}"/></svg>');
  d.head.appendChild(link);

  // Initialize Supabase if SDK is loaded
  window.SUPABASE_URL = "${APP_CONFIG.SUPABASE_URL}";
  window.SUPABASE_ANON_KEY = "${APP_CONFIG.SUPABASE_ANON_KEY}";
  window.supa = null;
  if (typeof supabase !== 'undefined' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    try {
      window.supa = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      console.log("Supabase initialized in storefront.");
    } catch(e) {
      console.warn("Supabase init failed in storefront:", e);
    }
  }
})();`;

    // --- assets/js/cart.js ---
    files["assets/js/cart.js"] = `
(function(){
  window.__cart = JSON.parse(localStorage.getItem('dc_cart') || '[]');
  
  window.syncCart = function(){
    localStorage.setItem('dc_cart', JSON.stringify(window.__cart));
    document.querySelectorAll('.sf-cart-count').forEach(function(e){
      e.textContent = window.__cart.reduce(function(acc, i){ return acc + (i.qty || 1); }, 0);
    });
  };
  
  window.syncCart();

  // Add to cart globally
  document.addEventListener('click', function(e){
    var add = e.target.closest('.sf-add');
    if(add){
      var name = add.dataset.name;
      var price = Number(add.dataset.price);
      var variant = add.dataset.variant ? JSON.parse(add.dataset.variant) : null;
      var image = add.dataset.image || '';
      
      var existing = window.__cart.find(function(i){
        return i.name === name && JSON.stringify(i.variant) === JSON.stringify(variant);
      });
      
      if(existing){
        existing.qty = (existing.qty || 1) + 1;
      } else {
        window.__cart.push({name: name, price: price, qty: 1, variant: variant, image: image});
      }
      
      window.syncCart();
      
      // button feedback
      var originalText = add.textContent;
      add.textContent = "Added ✓";
      add.style.background = "#00C896";
      add.style.borderColor = "#00C896";
      add.style.color = "#fff";
      setTimeout(function(){
        add.textContent = originalText;
        add.style.background = "";
        add.style.borderColor = "";
        add.style.color = "";
      }, 1000);
    }
  });

  // Render Cart Page Content
  var box = document.getElementById('cartItems');
  if(box){
    var renderCartPage = function(){
      if(!window.__cart.length){
        box.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted)">Your cart is empty. <br><br><a href="products.html" class="sf-btn" style="display:inline-block">Start shopping</a></div>';
        document.getElementById('cartSubtotal').textContent = 'PKR 0';
        document.getElementById('cartTotal').textContent = 'PKR 150';
        var checkoutBtn = document.getElementById('checkoutBtn');
        if(checkoutBtn) checkoutBtn.style.pointerEvents = 'none';
        if(checkoutBtn) checkoutBtn.style.opacity = '0.5';
      } else {
        var html = window.__cart.map(function(item, index){
          var varText = item.variant ? Object.entries(item.variant).map(function(entry){ return entry[0]+": "+entry[1]; }).join(', ') : '';
          var imgHtml = item.image ? '<img src="'+item.image+'" style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:1px solid var(--line)">' : '<div style="width:50px;height:50px;background:var(--t-soft);border-radius:6px"></div>';
          
          return '<div class="flex-between" style="padding:16px 0;border-bottom:1px solid var(--line);gap:16px">'+
            '<div style="display:flex;gap:12px;align-items:center">'+
              imgHtml +
              '<div>'+
                '<b style="font-size:0.95rem;display:block">'+item.name+'</b>'+
                (varText ? '<small class="muted" style="font-size:0.75rem">'+varText+'</small>' : '')+
                '<div style="margin-top:6px;font-size:0.85rem"><b>'+item.price.toLocaleString()+'</b></div>'+
              '</div>'+
            '</div>'+
            '<div style="display:flex;align-items:center;gap:12px">'+
              '<div class="sf-qty-row">'+
                '<button class="sf-qty-btn cart-qty-minus" data-idx="'+index+'">-</button>'+
                '<span class="sf-qty-val">'+(item.qty || 1)+'</span>'+
                '<button class="sf-qty-btn cart-qty-plus" data-idx="'+index+'">+</button>'+
              '</div>'+
              '<button style="background:none;border:none;color:#EF4444;font-size:1.2rem;cursor:pointer;padding:4px" class="cart-remove" data-idx="'+index+'">🗑</button>'+
            '</div>'+
          '</div>';
        }).join('');
        
        box.innerHTML = html;
        
        var subtotal = window.__cart.reduce(function(s,i){return s + (i.price * (i.qty || 1))}, 0);
        document.getElementById('cartSubtotal').textContent = 'PKR ' + subtotal.toLocaleString();
        document.getElementById('cartTotal').textContent = 'PKR ' + (subtotal + 150).toLocaleString();
        
        var checkoutBtn = document.getElementById('checkoutBtn');
        if(checkoutBtn) checkoutBtn.style.pointerEvents = '';
        if(checkoutBtn) checkoutBtn.style.opacity = '';
        
        // bind events
        box.querySelectorAll('.cart-qty-minus').forEach(function(btn){
          btn.onclick = function(){
            var idx = Number(btn.dataset.idx);
            if(window.__cart[idx].qty > 1) {
              window.__cart[idx].qty--;
              window.syncCart();
              renderCartPage();
            }
          };
        });
        box.querySelectorAll('.cart-qty-plus').forEach(function(btn){
          btn.onclick = function(){
            var idx = Number(btn.dataset.idx);
            window.__cart[idx].qty++;
            window.syncCart();
            renderCartPage();
          };
        });
        box.querySelectorAll('.cart-remove').forEach(function(btn){
          btn.onclick = function(){
            var idx = Number(btn.dataset.idx);
            window.__cart.splice(idx, 1);
            window.syncCart();
            renderCartPage();
          };
        });
      }
    };
    renderCartPage();
  }
})();`;

    // --- assets/js/products.js ---
    files["assets/js/products.js"] = `
(function(){
  // Statically embed product database
  window.__products = ${JSON.stringify(products)};
  
  // Helpers
  var qs = function(key){ return new URLSearchParams(location.search).get(key) || ''; };
  var esc = function(s){ return String(s || '').replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); };
  var fmtPrice = function(n){ return 'PKR ' + Number(n || 0).toLocaleString(); };

  // ─── CASE 1: PRODUCT LIST PAGE (products.html) ───
  var grid = document.getElementById('products-grid');
  var filtersWrap = document.getElementById('category-filters');
  
  if(grid) {
    var selectedCat = qs('category') || 'all';
    var sortVal = 'featured';
    var searchVal = qs('q') || '';
    
    // Set global search input if query is in URL
    var globalInput = document.getElementById('global-search');
    if (globalInput && searchVal) globalInput.value = searchVal;

    var renderGrid = function() {
      var list = window.__products.filter(function(p){
        var matchCat = selectedCat === 'all' || p.category === selectedCat;
        var matchQ = !searchVal || p.name.toLowerCase().includes(searchVal.toLowerCase()) || (p.description || '').toLowerCase().includes(searchVal.toLowerCase());
        return matchCat && matchQ;
      });

      // Sorting
      if(sortVal === 'price-asc') {
        list.sort(function(a,b){ return a.price - b.price; });
      } else if(sortVal === 'price-desc') {
        list.sort(function(a,b){ return b.price - a.price; });
      } else if(sortVal === 'name-asc') {
        list.sort(function(a,b){ return a.name.localeCompare(b.name); });
      } else if(sortVal === 'name-desc') {
        list.sort(function(a,b){ return b.name.localeCompare(a.name); });
      }

      if(!list.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--muted)">No products match your search.</div>';
        return;
      }

      grid.innerHTML = list.map(function(p){
        var imgUrl = p.images && p.images[0] ? p.images[0] : 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="background:var(--t-soft)"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="var(--t-accent)">No Image</text></svg>');
        return '<article class="sf-product">'+
          '<a href="product.html?id='+p.id+'" style="display:block">'+
            '<div class="sf-product-media"><img src="'+imgUrl+'" alt="'+esc(p.name)+'" loading="lazy"></div>'+
          '</a>'+
          '<div class="sf-product-body">'+
            '<a href="product.html?id='+p.id+'" style="display:block;width:100%"><h3 style="margin-bottom:4px">'+esc(p.name)+'</h3></a>'+
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
              '<span class="sf-price">'+fmtPrice(p.price)+'</span>'+
              (p.compare_at ? '<s class="sf-compare" style="font-size:0.75rem">'+fmtPrice(p.compare_at)+'</s>' : '')+
            '</div>'+
            '<button class="sf-btn sf-btn-outline sf-add" data-name="${esc(shop.name)}" data-price="'+p.price+'" data-name="'+esc(p.name)+'" data-image="'+imgUrl+'" style="width:100%">Add to cart</button>'+
          '</div>'+
        '</article>';
      }).join('');
    };

    // Render category filter chips
    if(filtersWrap) {
      var categories = ['all'].concat([...new Set(window.__products.map(function(p){ return p.category; }).filter(Boolean))]);
      filtersWrap.innerHTML = categories.map(function(c){
        var activeClass = c === selectedCat ? 'active' : '';
        return '<button class="chip-btn '+activeClass+'" data-cat="'+c+'">'+esc(c.toUpperCase())+'</button>';
      }).join('');

      filtersWrap.querySelectorAll('.chip-btn').forEach(function(btn){
        btn.onclick = function(){
          filtersWrap.querySelectorAll('.chip-btn').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
          selectedCat = btn.dataset.cat;
          renderGrid();
        };
      });
    }

    // Sort listener
    var sortSelect = document.getElementById('sort-select');
    if(sortSelect){
      sortSelect.onchange = function(e){
        sortVal = e.target.value;
        renderGrid();
      };
    }

    // Custom search input listener (if present)
    document.addEventListener('sf-search-update', function(e){
      searchVal = e.detail;
      renderGrid();
    });

    renderGrid();
  }

  // ─── CASE 2: PRODUCT DETAILS PAGE (product.html) ───
  var detailContainer = document.getElementById('product-detail-container');
  if(detailContainer) {
    var pid = qs('id');
    var p = window.__products.find(function(item){ return item.id === pid; }) || window.__products[0];
    
    if(!p) {
      detailContainer.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">Product not found. <a href="products.html">Return to catalog</a></div>';
      return;
    }

    // Set page title dynamically
    document.title = p.name + " — " + "${esc(shop.name)}";

    // Setup variant tracking
    var selectedVariant = {};
    
    // Extract unique colors/sizes from variants json
    var colors = [];
    var sizes = [];
    if(p.variants && Array.isArray(p.variants)) {
      p.variants.forEach(function(v){
        if(v.color && colors.indexOf(v.color) === -1) colors.push(v.color);
        if(v.size && sizes.indexOf(v.size) === -1) sizes.push(v.size);
      });
    }

    var images = p.images && p.images.length ? p.images : ['data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="background:var(--t-soft)"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="var(--t-accent)">No Image</text></svg>')];
    
    // Stock status helper
    var stockStatusHtml = function(inventory){
      if(inventory <= 0) return '<span class="sf-stock-tag sf-stock-out">Out of stock</span>';
      if(inventory < 5) return '<span class="sf-stock-tag sf-stock-low">Low stock ('+inventory+' left)</span>';
      return '<span class="sf-stock-tag sf-stock-in">In stock</span>';
    };

    var html = '<div class="sf-detail-grid">'+
      // Images
      '<div class="sf-detail-gallery">'+
        '<div class="sf-main-img-wrap" id="detail-main-wrap"><img src="'+images[0]+'" id="detail-main-img" alt="'+esc(p.name)+'"></div>'+
        (images.length > 1 ? '<div class="sf-thumbs">' + images.map(function(img, i){ return '<div class="sf-thumb '+(i===0?'active':'')+'" data-idx="'+i+'"><img src="${esc(shop.name)}" data-src="'+img+'" src="'+img+'"></div>'; }).join('') + '</div>' : '') +
      '</div>'+
      // Product details column
      '<div class="sf-detail-info">'+
        '<div class="sf-eyebrow">'+esc(p.category || "Product")+'</div>'+
        '<h1 style="font-size:2rem;margin:0;line-height:1.2">'+esc(p.name)+'</h1>'+
        stockStatusHtml(p.inventory !== undefined ? p.inventory : 10)+
        
        '<div style="display:flex;align-items:center;gap:12px">'+
          '<span class="sf-detail-price" id="detail-price">'+fmtPrice(p.price)+'</span>'+
          (p.compare_at ? '<s class="sf-detail-compare">'+fmtPrice(p.compare_at)+'</s>' : '')+
          (p.compare_at ? '<span class="sf-badge-discount">SAVE '+Math.round(((p.compare_at - p.price)/p.compare_at)*100)+'%</span>' : '')+
        '</div>'+
        
        '<div class="sf-detail-desc"><p>'+esc(p.description || "No description available for this item.")+'</p></div>'+
        
        // Variants section
        (colors.length ? 
          '<div class="sf-variant-section">'+
            '<span class="sf-variant-title">Color</span>'+
            '<div class="sf-variant-options" id="color-options">'+
              colors.map(function(c, i){ return '<button class="sf-variant-btn '+(i===0?'active':'')+'" data-color="'+c+'">'+esc(c)+'</button>'; }).join('')+
            '</div>'+
          '</div>' : '') +
        (sizes.length ? 
          '<div class="sf-variant-section">'+
            '<span class="sf-variant-title">Size</span>'+
            '<div class="sf-variant-options" id="size-options">'+
              sizes.map(function(s, i){ return '<button class="sf-variant-btn '+(i===0?'active':'')+'" data-size="'+s+'">'+esc(s)+'</button>'; }).join('')+
            '</div>'+
          '</div>' : '') +
        
        // Quantity section
        '<div class="sf-variant-section">'+
          '<span class="sf-variant-title">Quantity</span>'+
          '<div class="sf-qty-row">'+
            '<button class="sf-qty-btn" id="qty-minus">-</button>'+
            '<span class="sf-qty-val" id="qty-val">1</span>'+
            '<button class="sf-qty-btn" id="qty-plus">+</button>'+
          '</div>'+
        '</div>'+
        
        // Add to cart button
        '<button class="sf-btn" id="add-to-cart-btn" style="width:100%;margin-top:10px;padding:16px 24px;font-size:1.05rem" '+(p.inventory===0?'disabled':'')+'>'+
          (p.inventory===0 ? 'Sold Out' : 'Add to Cart')+
        '</button>'+
      '</div>'+
    '</div>';

    detailContainer.innerHTML = html;

    // Related products logic
    var relatedGrid = document.getElementById('related-products-grid');
    if(relatedGrid) {
      var related = window.__products.filter(function(item){
        return item.id !== p.id && item.category === p.category;
      }).slice(0, 4);
      if(!related.length) {
        related = window.__products.filter(function(item){ return item.id !== p.id; }).slice(0, 4);
      }
      if(related.length) {
        relatedGrid.innerHTML = related.map(function(rp){
          var rimg = rp.images && rp.images[0] ? rp.images[0] : '';
          return '<article class="sf-product">'+
            '<a href="product.html?id='+rp.id+'">'+
              '<div class="sf-product-media"><img src="'+rimg+'" alt="'+esc(rp.name)+'"></div>'+
            '</a>'+
            '<div class="sf-product-body">'+
              '<a href="product.html?id='+rp.id+'"><h3>'+esc(rp.name)+'</h3></a>'+
              '<span class="sf-price">'+fmtPrice(rp.price)+'</span>'+
              '<button class="sf-btn sf-btn-outline sf-add" data-name="'+esc(rp.name)+'" data-price="'+rp.price+'" data-image="'+rimg+'" style="width:100%">Add to cart</button>'+
            '</div>'+
          '</article>';
        }).join('');
      } else {
        document.querySelector('.sf-related-section').style.display = 'none';
      }
    }

    // Variant selection behavior
    if(colors.length) selectedVariant.color = colors[0];
    if(sizes.length) selectedVariant.size = sizes[0];

    var colorOpts = document.getElementById('color-options');
    if(colorOpts){
      colorOpts.querySelectorAll('.sf-variant-btn').forEach(function(btn){
        btn.onclick = function(){
          colorOpts.querySelectorAll('.sf-variant-btn').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
          selectedVariant.color = btn.dataset.color;
          updatePriceByVariant();
        };
      });
    }

    var sizeOpts = document.getElementById('size-options');
    if(sizeOpts){
      sizeOpts.querySelectorAll('.sf-variant-btn').forEach(function(btn){
        btn.onclick = function(){
          sizeOpts.querySelectorAll('.sf-variant-btn').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
          selectedVariant.size = btn.dataset.size;
          updatePriceByVariant();
        };
      });
    }

    // Dynamic price shift for variants
    var updatePriceByVariant = function(){
      if(p.variants && p.variants.length){
        var match = p.variants.find(function(v){
          var matchColor = !selectedVariant.color || v.color === selectedVariant.color;
          var matchSize = !selectedVariant.size || v.size === selectedVariant.size;
          return matchColor && matchSize;
        });
        if(match && match.price) {
          document.getElementById('detail-price').textContent = fmtPrice(match.price);
        }
      }
    };

    // Quantity selector
    var qtyValEl = document.getElementById('qty-val');
    var qty = 1;
    document.getElementById('qty-minus').onclick = function(){
      if(qty > 1) { qty--; qtyValEl.textContent = qty; }
    };
    document.getElementById('qty-plus').onclick = function(){
      qty++; qtyValEl.textContent = qty;
    };

    // Gallery switching
    detailContainer.querySelectorAll('.sf-thumb').forEach(function(thumb){
      thumb.onclick = function(){
        detailContainer.querySelectorAll('.sf-thumb').forEach(function(t){ t.classList.remove('active'); });
        thumb.classList.add('active');
        var idx = Number(thumb.dataset.idx);
        document.getElementById('detail-main-img').src = images[idx];
      };
    });

    // Add to cart click
    document.getElementById('add-to-cart-btn').onclick = function(e){
      var btn = e.target;
      var itemPrice = p.price;
      if(p.variants && p.variants.length){
        var match = p.variants.find(function(v){
          var matchColor = !selectedVariant.color || v.color === selectedVariant.color;
          var matchSize = !selectedVariant.size || v.size === selectedVariant.size;
          return matchColor && matchSize;
        });
        if(match && match.price) itemPrice = match.price;
      }

      var existing = window.__cart.find(function(i){
        return i.name === p.name && JSON.stringify(i.variant) === JSON.stringify(selectedVariant);
      });
      
      if(existing){
        existing.qty = (existing.qty || 1) + qty;
      } else {
        window.__cart.push({
          name: p.name,
          price: itemPrice,
          qty: qty,
          variant: Object.keys(selectedVariant).length ? selectedVariant : null,
          image: images[0]
        });
      }

      window.syncCart();

      // feedback
      var oldText = btn.textContent;
      btn.textContent = "Added to Cart! ✓";
      btn.style.background = "#00C896";
      btn.style.borderColor = "#00C896";
      setTimeout(function(){
        btn.textContent = oldText;
        btn.style.background = "";
        btn.style.borderColor = "";
      }, 1200);
    };
  }
})();`;

    // --- assets/js/checkout.js ---
    files["assets/js/checkout.js"] = `
(function(){
  var cart = JSON.parse(localStorage.getItem('dc_cart') || '[]');
  
  // Checkout page rendering
  var summaryBox = document.getElementById('summary-items');
  if(summaryBox) {
    if(!cart.length) {
      alert("Your cart is empty! Redirecting to products.");
      location.href = "products.html";
      return;
    }

    summaryBox.innerHTML = cart.map(function(item){
      var varText = item.variant ? Object.entries(item.variant).map(function(entry){ return entry[0]+": "+entry[1]; }).join(', ') : '';
      return '<div class="flex-between" style="padding:10px 0;border-bottom:1px dashed rgba(0,0,0,0.06)">'+
        '<div style="font-size:0.85rem"><b>'+item.name+'</b> x'+(item.qty || 1)+
          (varText ? '<br><small class="muted">'+varText+'</small>' : '')+
        '</div>'+
        '<b>'+(item.price * (item.qty || 1)).toLocaleString()+'</b>'+
      '</div>';
    }).join('');

    var subtotal = cart.reduce(function(acc, i){ return acc + (i.price * (i.qty || 1)); }, 0);
    var shipping = 150;
    var total = subtotal + shipping;

    document.getElementById('summary-subtotal').textContent = 'PKR ' + subtotal.toLocaleString();
    document.getElementById('summary-total').textContent = 'PKR ' + total.toLocaleString();

    // Order form submit
    var form = document.getElementById('checkoutForm');
    var placeBtn = document.getElementById('placeOrderBtn');

    form.onsubmit = async function(e) {
      e.preventDefault();
      
      placeBtn.disabled = true;
      placeBtn.innerHTML = '<span class="sf-spinner" style="width:18px;height:18px;display:inline-block;vertical-align:middle;margin-right:8px"></span> Placing Order...';

      var name = document.getElementById('co-name').value.trim();
      var email = document.getElementById('co-email').value.trim();
      var phone = document.getElementById('co-phone').value.trim();
      var address = document.getElementById('co-address').value.trim();
      var city = document.getElementById('co-city').value.trim();
      var country = document.getElementById('co-country').value.trim();

      var orderId = 'order-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

      var orderData = {
        id: orderId,
        user_id: "${shop.user_id}",
        customer_name: name,
        customer_email: email,
        phone: phone,
        address: address,
        city: city,
        country: country,
        items: cart,
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        status: "pending",
        payment_method: "cod",
        created_at: new Date().toISOString()
      };

      // Attempt to save to Supabase
      var supaSaved = false;
      if (window.supa) {
        try {
          // 1. Insert order to DB
          var { error } = await window.supa.from('orders').insert(orderData);
          if (!error) {
            supaSaved = true;
            console.log("Order saved to database.");
            
            // 2. Track event in analytics
            await window.supa.from('analytics').insert({
              user_id: "${shop.user_id}",
              store_id: "${shop.id}",
              event: "purchase",
              meta: { total: total, items_count: cart.length }
            });
          } else {
            console.warn("Supabase order insert error:", error.message);
          }
        } catch(err) {
          console.warn("Could not save order to Supabase:", err);
        }
      }

      // If Supabase wasn't connected, fallback to localStorage mock of orders (so merchant sees in demo mode)
      if(!supaSaved) {
        var localOrders = JSON.parse(localStorage.getItem('dc_orders') || '[]');
        localOrders.push(orderData);
        localStorage.setItem('dc_orders', JSON.stringify(localOrders));
        
        // Also save customer details
        var localCustomers = JSON.parse(localStorage.getItem('dc_customers') || '[]');
        var cExists = localCustomers.some(function(c){ return c.email === email; });
        if(!cExists) {
          localCustomers.push({ name: name, email: email, phone: phone, address: address, city: city, created_at: new Date().toISOString() });
          localStorage.setItem('dc_customers', JSON.stringify(localCustomers));
        }
      }

      // Clear Cart
      localStorage.removeItem('dc_cart');

      // Render beautiful confirmation inside container
      document.querySelector('.sf-checkout-container').innerHTML = 
        '<div style="grid-column: 1 / -1; text-align:center; padding:50px 20px; background:var(--t-soft); border-radius:18px">'+
          '<div style="font-size:4rem; margin-bottom:16px">🎉</div>'+
          '<h2>Thank You for Your Order!</h2>'+
          '<p class="muted" style="margin:8px 0 24px">Your order has been placed successfully. Your order ID is <b>#'+orderId.slice(-6).toUpperCase()+'</b>.</p>'+
          '<div style="max-width:400px; margin: 0 auto; background:#fff; padding:20px; border-radius:12px; border:1px solid var(--line); text-align:left; margin-bottom:24px">'+
            '<b style="font-size:0.95rem; display:block; margin-bottom:8px">Shipping Details:</b>'+
            '<div style="font-size:0.9rem; line-height:1.6">'+
              '<b>Name:</b> '+esc(name)+'<br>'+
              '<b>Address:</b> '+esc(address)+', '+esc(city)+'<br>'+
              '<b>Phone:</b> '+esc(phone)+'<br>'+
              '<b>Total Paid:</b> '+fmtPrice(total)+' (COD)'+
            '</div>'+
          '</div>'+
          '<a href="index.html" class="sf-btn">Return Home</a>'+
        '</div>';
    };
  }
})();`;

    // --- assets/js/search.js ---
    files["assets/js/search.js"] = `
(function(){
  var searchInput = document.getElementById('global-search');
  if(searchInput) {
    searchInput.addEventListener('keydown', function(e){
      if(e.key === 'Enter') {
        var query = e.target.value.trim();
        if(query) {
          if(location.pathname.indexOf('products.html') !== -1) {
            // trigger custom event to search in products.js
            var ev = new CustomEvent('sf-search-update', { detail: query });
            document.dispatchEvent(ev);
          } else {
            // redirect to products page
            location.href = 'products.html?q=' + encodeURIComponent(query);
          }
        }
      }
    });
  }
})();`;

    // --- assets/js/animations.js ---
    files["assets/js/animations.js"] = `
(function(){
  // Reveal products on scroll
  var items = document.querySelectorAll('.sf-product');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    items.forEach(function(item) {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(item);
    });
  } else {
    items.forEach(function(item) {
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    });
  }
})();`;

    // --- robots.txt & sitemap.xml ---
    files["robots.txt"] = `User-agent: *\nAllow: /\nSitemap: /sitemap.xml`;
    files["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc></url>
  <url><loc>/products.html</loc></url>
  <url><loc>/collections.html</loc></url>
  <url><loc>/about.html</loc></url>
  <url><loc>/contact.html</loc></url>
  <url><loc>/blog.html</loc></url>
</urlset>`;

    return files;
  };

  return { build, PAGE_SHELL, NAVBAR, FOOTER };
})();

window.StoreGenerator = StoreGenerator;