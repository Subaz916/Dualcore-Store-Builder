/* ============================================================
   DualCore — generator.js
   Builds the static storefront file bundle (multi-page site)
   ============================================================ */

const StoreGenerator = (() => {
  const { esc, fmtMoney } = Utils;

  const PAGE_SHELL = (shop, title, body, extra = "") => {
    const th = Storefront.getTheme(shop.theme);
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
<script src="assets/js/animations.js"></script>
</body>
</html>`;
  };

  const NAVBAR = (shop, active) => `
<header class="sf-nav glass">
  <a class="sf-brand" href="index.html">${esc(shop.name)}</a>
  <nav class="sf-nav-links">
    <a href="index.html" ${active === "Home" ? 'class="sf-active"' : ""}>Home</a>
    <a href="products.html" ${active === "Products" ? 'class="sf-active"' : ""}>Products</a>
    <a href="collections.html" ${active === "Collections" ? 'class="sf-active"' : ""}>Collections</a>
    <a href="about.html" ${active === "About" ? 'class="sf-active"' : ""}>About</a>
    <a href="contact.html" ${active === "Contact" ? 'class="sf-active"' : ""}>Contact</a>
  </nav>
  <div class="sf-nav-actions">
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
    const th = Storefront.getTheme(shop.theme);

    // --- index.html : full builder page ---
    files["index.html"] = Storefront.renderPage(sections, shop);

    // --- products page ---
    const productGrid = products.length ? `
    <section class="sf-products">
      <div class="sf-head"><span class="sf-eyebrow">Catalog</span><h2>All Products</h2></div>
      <div class="sf-grid">
        ${products.map(p => `
          <article class="sf-product" data-id="${p.id}">
            <div class="sf-product-media">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy">` : ""}</div>
            <div class="sf-product-body">
              <h3>${esc(p.name)}</h3>
              <span class="sf-price">${fmtMoney(p.price)}</span>
              ${p.compare_at ? `<s class="sf-compare">${fmtMoney(p.compare_at)}</s>` : ""}
              <button class="sf-btn sf-btn-outline sf-add" data-name="${esc(p.name)}" data-price="${p.price}">Add to cart</button>
            </div>
          </article>`).join("")}
      </div>
    </section>`
    : `<section class="sf-section-ph"><p>No products yet — check back soon.</p></section>`;
    files["products.html"] = PAGE_SHELL(shop, "Products", productGrid);

    // --- collections page ---
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    const catCards = cats.length ? cats.map(c => `
      <a class="sf-cat" href="products.html"><span>${esc(c)}</span><small>Explore →</small></a>`).join("")
      : `<a class="sf-cat" href="products.html"><span>Featured</span><small>Explore →</small></a>`;
    files["collections.html"] = PAGE_SHELL(shop, "Collections", `
      <section class="sf-cats"><div class="sf-head"><span class="sf-eyebrow">Browse</span><h2>Collections</h2></div>
      <div class="sf-cat-grid">${catCards}</div></section>`);

    // --- simple content pages ---
    const staticPages = {
      about: ["About", `
        <section class="sf-section"><div class="sf-head"><h2>About ${esc(shop.name)}</h2></div>
        <div style="max-width:680px;margin:0 auto;color:var(--muted);line-height:1.8">
        <p>Welcome to ${esc(shop.name)}. ${esc(shop.tagline || "We craft beautiful products with care.")}</p>
        <p style="margin-top:14px">We believe shopping should feel effortless — every product is curated, quality-checked, and packed with love before it reaches your door.</p>
        <p style="margin-top:14px">Questions? We're just a message away on our <a href="contact.html">contact page</a>.</p></div></section>`],
      contact: ["Contact", `
        <section class="sf-contact"><div class="sf-head"><span class="sf-eyebrow">Contact</span><h2>Get in touch</h2></div>
        <form class="sf-form sf-contact-form">
          <input placeholder="Your name" aria-label="Name"><input type="email" placeholder="Email" aria-label="Email">
          <textarea placeholder="Message" rows="4" aria-label="Message"></textarea>
          <button class="sf-btn" type="button" onclick="alert('Message sent! We\\'ll reply soon.');this.form.reset()">Send message</button>
        </form></section>`],
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
            <div class="flex-between" style="margin-top:22px;font-weight:800;font-size:1.15rem">
              <span>Total</span><span id="cartTotal">PKR 0</span>
            </div>
            <div style="text-align:center;margin-top:24px">
              <a class="sf-btn" href="checkout.html" id="checkoutBtn">Proceed to checkout</a>
            </div>
          </div>
        </section>`],
      checkout: ["Checkout", `
        <section class="sf-section">
          <div class="sf-head"><h2>Checkout</h2></div>
          <form class="sf-form sf-contact-form" onsubmit="event.preventDefault();alert('Thank you! Your order has been placed (demo checkout).');localStorage.removeItem('dc_cart');location.href='index.html'">
            <input placeholder="Full name" required aria-label="Name">
            <input type="email" placeholder="Email" required aria-label="Email">
            <input placeholder="Phone" required aria-label="Phone">
            <input placeholder="Shipping address" required aria-label="Address">
            <button class="sf-btn">Place order</button>
          </form>
        </section>`],
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

    // --- assets/css ---
    files["assets/css/style.css"] = `/* Generated by DualCore — ${shop.name} */
${Storefront.__css(shop.theme)}
.sf-active{opacity:.6;border-bottom:2px solid var(--t-accent);padding-bottom:2px}
.sf-section{max-width:1200px;margin:0 auto;padding:70px 6vw}
.sf-section-ph{text-align:center;padding:60px;color:var(--muted)}`;

    files["assets/css/responsive.css"] = `
@media(max-width:768px){
  .sf-nav-links{display:none}
  .sf-nav{padding:14px 20px}
  .sf-section{padding:48px 20px}
  .sf-hero{min-height:65vh}
  .sf-footer-grid{grid-template-columns:1fr 1fr}
}
@media(max-width:480px){.sf-footer-grid{grid-template-columns:1fr}}`;

    files["assets/css/animations.css"] = `
.sf-hero{animation:sf-fade .8s ease}
@keyframes sf-fade{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.sf-product{transition:transform .25s ease, box-shadow .25s ease}
.sf-product:hover{transform:translateY(-5px)}
@media (prefers-reduced-motion: reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}`;

    // --- assets/js ---
    files["assets/js/app.js"] = `
(function(){
  var d=document;
  var link=d.createElement('link');link.rel='icon';link.href='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="${th.accent}"/></svg>');d.head.appendChild(link);
})();`;

    files["assets/js/cart.js"] = `
(function(){
  var cart = JSON.parse(localStorage.getItem('dc_cart') || '[]');
  var sync = function(){ localStorage.setItem('dc_cart', JSON.stringify(cart));
    document.querySelectorAll('.sf-cart-count').forEach(function(e){ e.textContent = cart.length; }); };
  sync();
  document.addEventListener('click', function(e){
    var add = e.target.closest('.sf-add');
    if(add){ cart.push({name:add.dataset.name, price:Number(add.dataset.price)}); sync();
      var t=e.target.closest('.sf-product'); if(t){t.classList.add('added');setTimeout(function(){t.classList.remove('added')},900);} }
  });
  var box = document.getElementById('cartItems');
  if(box){
    if(!cart.length){ box.innerHTML='<p style="text-align:center;color:var(--muted)">Your cart is empty. <a href="products.html">Start shopping</a></p>'; }
    else {
      box.innerHTML = cart.map(function(i){ return '<div class="flex-between" style="padding:12px 0;border-bottom:1px dashed var(--line)"><span>'+i.name+'</span><b>'+i.price.toLocaleString()+'</b></div>'; }).join('');
      var total = cart.reduce(function(s,i){return s+i.price},0);
      document.getElementById('cartTotal').textContent = 'PKR ' + total.toLocaleString();
    }
  }
})();`;

    files["assets/js/animations.js"] = `
(function(){
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('sf-reveal');io.unobserve(e.target);} }); },{threshold:.15}) : null;
  document.querySelectorAll('.sf-product').forEach(function(el,i){ el.style.opacity=0; el.style.transform='translateY(14px)'; el.style.transition='all .5s ease .0'+(i%4)+'s'; if(io) io.observe(el); else el.style.opacity=1; });
  document.addEventListener('reveal-fix', function(){}); 
  document.querySelectorAll('.sf-reveal').forEach(function(el){el.style.opacity=1;el.style.transform='none'});
  // fallback: reveal everything after load
  window.addEventListener('load', function(){ document.querySelectorAll('.sf-product').forEach(function(el){el.style.opacity=1;el.style.transform='none';}); });
})();`;

    // --- robots + sitemap ---
    files["robots.txt"] = `User-agent: *\nAllow: /\nSitemap: /sitemap.xml`;
    files["sitemap.xml"] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc></url><url><loc>/products.html</loc></url><url><loc>/collections.html</loc></url><url><loc>/about.html</loc></url><url><loc>/contact.html</loc></url><url><loc>/blog.html</loc></url>
</urlset>`;

    return files;
  };

  return { build, PAGE_SHELL, NAVBAR, FOOTER };
})();

window.StoreGenerator = StoreGenerator;