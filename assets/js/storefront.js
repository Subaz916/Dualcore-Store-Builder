/* ============================================================
   DualCore — storefront.js
   Pure JS engine that renders store sections into HTML.
   Used by: builder preview, store.html storefronts, generator.
   ============================================================ */

const Storefront = (() => {
  const { esc } = Utils;

  /* ---------------- Single theme ----------------
     DualCore ships ONE clean default theme. Every store customizes its
     own look with colors, fonts, radius and button style from the
     builder — no theme switching. */
  const DEFAULT_THEME = {
    slug: "dualcore",
    name: "DualCore",
    accent: "#5C6EFF",
    soft: "#EFF1FF",
    font: "'Inter', sans-serif",
  };
  const THEMES = [DEFAULT_THEME];
  const getTheme = () => DEFAULT_THEME;

  /* Lighten a hex color toward white. */
  const lighten = (hex, amount = 0.88) => {
    const h = String(hex || "#5C6EFF").replace("#", "");
    const n = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
    const num = parseInt(n, 16);
    if (isNaN(num)) return "#EFF1FF";
    const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return "#" + mix(r).toString(16).padStart(2, "0") + mix(g).toString(16).padStart(2, "0") + mix(b).toString(16).padStart(2, "0");
  };
  const resolveTheme = (shop = {}) => {
    const accent = shop.theme_color || DEFAULT_THEME.accent;
    return {
      accent,
      soft: shop.theme_soft || lighten(accent),
      font: shop.theme_font || DEFAULT_THEME.font,
      radius: shop.theme_radius || "16",
      buttonStyle: shop.theme_button_style || "rounded",
    };
  };

  const fallbackStore = () => {
    const shop = Utils.store.get("dc_shop");
    if (shop && shop.name) return shop;
    return { name: "My Store", tagline: "Shop the collection", theme: "minimal" };
  };

  /* ---------- Section renderers (pure HTML strings) ---------- */
  /* ---- Section style helper ---- */
  function getSectionStyle(s) {
    const st = s.style || {};
    let css = "";
    const padMap = { none: "0", sm: "32px", md: "64px", lg: "96px", xl: "128px" };
    if (st.paddingTop) css += `padding-top:${padMap[st.paddingTop] || st.paddingTop};`;
    if (st.paddingBottom) css += `padding-bottom:${padMap[st.paddingBottom] || st.paddingBottom};`;
    if (st.background) {
      const bgMap = {
        transparent: "transparent",
        white: "#fff",
        soft: "var(--t-soft)",
        accent: "var(--t-accent)",
        dark: "#0F172A"
      };
      css += `background:${bgMap[st.background] || st.background};`;
    }
    if (st.bgColor && st.background === "custom") css += `background:${st.bgColor};`;
    if (st.textColor) {
      const tcMap = { default: "var(--ink,#0F172A)", light: "#fff", muted: "var(--muted,#64748B)" };
      css += `color:${tcMap[st.textColor] || st.textColor};`;
    }
    if (st.fullWidth) css += `max-width:none;padding-left:0;padding-right:0;`;
    if (st.divider) css += `border-bottom:1px solid var(--line,#E7EBF3);`;
    return css;
  }

  const SECTION_RENDERERS = {
    hero (s) {
      const style = getSectionStyle(s);
      const bgImage = s.image ? `background-image:${s.image.includes("url(") ? s.image : `url("${s.image}")`};background-size:cover;background-position:center;` : "";
      return `
      <section class="sf-hero ${s.image ? "has-img" : ""}" style="${style}${bgImage}">
        ${s.image ? `<img class="sf-hero-img" src="${s.image}" alt="" loading="lazy">` : ""}
        <div class="sf-hero-inner">
          <span class="sf-eyebrow">${esc(s.eyebrow || "New collection")}</span>
          <h1>${esc(s.title || "Welcome to the collection")}</h1>
          <p>${esc(s.subtitle || "Discover hand-picked products loved by thousands of happy customers.")}</p>
          <div class="sf-hero-actions">
            ${s.button ? `<button class="sf-btn">${esc(s.button)}</button>` : ""}
            ${s.secondary ? `<button class="sf-btn sf-btn-ghost">${esc(s.secondary)}</button>` : ""}
          </div>
        </div>
      </section>`;
    },

    products(s) {
      const style = getSectionStyle(s);
      const items = s.products?.slice(0, s.count || 8) || [];
      return `
        <section class="sf-products" style="${style}">
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
                  <div class="sf-price-row">
                    <span class="sf-price">${Utils.fmtMoney(p.price)}</span>
                    ${p.compare_at ? `<s class="sf-compare">${Utils.fmtMoney(p.compare_at)}</s>` : ""}
                  </div>
                  <button class="sf-btn sf-btn-outline sf-add" data-name="${Utils.esc(p.name)}" data-price="${p.price}">Add to cart</button>
                </div>
              </article>`).join("") || `<div style="grid-column:1/-1;text-align:center;color:var(--muted)">No products yet — add some from the dashboard.</div>`}
          </div>
        </section>`;
    },

    categories(s) {
      const style = getSectionStyle(s);
      const cats = s.categories || ["Fashion", "Electronics", "Home", "Beauty", "Sports", "Books"];
      return `
        <section class="sf-cats" style="${style}--t-soft:var(--t-soft)">
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
      const style = getSectionStyle(s);
      const ts = s.items || [
        ["Absolutely love this store, quality is top notch.", "Ayesha", "Karachi"],
        ["Fast delivery and beautiful packaging!", "Bilal", "Lahore"],
        ["My favorite place to shop online now.", "Fatima", "Islamabad"],
      ];
      return `
        <section class="sf-testi" style="${style}">
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
      const style = getSectionStyle(s);
      const imgs = s.images || Array.from({ length: 6 }, (_, i) => `https://picsum.photos/seed/c${s.id}${i}/500/500`);
      return `
        <section class="sf-gallery" style="${style}">
          <div class="sf-head"><span class="sf-eyebrow">Lookbook</span><h2>${esc(s.title || "Gallery")}</h2></div>
          <div class="sf-gallery-grid">
            ${imgs.map(img => `<img src="${img}" alt="" loading="lazy">`).join("")}
          </div>
        </section>`;
    },

    video(s) {
      const style = getSectionStyle(s);
      return `
        <section class="sf-video" style="${style}">
          <div class="sf-video-box">
            ${s.videoUrl
              ? `<video controls muted playsinline src="${s.videoUrl}"></video>`
              : `<div class="sf-video-ph"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>`}
          </div>
        </section>`;
    },

    faq(s) {
      const style = getSectionStyle(s);
      const items = s.items || [
        ["What is your return policy?", "We offer free returns within 14 days of delivery."],
        ["How long does shipping take?", "Standard shipping takes 3–5 working days."],
        ["Do you ship internationally?", "Yes, we ship to 60+ countries worldwide."],
      ];
      return `
        <section class="sf-faq" style="${style}">
          <div class="sf-head"><span class="sf-eyebrow">Help</span><h2>${esc(s.title || "Frequently asked questions")}</h2></div>
          <div class="sf-faq-list">
            ${items.map(([q, a]) => `
              <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>
            `).join("")}
          </div>
        </section>`;
    },

    newsletter(s) {
      const style = getSectionStyle(s);
      return `
        <section class="sf-newsletter" style="${style}background:var(--t-accent)">
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
      const style = getSectionStyle(s);
      return `
        <section class="sf-contact" style="${style}">
          <div class="sf-head"><span class="sf-eyebrow">Contact</span><h2>${esc(s.title || "Get in touch")}</h2></div>
          <form class="sf-form sf-contact-form">
            <input placeholder="Your name"><input type="email" placeholder="Email">
            <textarea placeholder="Message" rows="4"></textarea>
            <button class="sf-btn">Send message</button>
          </form>
        </section>`;
    },

    footer(s) {
      const style = getSectionStyle(s);
      return `
        <section class="sf-footer-section" style="${style}">
          <div class="sf-footer-grid">
            <div>
              <h4>${esc(s.title || "Store")}</h4>
              <p style="color:var(--muted);font-size:.9rem">${esc(s.description || "Beautiful products, delivered fast. Built with DualCore.")}</p>
            </div>
            <div><h4>Shop</h4><a href="#">New Arrivals</a><a href="#">Best Sellers</a><a href="#">Sale</a></div>
            <div><h4>Company</h4><a href="#">About</a><a href="#">Contact</a><a href="#">Blog</a></div>
            <div><h4>Help</h4><a href="#">Shipping</a><a href="#">Returns</a><a href="#">Privacy</a></div>
          </div>
          <div class="sf-footer-bottom">
            <span>© 2026 ${esc(s.title || "Store")} — Powered by DualCore</span>
            <span>Payment: cards · wallets · COD</span>
          </div>
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
    const th = resolveTheme(shop);
    const strip = Array.isArray(sections) ? sections : (sections.sections || []);
    const vis = strip.filter(s => s.visible !== false);
    const siteName = shop.name || "My Store";
    const seoTitle = shop.seo_title || `${siteName} | ${shop.tagline || "Shop the collection"}`;
    const seoDescription = shop.seo_description || shop.tagline || "Beautiful products, fast delivery.";
    const ogImage = shop.social_image || "";

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${Utils.esc(seoTitle)}</title>
        <meta name="description" content="${Utils.esc(seoDescription)}">
        <meta property="og:title" content="${Utils.esc(seoTitle)}">
        <meta property="og:description" content="${Utils.esc(seoDescription)}">
        <meta property="og:type" content="website">
        ${ogImage ? `<meta property="og:image" content="${Utils.esc(ogImage)}">` : ""}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${Utils.esc(seoTitle)}">
        <meta name="twitter:description" content="${Utils.esc(seoDescription)}">
        ${ogImage ? `<meta name="twitter:image" content="${Utils.esc(ogImage)}">` : ""}
        ${shop.favicon ? `<link rel="icon" href="${Utils.esc(shop.favicon)}">` : `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235C6EFF' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='M13 2 3 14h7l-1 8 10-12h-7l1-8z'/></svg>")}">`}
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
        <main id="sf-main">
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
  function BodyThemeCSS(th) {
    const btnRadius = th.buttonStyle === "sharp" ? "4px" : th.buttonStyle === "pill" ? "999px" : "var(--t-radius)";
    return `
      :root {
        --t-accent: ${th.accent};
        --t-accent-ink: #fff;
        --t-soft: ${th.soft};
        --t-radius: ${th.radius}px;
        --btn-radius: ${btnRadius};
        --text: #0F172A;
        --muted: #64748B;
        --line: #E7EBF3;
        --font: ${th.font}, sans-serif;
        --ink: #0F172A;
      }`;
  }

  const cssForShop = (shop = {}) => BodyThemeCSS(resolveTheme(shop)) + "\n" + STOREFRONT_CSS;

  /* ---------- Shared storefront CSS ---------- */
  const CSS_RESET = `*{margin:0;padding:0;box-sizing:border-box;font-family:var(--font);}`;

  const STOREFRONT_CSS = `
    :root{color-scheme:light}
    html{scroll-behavior:smooth}
    body{background:#fff;color:var(--ink,#0F172A);font-family:var(--font-body,var(--font));line-height:1.65;-webkit-font-smoothing:antialiased}
    img{max-width:100%;display:block} a{color:inherit;text-decoration:none}
    .glass{background:rgba(255,255,255,.82);backdrop-filter:saturate(180%) blur(18px);-webkit-backdrop-filter:saturate(180%) blur(18px)}

    /* ============ NAV ============ */
    .sf-nav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:14px 6vw;border-bottom:1px solid rgba(0,0,0,.06)}
    .sf-brand{font-weight:800;font-size:1.18rem;letter-spacing:-.02em;display:flex;align-items:center;gap:9px}
    .sf-brand::before{content:"";width:26px;height:26px;border-radius:9px;background:linear-gradient(135deg,var(--t-accent),var(--t-accent)66);display:inline-block;box-shadow:0 6px 14px -4px var(--t-accent)}
    .sf-nav-links{display:flex;gap:28px;font-weight:600;font-size:.92rem;color:var(--muted)}
    .sf-nav-links a{position:relative;padding:6px 0;transition:color .2s}
    .sf-nav-links a:hover{color:var(--ink,#0F172A)}
    .sf-nav-links a::after{content:"";position:absolute;left:0;bottom:0;width:0;height:2px;border-radius:2px;background:var(--t-accent);transition:width .25s}
    .sf-nav-links a:hover::after{width:100%}
    .sf-cart{position:relative;width:42px;height:42px;border-radius:13px;display:grid;place-items:center;border:1px solid var(--line,#E7EBF3);background:#fff;cursor:pointer;transition:.2s}
    .sf-cart:hover{box-shadow:0 8px 20px -6px rgba(0,0,0,.15)}
    .sf-cart svg{width:19px;height:19px}
    .sf-cart-count{position:absolute;top:-6px;right:-6px;background:var(--t-accent);color:#fff;font-size:.66rem;font-weight:800;border-radius:99px;min-width:18px;height:18px;display:grid;place-items:center;padding:0 4px;box-shadow:0 2px 6px rgba(0,0,0,.2)}

    /* ============ HERO ============ */
    .sf-hero{position:relative;min-height:82vh;display:grid;align-items:center;padding:70px 6vw;overflow:hidden;background:linear-gradient(150deg,var(--t-soft) 0%,rgba(255,255,255,0) 58%,var(--t-soft) 140%)}
    .sf-hero.has-img::before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,rgba(255,255,255,.97) 30%,rgba(255,255,255,.55) 60%,rgba(255,255,255,.08) 100%)}
    .sf-hero-img{position:absolute;right:0;top:0;bottom:0;width:min(52vw,720px);object-fit:cover;pointer-events:none}
    .sf-hero-after{position:absolute;right:6vw;top:50%;transform:translateY(-50%);width:min(38vw,480px);height:min(40vw,520px);pointer-events:none;background:radial-gradient(60% 60% at 40% 40%,var(--t-accent)55,transparent 70%);filter:blur(4px)}
    .sf-hero-inner{position:relative;z-index:2;max-width:720px}
    .sf-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.76rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--t-accent)}
    .sf-eyebrow::before{content:"";width:22px;height:2px;border-radius:2px;background:var(--t-accent)}
    .sf-hero h1{font-size:clamp(2.4rem,6.5vw,4.3rem);line-height:1.06;margin:22px 0 20px;letter-spacing:-.035em;font-weight:800}
    .sf-hero p{color:var(--muted);font-size:clamp(1rem,1.6vw,1.18rem);max-width:540px}
    .sf-hero-actions{display:flex;gap:12px;margin-top:34px;flex-wrap:wrap}
    .sf-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 30px;border-radius:var(--btn-radius,99px);background:var(--t-accent);color:#fff;border:none;font-weight:700;font-size:.95rem;cursor:pointer;transition:all .22s;border:1px solid transparent;box-shadow:0 10px 24px -8px var(--t-accent)}
    .sf-btn:hover{transform:translateY(-2px);box-shadow:0 16px 34px -8px var(--t-accent);filter:brightness(1.05)}
    .sf-btn-ghost{background:transparent;color:var(--ink,#0F172A);border-color:var(--line,#E7EBF3);box-shadow:none}
    .sf-btn-ghost:hover{background:#fff;border-color:var(--t-accent);color:var(--t-accent)}
    .sf-btn-outline{background:#fff;color:var(--t-accent);border-color:var(--t-accent);padding:10px 22px;font-size:.86rem;box-shadow:none;border-radius:12px}
    .sf-btn-outline:hover{background:var(--t-accent);color:#fff;transform:none}
    .sf-btn-sm{padding:9px 18px;font-size:.84rem}
    .sf-btn-white{background:#fff;color:var(--t-accent)}

    /* ============ SECTION SHELL ============ */
    .sf-wrap{position:relative}
    .sf-section,.sf-products,.sf-cats,.sf-testi,.sf-gallery,.sf-faq,.sf-contact,.sf-video{max-width:1200px;margin:0 auto;padding:88px 6vw}
    .sf-head{text-align:center;margin-bottom:52px}
    .sf-head h2{font-size:clamp(1.7rem,3.6vw,2.5rem);letter-spacing:-.025em;font-weight:800;margin-top:10px}
    .sf-head p{color:var(--muted);max-width:520px;margin:10px auto 0;font-size:.98rem}

    /* ============ PRODUCTS ============ */
    .sf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:22px}
    .sf-product{border-radius:18px;overflow:hidden;background:#fff;border:1px solid var(--line,#E7EBF3);transition:transform .25s,box-shadow .25s;position:relative;display:flex;flex-direction:column}
    .sf-product:hover{transform:translateY(-6px);box-shadow:0 24px 48px -18px rgba(15,23,42,.18)}
    .sf-product-media{aspect-ratio:1/1;background:var(--t-soft);overflow:hidden;position:relative}
    .sf-product-media img{width:100%;height:100%;object-fit:cover;transition:transform .45s}
    .sf-product:hover .sf-product-media img{transform:scale(1.06)}
    .sf-product-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.12));opacity:0;transition:.3s}
    .sf-product:hover .sf-product-media::after{opacity:1}
    .sf-product-body{padding:18px;display:flex;flex-direction:column;gap:7px;align-items:flex-start;flex:1}
    .sf-product-body h3{font-size:1rem;font-weight:700}
    .sf-price-row{display:flex;align-items:baseline;gap:8px}
    .sf-price{font-weight:800;color:var(--t-accent);font-size:1.05rem}
    .sf-compare{color:var(--muted,#64748B);font-size:.82rem}
    .sf-product .sf-btn-outline{margin-top:auto;width:100%}
    .sf-product.added .sf-btn-outline{background:var(--t-accent);color:#fff;border-color:var(--t-accent)}
    .sf-list{grid-template-columns:1fr}

    /* ============ CATEGORIES ============ */
    .sf-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:18px}
    .sf-cat{display:flex;flex-direction:column;gap:8px;padding:30px 24px;border-radius:18px;background:var(--t-soft);font-weight:800;font-size:1.02rem;transition:.25s;position:relative;overflow:hidden;min-height:130px;justify-content:space-between}
    .sf-cat::after{content:"";position:absolute;right:-30px;top:-30px;width:90px;height:90px;border-radius:50%;background:var(--t-accent);opacity:.12;transition:.35s}
    .sf-cat small{opacity:.65;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:.25s}
    .sf-cat:hover{transform:translateY(-5px);box-shadow:0 20px 38px -16px var(--t-accent)}
    .sf-cat:hover::after{transform:scale(2.2);opacity:.2}
    .sf-cat:hover small{color:var(--t-accent)}

    /* ============ TESTIMONIALS ============ */
    .sf-testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(285px,1fr));gap:20px}
    .sf-testi-card{padding:28px;border-radius:20px;border:1px solid var(--line,#E7EBF3);background:#fff;box-shadow:0 10px 30px -18px rgba(15,23,42,.12);transition:.25s}
    .sf-testi-card:hover{transform:translateY(-4px);box-shadow:0 24px 44px -20px rgba(15,23,42,.2)}
    .sf-stars{color:#FBBF24;letter-spacing:3px;margin-bottom:14px;font-size:.9rem}
    .sf-testi-card blockquote{color:var(--ink,#0F172A);font-size:1.02rem;line-height:1.65}
    .sf-testi-card figcaption{margin-top:18px;display:flex;align-items:center;gap:12px}
    .sf-testi-card figcaption::before{content:"";width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--t-accent),var(--t-accent)cc);flex-shrink:0}
    .sf-testi-card figcaption b{display:block;font-size:.94rem}
    .sf-testi-card figcaption span{color:var(--muted);font-size:.8rem}

    /* ============ GALLERY ============ */
    .sf-gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
    .sf-gallery-grid img{border-radius:16px;aspect-ratio:1;object-fit:cover;transition:.3s;box-shadow:0 8px 24px -14px rgba(0,0,0,.25)}
    .sf-gallery-grid img:hover{transform:translateY(-4px);box-shadow:0 18px 36px -16px rgba(0,0,0,.3)}

    /* ============ VIDEO ============ */
    .sf-video-box{border-radius:24px;overflow:hidden;aspect-ratio:16/9;background:var(--t-soft);display:grid;place-items:center;box-shadow:0 30px 60px -30px rgba(15,23,42,.35)}
    .sf-video-box video{width:100%;height:100%;object-fit:cover}
    .sf-video-ph svg{width:70px;height:70px;color:var(--t-accent);opacity:.7}

    /* ============ FAQ ============ */
    .sf-faq-list{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
    .sf-faq details{border:1px solid var(--line,#E7EBF3);border-radius:16px;overflow:hidden;background:#fff;transition:.2s}
    .sf-faq details[open]{border-color:var(--t-accent);box-shadow:0 12px 30px -18px var(--t-accent)}
    .sf-faq summary{padding:20px 22px;font-weight:700;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:14px}
    .sf-faq summary::-webkit-details-marker{display:none}
    .sf-faq summary::after{content:"+";font-size:1.3rem;color:var(--t-accent);transition:transform .25s;flex-shrink:0}
    .sf-faq details[open] summary::after{transform:rotate(45deg)}
    .sf-faq p{padding:0 22px 20px;color:var(--muted)}

    /* ============ NEWSLETTER ============ */
    .sf-newsletter{padding:0}
    .sf-newsletter-inner{max-width:900px;margin:0 auto;border-radius:28px;background:linear-gradient(135deg,var(--t-accent),var(--t-accent) 55%,var(--t-accent));padding:clamp(44px,6vw,72px) 6vw;text-align:center;box-shadow:0 34px 70px -30px var(--t-accent);position:relative;overflow:hidden}
    .sf-newsletter-inner::before{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.13)}
    .sf-newsletter-inner::after{content:"";position:absolute;left:-40px;bottom:-70px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.1)}
    .sf-newsletter h2{color:#fff;font-size:clamp(1.7rem,3.4vw,2.4rem);letter-spacing:-.02em;position:relative;z-index:1}
    .sf-newsletter p{opacity:.9;margin:14px auto 30px;font-size:1rem;color:#fff;max-width:520px;position:relative;z-index:1}
    .sf-form{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1}
    .sf-form input,.sf-form textarea{border:none;border-radius:99px;padding:15px 22px;width:min(320px,100%);font-size:.95rem;outline:none;font-family:inherit}
    .sf-form input:focus{box-shadow:0 0 0 3px rgba(255,255,255,.35)}
    .sf-form textarea{border-radius:16px;min-height:100px;width:100%;resize:vertical}
    .sf-contact-form{max-width:480px;margin:0 auto;flex-direction:column;align-items:stretch;gap:12px;flex-wrap:nowrap}
    .sf-contact-form input,.sf-contact-form textarea{border:1.5px solid var(--line,#E7EBF3);background:var(--t-soft);color:var(--ink,#0F172A);border-radius:14px}
    .sf-contact-form input:focus,.sf-contact-form textarea:focus{box-shadow:0 0 0 3px var(--t-accent)33;border-color:var(--t-accent)}
    .sf-contact-form .sf-btn{align-self:flex-start;border-radius:12px}

    /* ============ FOOTER (site) ============ */
    .sf-footer{margin-top:96px;background:#0F172A;color:#CBD5E1;padding:64px 6vw 28px}
    .sf-footer h4{color:#F8FAFC;margin-bottom:16px;font-size:.95rem;letter-spacing:.04em}
    .sf-footer a{display:block;color:#94A3B8;margin-bottom:10px;font-size:.9rem;transition:.2s}
    .sf-footer a:hover{color:var(--t-accent)}
    .sf-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:34px;margin-bottom:42px}
    .sf-footer-bottom{border-top:1px solid rgba(255,255,255,.09);padding-top:22px;display:flex;justify-content:space-between;color:#64748B;font-size:.82rem;flex-wrap:wrap;gap:10px}

    /* ============ FOOTER SECTION (builder) ============ */
    .sf-footer-section{background:#0F172A;color:#CBD5E1;margin-top:0}
    .sf-footer-section .sf-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:34px;margin-bottom:38px;max-width:1200px;margin-left:auto;margin-right:auto;padding:0 6vw}
    .sf-footer-section h4{color:#F8FAFC;margin-bottom:16px;font-size:.95rem}
    .sf-footer-section a{display:block;color:#94A3B8;margin-bottom:10px;font-size:.9rem;transition:.2s}
    .sf-footer-section a:hover{color:var(--t-accent)}
    .sf-footer-section .sf-footer-bottom{border-top:1px solid rgba(255,255,255,.09);padding:22px 6vw 0;display:flex;justify-content:space-between;color:#64748B;font-size:.82rem;flex-wrap:wrap;gap:10px;max-width:1200px;margin-left:auto;margin-right:auto}

    /* ============ BUILDER SECTION TOOLS ============ */
    .sf-section-tools{display:none;position:absolute;top:10px;right:10px;z-index:20;gap:6px;background:rgba(15,23,42,.9);backdrop-filter:blur(10px);border-radius:10px;padding:6px;box-shadow:0 8px 20px rgba(0,0,0,.3)}
    .sf-section-tools button{width:30px;height:30px;border-radius:8px;color:#fff;display:grid;place-items:center;font-size:.9rem;cursor:pointer;background:transparent;border:none}
    .sf-section-tools button:hover{background:rgba(255,255,255,.18)}
    .sf-hidden-tag{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.65);color:#fff;font-size:.68rem;font-weight:700;letter-spacing:.06em;padding:5px 14px;border-radius:99px;z-index:10}
    .sf-section-ph{text-align:center;padding:60px;color:var(--muted);border:1px dashed var(--line)}

    /* ============ RESPONSIVE ============ */
    @media(max-width:860px){
      .sf-nav-links{display:none}
      .sf-nav{padding:14px 20px}
      .sf-section,.sf-products,.sf-cats,.sf-testi,.sf-gallery,.sf-faq,.sf-contact,.sf-video{padding:64px 20px}
      .sf-hero{min-height:0;padding:70px 20px 90px;text-align:left}
      .sf-hero-inner{padding:0}
      .sf-hero-img{position:relative;width:100%;height:auto;margin-top:34px;border-radius:20px;box-shadow:0 24px 50px -20px rgba(0,0,0,.25)}
      .sf-hero::before{background:linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,255,255,.75))}
      .sf-footer-grid,.sf-footer-section .sf-footer-grid{grid-template-columns:1fr 1fr}
      .sf-testi-grid{grid-template-columns:1fr}
    }
    @media(max-width:480px){
      .sf-footer-grid,.sf-footer-section .sf-footer-grid{grid-template-columns:1fr}
      .sf-grid{grid-template-columns:repeat(2,1fr);gap:12px}
      .sf-product-body{padding:12px}
      .sf-hero-actions .sf-btn{flex:1;justify-content:center}
    }
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
    THEMES, getTheme, resolveTheme, cssForShop, renderSection, renderPage,
    __css: (themeSlug) => BodyThemeCSS(resolveTheme({ theme_color: THEMES[0]?.accent })) + "\n" + STOREFRONT_CSS,
  };
})();

window.Storefront = Storefront;