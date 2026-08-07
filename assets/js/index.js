/* ============================================================
   DualCore — index.js  (landing page behaviours)
   ============================================================ */

(() => {
  const $ = Utils.$;
  const $$ = Utils.$$;

  /* ---------- Typing effect ---------- */
  const slot = $("#typedSlot");
  if (slot) {
    const words = ["the world 🌍", "your customers 💛", "anywhere, anytime ⚡", "at 100x speed 🚀"];
    Utils.typeText(slot, words);
  }

  /* ---------- Counters ---------- */
  const counters = $$("[data-count]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const raw = el.dataset.count;
      const target = parseFloat(raw);
      const decimals = raw.includes(".") ? 1 : 0;
      const suffix = el.textContent.replace(/[\d.,kK+★]+/g, "").trim();
      Utils.animateCount(el, target, { suffix, decimals });
      io.unobserve(el);
    });
  }, { threshold: .4 });
  counters.forEach(el => io.observe(el));

  /* ---------- Landing pricing ---------- */
  const dataEl = $("#landingPricingData");
  const target = $("#landingPricing");
  if (dataEl && target) {
    const plans = JSON.parse(dataEl.textContent);
    target.innerHTML = plans.map((p, i) => `
      <div class="card plan-card ${p.pop ? "plan-popular" : ""} ${i > 0 ? "reveal" : ""}" data-delay="${i}">
        ${p.pop ? `<span class="plan-label">${p.pop.toUpperCase()}</span>` : ""}
        <div class="plan-name">${p.name}</div>
        <div class="plan-price">${p.price}<small>${p.period}</small></div>
        <p class="plan-desc">${p.desc}</p>
        <ul class="plan-feats">
          ${p.feats.map(([t, ok]) => `
            <li class="${ok ? "" : "dim"}">
              ${ok
                ? '<svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>'
                : '<svg class="cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>'}
              ${t}
            </li>`).join("")}
        </ul>
        <a href="${p.url}" class="btn ${i === 1 ? "btn-primary" : i === 2 ? "btn-outline" : "btn-ghost"}">${p.cta}</a>
      </div>`).join("");
    Utils.initReveal();
  }

  /* ---------- FAQ ---------- */
  const faq = $("#faqList");
  if (faq) {
    faq.querySelectorAll(".faq-q").forEach(q => {
      q.addEventListener("click", () => q.closest(".faq-item").classList.toggle("open"));
    });
  }

  /* ---------- Newsletter ---------- */
  const form = $("#newsletterForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    toast("success", "Subscribed! Check your inbox for builder tips.");
    input.value = "";
  });

  /* ---------- Scroll progress ---------- */
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  window.addEventListener("scroll", Utils.throttle(() => {
    const h = document.documentElement;
    bar.style.width = ((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100) + "%";
  }, 80), { passive: true });

  /* ---------- CTA buttons deep-linking to builder demo ---------- */
  $$("[data-action]").forEach(el => {
    el.addEventListener("click", () => {
      const a = el.dataset.action;
      const urls = {
        builder: "builder.html", templates: "templates.html", products: "products.html",
        domains: "domains.html", payments: "pricing.html", analytics: "features.html",
      };
      if (urls[a]) location.href = urls[a];
      else if (a.startsWith("template-")) location.href = "templates.html?theme=" + a.replace("template-", "");
    });
  });

  /* ---------- Reveal on load ---------- */
  Utils.initReveal();
})();