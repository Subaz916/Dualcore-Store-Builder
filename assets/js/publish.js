/* ============================================================
   DualCore — publish.js
   Generates the full multi-page storefront and really hosts it:

     1. build   → StoreGenerator creates every page (HTML/CSS/JS)
     2. upload  → each file goes to Supabase Storage at
                  storefronts/<user_id>/<slug>/<path> (public bucket)
     3. verify  → probes candidate live URLs (platform edge middleware,
                  custom domain, direct storage URL) and keeps the one
                  that actually answers with HTML
     4. persist → store row gets status "published" + published_url

   Nothing is ever claimed as "LIVE" unless a probe really fetched it.
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("publish");
  renderTopbar("Publish", "Go live");

  let shop = Utils.store.get("dc_shop") || {};
  const sections = Utils.store.get("dc_builder_sections") || DemoData.defaultSections();
  const products = await DemoData.getProducts(user.id);
  const sub = await Auth.getSubscription(user.id);

  const slug = shop.slug || Utils.toSlug(shop.name || "mystore") || "mystore";
  const BUCKET = APP_CONFIG.STORAGE_BUCKET;

  /* ---------- Live URL candidates (first verified = the live store) ---------- */
  const urlCandidates = () => {
    const list = [];
    const custom = (shop.custom_domain || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (custom) list.push({ kind: "custom domain", url: "https://" + custom });
    if (window.supa) {
      const pub = window.supa.storage.from(BUCKET).getPublicUrl(`${user.id}/${slug}/index.html`).data.publicUrl;
      if (pub) list.push({ kind: "storage", url: pub });
    }
    if (/^https?:/.test(location.origin)) {
      list.push({ kind: "platform", url: location.origin + "/" + slug });
    }
    return list;
  };

  /* ---------- UI ---------- */
  const $urlLink = $("#publishUrlLink");
  const $stepUrl = $("#stepUrl");
  const renderUrl = (domain) => {
    if (domain) {
      $urlLink.href = domain;
      $urlLink.textContent = domain;
      $stepUrl.innerHTML = `<a href="${domain}" target="_blank" rel="noopener">${domain}</a>`;
    } else {
      $urlLink.removeAttribute("href");
      $urlLink.textContent = "Not published yet";
      $stepUrl.innerHTML = "Your live URL will appear here once published.";
    }
  };
  renderUrl(shop.published_url || null);

  $("#copyUrl").onclick = async () => {
    if (!shop.published_url) { toast("warn", "Publish your store first."); return; }
    await Utils.copy(shop.published_url);
    toast("success", "Live URL copied to clipboard");
  };

  const log = (msg, cls = "") => {
    const box = $("#deployConsole");
    const line = document.createElement("div");
    line.className = cls;
    line.textContent = "▸ " + msg;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  const setStatus = (text, cls) => {
    const el = $("#deployStatus");
    el.textContent = text;
    el.className = "badge " + (cls || "badge-ghost");
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
  const allowed = Auth.planPaid(sub) || Auth.trialValid(sub) || !window.supa;
  const lock = $("#planLockCard");
  if (!allowed) {
    lock.classList.remove("hidden");
    const left = Utils.daysLeft(sub && sub.end_date);
    $("#planLockText").textContent = left > 0
      ? `Your free trial ends in ${left} day${left === 1 ? "" : "s"}. Upgrade to Basic (PKR 300/mo) to publish your store with checkout.`
      : "Your trial has ended. Upgrade to Basic (PKR 300/mo) to publish your store. Your design is saved and waiting.";
    setStatus("Locked");
  }

  /* ---- Publish: build → upload → verify → persist ---- */
  $("#publishBtn").onclick = async () => {
    if (!allowed) {
      toast("warn", "Upgrade to a paid plan to publish your store.");
      location.href = "billing.html";
      return;
    }

    const btn = $("#publishBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="loader-inline"></span> Publishing…';
    $("#deployConsole").innerHTML = "";
    setStatus("Deploying…");
    shop = Utils.store.get("dc_shop") || {};

    try {
      /* 1. Generate the full website bundle */
      log(`Building storefront for "${shop.name || "My Store"}"…`, "warn");
      const files = StoreGenerator.build(sections, shop, products);
      const total = Object.keys(files).length;
      log(`${total} files generated (${Math.round(JSON.stringify(files).length / 1024)} KB)`, "ok");

      /* 2. Upload every file into the public bucket.
            Path must match the edge middleware: <user_id>/<slug>/<path> */
      let uploaded = 0;
      if (window.supa) {
        try {
          const { data: buckets } = await window.supa.storage.listBuckets();
          if (!buckets?.find(b => b.name === BUCKET)) {
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
          log("Storage upload failed: " + err.message, "warn");
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
        if (probe.ok) {
          live = cand;
          log(`✓ ${cand.kind} URL is live`, "ok");
          break;
        }
        log(`   not answering (${probe.detail})`, "");
      }

      /* 4. Persist the published state */
      const publicUrl = window.supa.storage.from(BUCKET).getPublicUrl(`${user.id}/${slug}/index.html`).data.publicUrl;
      const publishedAt = new Date().toISOString();
      shop = { ...shop, status: "published", published_at: publishedAt, slug, published_url: live ? live.url : publicUrl, storage_url: publicUrl };
      Utils.store.set("dc_shop", shop);
      Utils.db.update("stores", { id: shop.id }, {
        status: "published", published_at: publishedAt, slug,
        published_url: shop.published_url, storage_url: publicUrl,
      }).catch(() => {});
      Utils.store.set("dc_published_at", publishedAt);

      if (live) {
        renderUrl(live.url);
        setStatus("Published ✓", "badge-success");
        log(`🎉 Store is LIVE at ${live.url}`, "ok");
        toast("success", "Your store is live! 🎉");
      } else {
        setStatus("Uploaded ⏳", "badge-warn");
        renderUrl(shop.published_url);
        log("All files were uploaded, but no live URL answered yet.", "warn");
        log("The direct storage URL is: " + publicUrl, "warn");
        toast("warn", "Store files uploaded — check the storage/edge URL.");
      }
      btn.disabled = false;
      btn.innerHTML = "⚡ Republish";
      $("#downloadBtn").classList.remove("hidden");
    } catch (err) {
      log("Error: " + err.message, "warn");
      setStatus("Failed", "badge-danger");
      btn.disabled = false;
      btn.innerHTML = "⚡ Publish now";
      toast("error", "Publish failed: " + err.message);
    }
  };

  /* ---- No storage: honest local-export mode (+ downloadable single page) ---- */
  const loadLocalOnly = (files, btn) => {
    log("No storage connection — cannot host the store for real.", "warn");
    Utils.store.set("dc_published_" + slug, files);
    Utils.db.update("stores", { id: shop.id }, { status: "draft" }).catch(() => {});
    Utils.store.set("dc_shop", { ...shop, status: "draft" });
    setStatus("Not published", "badge-ghost");
    $("#deployStatus").textContent = "Saved locally";
    renderUrl(null);
    btn.disabled = false;
    btn.innerHTML = "⚡ Try publish again";
    $("#downloadBtn").classList.remove("hidden");
    toast("warn", "Saved to this browser — connect storage (Supabase) to go live.");
  };

  /* ---- Download the generated site (index.html) to host anywhere ---- */
  let lastBundle = null;
  $("#downloadBtn").onclick = () => {
    if (!lastBundle) lastBundle = Utils.store.get("dc_published_" + slug) || {};
    const html = lastBundle["index.html"];
    if (!html) { toast("warn", "Publish the store first."); return; }
    Utils.downloadFile("dualcore-" + slug + "-index.html", html, "text/html");
    toast("success", "index.html downloaded — host it on any static site (Netlify, GitHub Pages…)");
  };

  /* ---- Preview: live URL when hosted, otherwise the local bundle ---- */
  $("#previewStoreBtn").onclick = async () => {
    shop = Utils.store.get("dc_shop") || {};
    if (shop.published_url) {
      window.open(shop.published_url, "_blank", "noopener");
      return;
    }
    const files = Utils.store.get("dc_published_" + slug) || {};
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) { toast("warn", "Allow pop-ups to preview"); return; }
    w.document.open();
    w.document.write(files["index.html"] || Storefront.renderPage(sections, shop));
    w.document.close();
  };
})();