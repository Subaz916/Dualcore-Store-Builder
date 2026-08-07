/* ============================================================
   DualCore — navbar.js  (sticky header + mobile menu + theme)
   ============================================================ */

(() => {
  const ACTIVE = { "/index.html": "home", "/index": "home", "/": "home",
    "/features.html": "features", "/pricing.html": "pricing", "/about.html": "about", "/contact.html": "contact" };
  const cur = ACTIVE[location.pathname] || "home";

  const nav = `
    <header class="site-header header" id="siteHeader">
      <div class="container nav-inner">
        <a href="index.html" class="logo" aria-label="DualCore home">
          <span class="logo-mark">${window.LOGO_SVG || ""}</span>
          <span>DualCore</span>
        </a>

        <nav class="nav-links" id="navLinks" aria-label="Main navigation">
          <a href="index.html" class="${cur === "home" ? "active" : ""}">Home</a>
          <a href="features.html" class="${cur === "features" ? "active" : ""}">Features</a>
          <a href="templates.html" class="${cur === "templates" ? "active" : ""}">Templates</a>
          <a href="pricing.html" class="${cur === "pricing" ? "active" : ""}">Pricing</a>
          <a href="about.html" class="${cur === "about" ? "active" : ""}">About</a>
          <a href="contact.html" class="${cur === "contact" ? "active" : ""}">Contact</a>
        </nav>

        <div class="nav-cta">
          <button class="btn-icon" id="themeToggle" aria-label="Toggle dark mode" title="Toggle theme">
            <svg id="themeMoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
            <svg id="themeSun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:20px;height:20px;display:none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          </button>
          <a href="login.html" class="btn btn-ghost btn-sm btn-cta">Log in</a>
          <a href="signup.html" class="btn btn-primary btn-sm btn-cta">Start free</a>
          <button class="burger" id="burger" aria-label="Toggle menu"><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>`;

  if (!document.querySelector(".site-header")) {
    document.body.insertAdjacentHTML("afterbegin", nav);
    bind();
  }

  function bind() {
    const header = Utils.$("#siteHeader");
    if (header) {
      const onScroll = Utils.throttle(() => header.classList.toggle("scrolled", window.scrollY > 8), 120);
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    const burger = Utils.$("#burger");
    const links = Utils.$("#navLinks");
    burger?.addEventListener("click", () => {
      burger.classList.toggle("open");
      links?.classList.toggle("open");
    });
    links?.addEventListener("click", (e) => {
      if (e.target.tagName === "A") { burger?.classList.remove("open"); links.classList.remove("open"); }
    });

    Utils.$("#themeToggle")?.addEventListener("click", () => {
      const dark = document.documentElement.dataset.theme !== "dark";
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      Utils.store.set("dc_theme", dark ? "dark" : "light");
      if (window.applyTheme) window.applyTheme();
    });
    if (window.applyTheme) window.applyTheme();
  }
})();