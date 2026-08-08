/* ============================================================
   DualCore — publish.js
   Generates the full multi-page storefront and really hosts it:

     1. build   → StoreGenerator creates every page (HTML/CSS/JS)
     2. upload  → every file to the public bucket at
                  storefronts/<user_id>/<slug>/<path>
     3. verify  → probes candidate live URLs (custom domain,
                  direct storage URL, platform edge URL) and keeps
                  the first that really answers with HTML
     4. persist → store row: status "published", published_url,
                  storage_url, published_at

   Self-healing: every element access is guarded, so a stale/cached
   HTML version can never crash the script or kill the Publish
   button. Nothing is claimed LIVE unless a probe really fetched it.
   ============================================================ */

(async () => {
  try {
    await requireAuth();
  } catch { }
  let user = null;
  try { user = await Auth.getUser(); } catch { }
  if (!user) return;

  try { renderSidebar("publish"); renderTopbar("Publish", "Go live"); } catch { }

  /* ---------- Guarded element helpers (never crash on stale HTML) ---------- */
  const el = (id) => document.getElementById(id);
  const on = (id, fn) => { const n = el(id); if (n) n.addEventListener("click", fn); };
  const setText = (id, t) => { const n = el(id); if (n) n.textContent = t; };

  let shop = Utils.store.get("dc_shop") || {};
  let sections = Utils.store.get("dc_builder_sections");
  if (!Array.isArray(sections)) { try { sections = DemoData.defaultSections(); } catch { sections = []; } }
  let products = [];
  try { products = await DemoData.getProducts(user.id); } catch { }
  let sub = null;
  try { sub = await Auth.getSubscription(user.id); } catch { }

  const slug = shop.slug || Utils.toSlug(shop.name || "mystore") || "mystore";
  const BUCKET = APP_CONFIG.STORAGE_BUCKET;

  /* ---------- Deploy console ---------- */
  const log = (msg, cls = "") => {
    const box = el("deployConsole");
    if (!box) return;
    const line = document.createElement("div");
    line.className = cls;
    line.textContent = "▸ " + msg;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  };
  const setStatus = (text, cls) => {
    const n = el("deployStatus");
    if (n) { n.textContent = text; n.className = "badge " + (cls || "badge-ghost"); }
  };

  /* ---------- Live URL candidates (first verified = the live store) ---------- */
  const urlCandidates = () => {
    const list = [];
    const custom = (shop.custom_domain || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (custom) list.push({ kind: "custom domain", url: "https://" + custom });
    if (window.supa) {
      try {
        const pub = window.supa.storage.from(BUCKET).getPublicUrl(`${user.id}/${slug}/index.html`).data.publicUrl;
        if (pub) list.push({ kind: "storage", url: pub });
      } catch { }
    }
    if (/^https?:/.test(location.origin)) {
      list.push({ kind: "platform", url: location.origin + "/" + slug });
    }
    return list;
  };

  /* ---------- URL pill + step card (rebuilt, works with any HTML) ---------- */
  const refreshUrlUI = (url) => {
    const pill = el("publishUrl");
    if (pill) {
      pill.innerHTML = url
        ? `<a href="${url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${url}</a>`
          + `<button type="button" class="btn-icon" id="copyUrl" style="padding:4px" aria-label="Copy">📋</button>`
        : `<span style="color:var(--muted)">Not published yet</span>`
          + `<button type="button" class="btn-icon" id="copyUrl" style="padding:4px" aria-label="Copy">📋</button>`;
      const cp = el("copyUrl");
      if (cp) cp.onclick = async () => {
        if (!shop.published_url) { toast("warn", "Publish your store first."); return; }
        await Utils.copy(shop.published_url);
        toast("success", "Live URL copied to clipboard");
      };
    }
    const step = el("stepUrl");
    if (step) step.innerHTML = url
      ? `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
      : "Your live URL will appear here once published.";
  };

  /* ---------- Real reachability check: the site must ANSWER with HTML ---------- */
  const verifyUrl = async (url) => {
    try {
      const res = await fetch(url, { redirect: "follow", cache: "no-store", headers: { Range: "bytes=0-2048" } });
      if (!res.ok) return { ok: false, detail: "HTTP " + res.status };
      const type = (res.headers.get("content-type") || "").toLowerCase();
      if (!type.includes("html")) return { ok: false, detail: type ? "Not an HTML page (" + type + ")" : "No content-type header" };
      return { ok: true };
    } catch (err) {
      return { ok: false, detail: (err && err.message) || "unreachable" };
    }
  };

  /* ---- Plan gate ---- */
  const allowed = (Auth.planPaid(sub) || Auth.trialValid(sub) || !window.supa);
  const lock = el("planLockCard");
  if (!allowed && lock) {
    lock.classList.remove("hidden");
    let left = 0;
    try { left = Utils.daysLeft(sub && sub.end_date); } catch { }
    const txt = el("planLockText");
    if (txt) txt.textContent = left > 0
      ? `Your free trial ends in ${left} day${left === 1 ? "" : "s"}. Upgrade to Basic (PKR 300/mo) to publish your store with checkout.`
      : "Your trial has ended. Upgrade to Basic (PKR 300/mo) to publish your store. Your design is saved and waiting.";
    setStatus("Locked");
  }

  /* ---- Boot diagnostics + initial state ---- */
  setText("publishStoreName", shop.name || "My Store");
  log(window.supa
    ? `Storage connected — publishing will host the real store (${BUCKET}).`
    : "Storage offline (demo mode) — Publish will save the site to this browser.");
  log("Ready — press Publish to generate and upload your storefront.");
  if (shop.status === "published" && shop.published_url) {
    setStatus("Published", "badge-success");
  }
  refreshUrlUI(shop.published_url || null);

  /* ---- Local-export mode (no storage) ---- */
  let lastBundle = null;
  const loadLocalOnly = (files, btn) => {
    log("No storage connection — the site cannot be hosted for real here.", "warn");
    try { Utils.store.set("dc_published_" + slug, files); } catch { }
    try {
      Utils.db.update("stores", { id: shop.id }, { status: "draft" }).catch(() => { });
      Utils.store.set("dc_shop", { ...shop, status: "draft" });
    } catch { }
    lastBundle = files;
    setStatus("Saved locally", "badge-ghost");
    refreshUrlUI(null);
    btn.disabled = false;
    btn.innerHTML = "⚡ Try publish again";
    const dl = el("downloadBtn"); if (dl) dl.classList.remove("hidden");
    toast("warn", "Saved to this browser — connect storage (Supabase) to go live.");
  };

  /* ---- MAIN: build → upload → verify → persist ---- */
  on("publishBtn", async () => {
    if (!allowed) {
      toast("warn", "Upgrade to a paid plan to publish your store.");
      location.href = "billing.html";
      return;
    }

    const btn = el("publishBtn");
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="loader-inline"></span> Publishing…';
    const consoleBox = el("deployConsole");
    if (consoleBox) consoleBox.innerHTML = "";
    setStatus("Deploying…");
    shop = Utils.store.get("dc_shop") || {};

    try {
      /* 1. Generate the full website bundle */
      log(`Building storefront for "${shop.name || "My Store"}"…`, "warn");
      const files = StoreGenerator.build(sections, shop, products);
      const total = Object.keys(files).length;
      lastBundle = files;
      log(`${total} files generated (${Math.round(JSON.stringify(files).length / 1024)} KB)`, "ok");

      /* 2. Upload every file to the public bucket.
            Path matches the edge middleware: <user_id>/<slug>/<path> */
      let uploaded = 0;
      if (window.supa) {
        try {
          const { data: buckets } = await window.supa.storage.listBuckets();
          if (!(buckets || []).find(b => b.name === BUCKET)) {
            const { error } = await window.supa.storage.createBucket(BUCKET, { public: true });
            if (error) throw error;
          }
          log(`Uploading to ${BUCKET}/${user.id}/${slug}/…`, "warn");
          const entries = Object.entries(files);
          const CONCURRENCY = 4;
          const workers = Array.from({ length: Math.min(CONCURRENCY, entries.length) }, async () => {
            while (entries.length) {
              const [fpath, content] = entries.shift();
              const { error: upErr } = await window.supa.storage.from(BUCKET).upload(user.id + "/" + slug + "/" + fpath, content, {
                upsert: true,
                contentType: fpath.endsWith(".html") ? "text/html" : fpath.endsWith(".css") ? "text/css" : fpath.endsWith(".js") ? "text/javascript" : "application/xml",
              });
              if (upErr) throw upErr;
              uploaded++;
              if (uploaded % 4 === 0) log(`Uploaded ${uploaded}/${total}…`);
            }
          });
          await Promise.all(workers);
          log(`Upload complete: ${uploaded}/${total} files`, "ok");
        } catch (err) {
          log("Storage upload failed: " + (err && err.message), "warn");
          uploaded = 0;
        }
      }

      if (!uploaded) {
        loadLocalOnly(files, btn);
        return;
      }

      /* 3. Find the URL that really serves the store */
      let live = null;
      for (const cand of urlCandidates()) {
        log(`Checking ${cand.kind} URL…`, "warn");
        const probe = await verifyUrl(cand.url);
        if (probe.ok) { live = cand; log(`✓ ${cand.kind} URL is live`, "ok"); break; }
        log(`   not answering (${probe.detail})`, "");
      }

      /* 4. Persist the published state */
      let publicUrl = "";
      try { publicUrl = window.supa.storage.from(BUCKET).getPublicUrl(`${user.id}/${slug}/index.html`).data.publicUrl; } catch { }
      const publishedAt = new Date().toISOString();
      shop = { ...shop, status: "published", published_at: publishedAt, slug, published_url: (live ? live.url : publicUrl), storage_url: publicUrl };
      Utils.store.set("dc_shop", shop);
      Utils.db.update("stores", { id: shop.id }, {
        status: "published", published_at: publishedAt, slug,
        published_url: shop.published_url, storage_url: publicUrl,
      }).catch(() => { });
      Utils.store.set("dc_published_at", publishedAt);

      refreshUrlUI(shop.published_url);
      btn.disabled = false;
      btn.innerHTML = "⚡ Republish";
      const dl = el("downloadBtn"); if (dl) dl.classList.remove("hidden");
      const os = el("openStoreBtn"); if (os) { os.classList.remove("hidden"); os.href = shop.published_url || "#"; }

      if (live) {
        setStatus("Published ✓", "badge-success");
        log(`🎉 Store is LIVE at ${live.url}`, "ok");
        toast("success", "Your store is live! 🎉");
      } else {
        setStatus("Uploaded ⏳", "badge-warn");
        log("All files were uploaded, but no live URL answered yet.", "warn");
        if (publicUrl) log("Direct storage URL (always works when bucket is public): " + publicUrl, "warn");
        toast("warn", "Store files uploaded — open the URL above to confirm.");
      }
    } catch (err) {
      log("Error: " + (err && err.message || err), "warn");
      setStatus("Failed", "badge-danger");
      btn.disabled = false;
      btn.innerHTML = "⚡ Publish now";
      toast("error", "Publish failed: " + (err && err.message || err));
    }
  });

  /* ---- Download the generated site (index.html) to host anywhere ---- */
  on("downloadBtn", () => {
    if (!lastBundle) lastBundle = Utils.store.get("dc_published_" + slug) || {};
    const html = lastBundle["index.html"];
    if (!html) { toast("warn", "Publish the store first."); return; }
    Utils.downloadFile("dualcore-" + slug + "-index.html", html, "text/html");
    toast("success", "index.html downloaded — host it on any static site (Netlify, GitHub Pages…)");
  });

  /* ---- Preview: live URL when hosted, otherwise the local bundle ---- */
  on("previewStoreBtn", async () => {
    shop = Utils.store.get("dc_shop") || {};
    if (shop.published_url) {
      window.open(shop.published_url, "_blank", "noopener");
      return;
    }
    if (!lastBundle) lastBundle = Utils.store.get("dc_published_" + slug) || {};
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) { toast("warn", "Allow pop-ups to preview"); return; }
    w.document.open();
    w.document.write(lastBundle["index.html"] || Storefront.renderPage(sections, shop));
    w.document.close();
  });
})();