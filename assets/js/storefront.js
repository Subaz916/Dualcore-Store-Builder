/* ============================================================
   DualCore — storefront.js
   Pure JS engine that renders store sections into HTML.
   Used by: builder preview, store.html storefronts, generator.
   ============================================================ */

const Storefront = (() => {
  const { esc } = Utils;

  /* ---------------- 30 Themes ---------------- */
  const THEMES = [
    { slug: "fashion",    name: "Fashion",    accent: "#C0894A", soft: "#F7F0E6", font: "Georgia, serif" },
    { slug: "clothing",   name: "Clothing",   accent: "#111827", soft: "#F3F4F6", font: "'Avenir Next', sans-serif" },
    { slug: "electronics",name: "Electronics",accent: "#0EA5E9", soft: "#E0F2FE", font: "'Inter', sans-serif" },
    { slug: "furniture",  name: "Furniture",  accent: "#9A7B4F", soft: "#F5EFE4", font: "Georgia, serif" },
    { slug: "jewelry",    name: "Jewelry",    accent: "#B79974", soft: "#FAF7F2", font: "Didot, serif" },
    { slug: "shoes",      name: "Shoes",      accent: "#EA580C", soft: "#FFF1E8", font: "'Archivo', sans-serif" },
    { slug: "food",       name: "Food",       accent: "#E11D48", soft: "#FFE8EC", font: "'Poppins', sans-serif" },
    { slug: "restaurant", name: "Restaurant", accent: "#7C2D12", soft: "#FDE8D7", font: "'Playfair Display', serif" },
    { slug: "coffee",     name: "Coffee",     accent: "#92400E", soft: "#F4E8D7", font: "'Cormorant Garamond', serif" },
    { slug: "bakery",     name: "Bakery",     accent: "#D97706", soft: "#FEF3C7", font: "'Lora', serif" },
    { slug: "books",      name: "Books",      accent: "#4F46E5", soft: "#E3E2FF", font: "Georgia, serif" },
    { slug: "sports",     name: "Sports",     accent: "#16A34A", soft: "#DCFCE7", font: "'Inter', sans-serif" },
    { slug: "beauty",     name: "Beauty",     accent: "#DB2777", soft: "#FCE7F3", font: "'Playfair Display', serif" },
    { slug: "perfume",    name: "Perfume",    accent: "#A78BFA", soft: "#EFE9FF", font: "Didot, serif" },
    { slug: "gaming",     name: "Gaming",     accent: "#7C3AED", soft: "#EDE9FE", font: "'Space Grotesk', sans-serif" },
    { slug: "pets",       name: "Pets",       accent: "#059669", soft: "#D1FAE5", font: "'Nunito', sans-serif" },
    { slug: "digital",    name: "Digital Products", accent: "#6366F1", soft: "#E0E7FF", font: "'Inter', sans-serif" },
    { slug: "courses",    name: "Courses",    accent: "#0F766E", soft: "#CCFBF1", font: "'Manrope', sans-serif" },
    { slug: "medical",    name: "Medical",    accent: "#0284C7", soft: "#E0F2FE", font: "'Inter', sans-serif" },
    { slug: "agency",     name: "Agency",     accent: "#334155", soft: "#E2E8F0", font: "'Sora', sans-serif" },
    { slug: "portfolio",  name: "Portfolio",  accent: "#0F172A", soft: "#F1F5F9", font: "'Sora', sans-serif" },
    { slug: "photography",name: "Photography",accent: "#475569", soft: "#F8FAFC", font: "'Playfair Display', serif" },
    { slug: "cars",       name: "Cars",       accent: "#DC2626", soft: "#FEE2E2", font: "'Oswald', sans-serif" },
    { slug: "bike",       name: "Bike",       accent: "#2563EB", soft: "#DBEAFE", font: "'Inter', sans-serif" },
    { slug: "flowers",    name: "Flowers",    accent: "#F43F5E", soft: "#FFE4E6", font: "'Great Vibes', cursive" },
    { slug: "homedecor",  name: "Home Decor", accent: "#B45309", soft: "#FEF3C7", font: "Georgia, serif" },
    { slug: "organic",    name: "Organic",    accent: "#65A30D", soft: "#ECFCCB", font: "'Poppins', sans-serif" },
    { slug: "kids",       name: "Kids",       accent: "#F59E0B", soft: "#FEF3C7", font: "'Baloo 2', sans-serif" },
    { slug: "luxury",     name: "Luxury",     accent: "#D4AF37", soft: "#FFF9E6", font: "'Cinzel', serif" },
    { slug: "minimal",    name: "Minimal",    accent: "#5C6EFF", soft: "#EFF1FF", font: "'Inter', sans-serif" },
  ];

  const getTheme = (slug) => THEMES.find(t => t.slug === slug) || THEMES[29];

  const fallbackStore = () => {
    const shop = Utils.store.get("dc_shop");
    if (shop && shop.name) return shop;
    return { name: "My Store", tagline: "Shop the collection", theme: "minimal" };
  };

  /* ---------- Section renderers (pure HTML strings) ---------- */
  const SECTION_RENDERERS = {
    hero (s) {
      return `
      <section class="sf-hero" style="--accent:var(--t-accent);--soft:var(--t-soft)">
        <div class="sf-hero-inner">
          <span class="sf-eyebrow">${esc(s.eyebrow || "New collection")}</span>
          <h1>${esc(s.title || "Welcome to the collection")}</h1>
          <p>${esc(s.subtitle || "Discover hand-picked products loved by thousands of happy customers.")}</p>
          <div class="sf-hero-actions">
            ${s.button ? `<button class="sf-btn">${esc(s.button)}</button>` : ""}
            ${s.secondary ? `<button class="sf-btn sf-btn-ghost">${esc(s.secondary)}</button>` : ""}
          </div>
        </div>
        ${s.image ? `<img class="sf-hero-img" src="${s.image}" alt="" loading="lazy">` : ""}
      </section>`;
    },

    products(s) {
      const items = s.products?.slice(0, s.count || 8) || [];
      return `
        <section class="sf-products">
          <div class="sf-head">
            <span class="sf-eyebrow">Shop</span>
            <h2>${esc(s.title || "Featured Products")}</h2>
          </div>
          <div class="sf-grid ${s.layout === "list" ? "sf-list" : ""}">
            ${items.map(p => `
              <article class="sf-product">
                <div class="sf-product-media">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${Utils.esc(p.name)}" loading="lazy">` : ""}</div>
                <div class="sf-product-body">
                  <h3>${Utils.esc(p.name)}</h3>
                  <span class="sf-price">${Utils.fmtMoney(p.price)}</span>
                  ${p.compare_at ? `<s class="sf-compare">${Utils.fmtMoney(p.compare_at)}</s>` : ""}
                  <button class="sf-btn sf-btn-outline sf-add" data-name="${Utils.esc(p.name)}" data-price="${p.price}">Add to cart</button>
                </div>
              </article>`).join("") || `<div style="grid-column:1/-1;text-align:center;color:var(--muted)">No products yet — add some from the dashboard.</div>`}
          </div>
        </section>`;
    },

    categories(s) {
      const cats = s.categories || ["Fashion", "Electronics", "Home", "Beauty", "Sports", "Books"];
      return `
        <section class="sf-cats" style="--t-soft:var(--t-soft)">
          <div class="sf-head"><span class="sf-eyebrow">Browse</span><h2>${esc(s.title || "Shop by Category")}</h2></div>
          <div class="sf-cat-grid">
            ${cats.map((c, i) => `
              <a class="sf-cat" style="--i:${i}">
                <span>${esc(c)}</span><small>Explore →</small>
              </a>`).join("")}
          </div>
        </section>`;
    },

    testimonials(s) {
      const ts = s.items || [
        ["Absolutely love this store, quality is top notch.", "Ayesha", "Karachi"],
        ["Fast delivery and beautiful packaging!", "Bilal", "Lahore"],
        ["My favorite place to shop online now.", "Fatima", "Islamabad"],
      ];
      return `
        <section class="sf-testi">
          <div class="sf-head"><span class="sf-eyebrow">Reviews</span><h2>${esc(s.title || "What customers say")}</h2></div>
          <div class="sf-testi-grid">
            ${ts.map(t => `
              <figure class="sf-testi-card">
                <div class="sf-stars">★★★★★</div>
                <blockquote>“${esc(t[0])}”</blockquote>
                <figcaption><b>${esc(t[1])}</b><span>${esc(t[2])}</span></figcaption>
              </figure>`).join("")}
          </div>
        </section>`;
    },

    gallery(s) {
      const imgs = s.images || Array.from({ length: 6 }, (_, i) => `https://picsum.photos/seed/c${s.id}${i}/500/500`);
      return `
        <section class="sf-gallery">
          <div class="sf-head"><span class="sf-eyebrow">Lookbook</span><h2>${esc(s.title || "Gallery")}</h2></div>
          <div class="sf-gallery-grid">
            ${imgs.map(img => `<img src="${img}" alt="" loading="lazy">`).join("")}
          </div>
        </section>`;
    },

    video(s) {
      return `
        <section class="sf-video">
          <div class="sf-video-box">
            ${s.videoUrl
              ? `<video controls muted playsinline src="${s.videoUrl}"></video>`
              : `<div class="sf-video-ph"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>`}
          </div>
        </section>`;
    },

    faq(s) {
      const items = s.items || [
        ["What is your return policy?", "We offer free returns within 14 days of delivery."],
        ["How long does shipping take?", "Standard shipping takes 3–5 working days."],
        ["Do you ship internationally?", "Yes, we ship to 60+ countries worldwide."],
      ];
      return `
        <section class="sf-faq">
          <div class="sf-head"><span class="sf-eyebrow">Help</span><h2>${esc(s.title || "Frequently asked questions")}</h2></div>
          <div class="sf-faq-list">
            ${items.map(([q, a]) => `
              <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>
            `).join("")}
          </div>
        </section>`;
    },

    newsletter(s) {
      return `
        <section class="sf-newsletter" style="background:var(--t-accent)">
          <div class="sf-newsletter-inner">
            <h2>${esc(s.title || "Join our list")}</h2>
            <p>${esc(s.subtitle || "Get 10% off your first order plus early access to drops.")}</p>
            <form class="sf-form" onsubmit="event.preventDefault();Storefront.newsletter(this)">
              <input type="email" required placeholder="you@example.com" aria-label="Email">
              <button class="sf-btn sf-btn-white">Subscribe</button>
            </form>
          </div>
        </section>`;
    },

    contact(s) {
      return `
        <section class="sf-contact">
          <div class="sf-head"><span class="sf-eyebrow">Contact</span><h2>${esc(s.title || "Get in touch")}</h2></div>
          <form class="sf-form sf-contact-form">
            <input placeholder="Your name"><input type="email" placeholder="Email">
            <textarea placeholder="Message" rows="4"></textarea>
            <button class="sf-btn">Send message</button>
          </form>
        </section>`;
    },

    billing: _nullSection,

    about: _nullSection,
  };

  function _nullSection(s) {
    return `<section class="sf-section-ph"><p>This section renders as a full store page. Section placeholder generated by DualCore.</p></section>`;
  }

  /* ---------- Render a single section ---------- */
  const renderSection = (s) => {
    const fn = SECTION_RENDERERS[s.type];
    if (!fn) return "";
    return `<div class="sf-wrap" data-type="${s.type}" data-id="${s.id}">
      ${fn(s)}
      <div class="sf-section-tools">
        <button data-act="drag" title="Drag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg></button>
        <button data-action="edit">✎</button>
        <button data-action="dup">⧉</button>
        <button data-action="hide">${s.visible ? "👁" : "👁‍🗨"}</button>
        <button data-action="del">🗑</button>
      </div>
      ${s.visible ? "" : '<div class="sf-hidden-tag">Hidden section</div>'}
    </div>`;
  };

  /* ---------- Render whole page from sections ---------- */
  const renderPage = (sections, shop = fallbackStore()) => {
    const th = getTheme(shop.theme);
    const strip = Array.isArray(sections) ? sections : (sections.sections || []);
    const vis = strip.filter(s => s.visible !== false);
    const siteName = shop.name || "My Store";

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${Utils.esc(siteName)}</title>
        <meta name="description" content="${Utils.esc(shop.tagline || "Beautiful products, fast delivery.")}">
        <style>
          ${CSS_RESET}
          ${STOREFRONT_CSS}
          ${BodyThemeCSS(th)}
        </style>
      </head>
      <body>
        <header class="sf-nav glass">
          <a class="sf-brand" href="#">${Utils.esc(siteName)}</a>
          <nav class="sf-nav-links">
            <a href="#">Home</a><a href="#">Products</a><a href="#">About</a><a href="#">Contact</a>
          </nav>
          <div class="sf-nav-actions">
            <button class="sf-cart" type="button" data-cart-toggle>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v9H4v-9M2 7h20v5H2z"/></svg>
              <span class="sf-cart-count">0</span>
            </button>
          </div>
        </header>
        <main id="sf-main" data-theme-name="${shop.theme}">
          ${vis.map(renderSection).join("")}
        </main>
        ${FOOTER_MARKUP.replaceAll("EX_SITE_NAME", Utils.esc(siteName))}
        <script>${CART_JS}<\/script>
      </body>
      </html>`;
  };

  /* ---------- Cart behaviour used in exported sites ---------- */
  const CART_JS = `
  window.__cart = JSON.parse(localStorage.getItem("dc_cart") || "[]");
  const sync = () => { localStorage.setItem("dc_cart", JSON.stringify(window.__cart));
    document.querySelectorAll(".sf-cart-count").forEach(e => e.textContent = window.__cart.length); };
  sync();
  document.addEventListener("click", e => {
    const add = e.target.closest(".sf-add");
    if (add) {
      window.__cart.push({ name: add.dataset.name, price: Number(add.dataset.price) });
      sync();
      const t = e.target.closest(".sf-product");
      if (t) { t.classList.add("added"); setTimeout(() => t.classList.remove("added"), 900); }
    }
  });
  window.Storefront = window.Storefront || {};
  Storefront.newsletter = (f) => { f.innerHTML = "🎉 Thanks for subscribing!"; };
  Storefront.cart = () => {
    const total = window.__cart.reduce((s, i) => s + i.price, 0);
    const items = window.__cart.map(i => i.name).join(", ") || "Cart is empty";
    const el = document.createElement("div"); el.className = "sf-cart-pop";
    el.innerHTML = "<b>Cart (" + window.__cart.length + ")</b><p>" + items + "</p><p><b>Total: " + total.toLocaleString() + "</b></p><button onclick='this.parentElement.remove()'>Close</button>";
    el.style.cssText = "position:fixed;z-index:99;top:80px;right:16px;background:var(--t-soft);color:var(--ink,1);padding:18px;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.2);max-width:280px;";
    document.body.appendChild(el);
  };
  try { Storefront.cart; } catch(e) {}
  `;

  /* ---------- Theme CSS variables ---------- */
  function BodyThemeCSS(sh) {
    return `
      :root {
        --t-accent: ${sh.accent};
        --t-accent-ink: #fff;
        --t-soft: ${sh.soft};
        --text: #0F172A;
        --muted: #64748B;
        --line:#E7EBF3;
        --font: ${sh.font}, sans-serif;
        --ink: #0F172A;
      }`;
  }

  /* ---------- Shared storefront CSS ---------- */
  const CSS_RESET = `*{margin:0;padding:0;box-sizing:border-box;font-family:var(--font);}`;

  const STOREFRONT_CSS = `
    :root{color-scheme:light;--radius:14px}
    body{background:#fff;color:var(--ink,#0F172A);font-family:var(--font-body,var(--font));line-height:1.6;-webkit-font-smoothing:antialiased}
    img{max-width:100%;display:block} a{color:inherit;text-decoration:none}
    .glass{background:rgba(255,255,255,.8);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}

    /* Nav */
    .sf-nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:16px 6vw;border-bottom:1px solid var(--line,#eee)}
    .sf-brand{font-weight:800;font-size:1.15rem;letter-spacing:-.02em}
    .sf-nav-links{display:flex;gap:26px;font-weight:600;font-size:.92rem}
    .sf-nav-links a:hover{opacity:.7}
    .sf-cart{position:relative;width:40px;height:40px;border-radius:50% ;display:grid;place-items:center;border:1px solid var(--line,#eee);background:transparent;cursor:pointer}
    .sf-cart svg{width:19px;height:19px}
    .sf-cart-count{position:absolute;top:-6px;right:-6px;background:#EF4444;color:#fff;font-size:.66rem;font-weight:700;border-radius:99px;min-width:18px;height:18px;display:grid;place-items:center;padding:0 4px}

    /* Hero */
    .sf-hero{min-height:78vh;display:grid;place-items:center;text-align:center;padding:60px 6vw;position:relative;overflow:hidden;background:linear-gradient(160deg,var(--t-soft),rgba(255,255,255,0) 55%)}
    .sf-hero-inner{max-width:760px}
    .sf-eyebrow{font-size:.78rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--t-accent)}
    .sf-hero h1{font-size:clamp(2.2rem,6vw,4rem);line-height:1.05;margin:16px 0 18px;letter-spacing:-.03em}
    .sf-hero p{color:var(--muted);font-size:1.1rem;max-width:520px;margin:0 auto}
    .sf-hero-actions{display:flex;gap:12px;justify-content:center;margin-top:30px;flex-wrap:wrap}
    .sf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 28px;border-radius:99px;background:var(--t-accent);color:#fff;border:none;font-weight:700;font-size:.95rem;cursor:pointer;transition:.25s;border:1px solid transparent}
    .sf-btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(0,0,0,.16)}
    .sf-btn-ghost{background:transparent;color:var(--on,#0F172A);border-color:var(--t-accent)}
    .sf-btn-ghost:hover{background:var(--t-accent);color:#fff}
    .sf-btn-outline{background:none;color:var(--t-accent);border-color:var(--t-accent);padding:9px 20px;font-size:.85rem}
    .sf-btn-outline:hover{background:var(--t-accent);color:#fff;transform:none;box-shadow:none}
    .sf-btn-white{background:#fff;color:var(--t-accent)}
    .sf-hero-img{position:absolute;right:-8vw;top:50%;transform:translateY(-50%);width:min(34vw,420px);border-radius:26px;box-shadow:0 40px 80px rgba(0,0,0,.18);opacity:.9;pointer-events:none}

    /* Section shell + head */
    .sf-wrap{position:relative}
    .sf-section,.sf-products,.sf-cats,.sf-testi,.sf-gallery,.sf-faq,.sf-contact,.sf-video{max-width:1200px;margin:0 auto;padding:70px 6vw}
    .sf-head{text-align:center;margin-bottom:44px}
    .sf-head h2{font-size:clamp(1.6rem,3.4vw,2.4rem);letter-spacing:-.02em;margin-top:8px}
    .sf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:22px}
    .sf-product{border-radius:var(--on,14px);overflow:hidden;background:#fff;border:1px solid var(--line,#eee);transition:.25s;position:relative}
    .sf-product:hover{transform:translateY(-5px);box-shadow:0 20px 44px rgba(0,0,0,.1)}
    .sf-product-media{aspect-ratio:1;background:var(--t-soft);overflow:hidden}
    .sf-product-media img{width:100%;height:100%;object-fit:cover;transition:.4s}
    .sf-product:hover .sf-product-media img{transform:scale(1.05)}
    .sf-product-body{padding:16px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
    .sf-product-body h3{font-size:1rem}
    .sf-price{font-weight:800}
    .sf-compare{color:var(--muted);font-size:.82rem}
    .sf-product.added .sf-add{background:var(--t-accent);color:#fff;border-color:var(--t-accent)}
    .sf-list{grid-template-columns:1fr}

    /* Categories */
    .sf-cat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}
    .sf-cat{display:flex;flex-direction:column;gap:6px;padding:26px 20px;border-radius:16px;background:var(--t-soft);font-weight:700;transition:.25s;justify-content:space-between;min-height:120px}
    .sf-cat small{opacity:.6;font-weight:600}
    .sf-cat:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,0,0,.08)}
    .sf-cat-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}

    /* Testimonials */
    .sf-testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
    .sf-testi-card{padding:26px;border-radius:18px;border:1px solid var(--line,#eee);background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.03)}
    .sf-stars{color:#FBBF24;letter-spacing:2px;margin-bottom:12px}
    .sf-testi-card blockquote{color:var(--ink,#0F172A);font-size:1.02rem;line-height:1.6}
    .sf-testi-card figcaption{margin-top:16px;display:flex;flex-direction:column;gap:2px}
    .sf-testi-card figcaption span{color:var(--muted);font-size:.8rem}

    /* Gallery */
    .sf-gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}
    .sf-gallery-grid img{border-radius:14px;aspect-ratio:1;object-fit:cover;transition:.3s}
    .sf-gallery-grid img:hover{transform:scale(1.03)}

    /* Video */
    .sf-video-box{border-radius:22px;overflow:hidden;aspect-ratio:16/9;background:var(--t-soft);display:grid;place-items:center}
    .sf-video-box video{width:100%;height:100%;object-fit:cover}
    .sf-video-ph svg{width:70px;height:70px;color:var(--t-accent);opacity:.6}

    /* FAQ */
    .sf-faq-list{max-width:680px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
    .sf-faq details{border:1px solid var(--line,#eee);border-radius:14px;overflow:hidden}
    details[open]{border-color:var(--t-accent)}
    .sf-faq summary{padding:18px 20px;font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center}
    .sf-faq summary::after{content:"+";font-size:1.2rem;color:var(--t-accent)}
    details[open] summary::after{transform:rotate(45deg)}
    .sf-faq p{padding:0 20px 18px;color:var(--muted)}

    /* Newsletter */
    .sf-newsletter{padding:70px 6vw}
    .sf-newsletter-inner{max-width:620px;margin:0 auto;text-align:center;color:#fff}
    .sf-newsletter h2{color:#fff;font-size:clamp(1.6rem,3vw,2.2rem)}
    .sf-newsletter p{opacity:.85;margin:12px 0 26px;font-size:.86rem;color:inherit}
    .sf-form{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
    .sf-form input,.sf-form textarea{border:none;border-radius:99px;padding:15px 20px;width:min(320px,100%);font-size:.95rem;outline:none}
    .sf-form textarea{border-radius:16px;min-height:100px;width:100%;resize:vertical}
    .sf-contact-form{max-width:460px;margin:0 auto;flex-direction:column;align-items:stretch;gap:12px;flex-wrap:nowrap}
    .sf-contact-form input,.sf-contact-form textarea{border:1.5px solid var(--line,#E7EBF3);background:#fff;color:var(--ink,#0F172A);border-radius:12px}

    /* Footer */
    .sf-footer{margin-top:60px;background:var(--t-soft);padding:54px 6vw 26px;color:var(--t,#0F172A)}
    .sf-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:30px;margin-bottom:34px}
    .sf-footer h4{margin-bottom:14px;font-size:.95rem}
    .sf-footer a{display:block;color:var(--muted);margin-bottom:9px;font-size:.9rem}
    .sf-footer-bottom{border-top:1px solid rgba(0,0,0,.08);padding-top:20px;display:flex;justify-content:space-between;color:var(--muted);font-size:.82rem;flex-wrap:wrap;gap:10px}
    .sf-section-ph{text-align:center;padding:60px;color:var(--muted);border:1px dashed var(--line)}

    /* section tools (only in builder) */
    .sf-section-tools{display:none;position:absolute;top:10px;right:10px;z-index:20;gap:6px;background:rgba(15,23,42,.85);backdrop-filter:blur(10px);border-radius:10px;padding:6px;box-shadow:0 8px 20px rgba(0,0,0,.25)}
    .sf-section-tools button{width:30px;height:30px;border-radius:8px;color:#fff;display:grid;place-items:center;font-size:.9rem;cursor:pointer;background:transparent;border:none}
    .sf-section-tools button:hover{background:rgba(255,255,255,.15)}
    @media(max-width:768px){
      .sf-nav-links{display:none}
      .sf-nav{padding:14px 20px}
      .sf-section{padding:48px 20px}
      .sf-hero{min-height:65vh}
      .sf-footer-grid{grid-template-columns:1fr 1fr}
    }
    @media(max-width:480px){.sf-footer-grid{grid-template-columns:1fr}}
  `;

  const FOOTER_MARKUP = `
    <footer class="sf-footer">
      <div class="sf-footer-grid">
        <div>
          <h4>EX_SITE_NAME</h4>
          <p style="color:var(--muted);font-size:.9rem">Beautiful products, delivered fast. Built with DualCore.</p>
        </div>
        <div><h4>Shop</h4><a href="#">New Arrivals</a><a href="#">Best Sellers</a><a href="#">Sale</a></div>
        <div><h4>Company</h4><a href="#">About</a><a href="#">Contact</a><a href="#">Blog</a></div>
        <div><h4>Help</h4><a href="#">Shipping</a><a href="#">Returns</a><a href="#">Privacy</a></div>
      </div>
      <div class="sf-footer-bottom">
        <span>© 2026 EX_SITE_NAME — Powered by DualCore</span>
        <span>Payment: cards · wallets · COD</span>
      </div>
    </footer>`;

  /* ---------- newsletter() used inside exported pages ---------- */
  return {
    THEMES, getTheme, renderSection, renderPage,
    __css: (themeSlug) => BodyThemeCSS(getTheme(themeSlug)) + "\n" + STOREFRONT_CSS,
  };
})();

window.Storefront = Storefront;