/* ============================================================
   DualCore — publish.js
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

  /* The store is hosted by this very app: the Vercel middleware in
     middleware.js serves /<slug>/... from Supabase Storage. So the live URL
     is built from wherever the app is actually deployed (works on the Vercel
     preview/production, a custom deploy or a custom domain) — not a
     hardcoded host that may not exist. */
  const liveOrigin = /^https?:/.test(location.origin) ? location.origin : "http://localhost:3000";
  const customDomain = (shop.custom_domain || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const domain = customDomain ? "https://" + customDomain : liveOrigin + "/" + slug;

  $("#publishStoreName").textContent = shop.name || "My Store";
  $("#publishUrlLink").href = domain;
  $("#publishUrlLink").textContent = domain;
  $("#stepUrl").innerHTML = `<a href="${domain}" target="_blank" rel="noopener">${domain}</a>`;
  $("#copyUrl").onclick = async () => {
    await Utils.copy(domain);
    toast("success", "Live URL copied to clipboard");
  };

  /* ---- Plan lock ---- */
  const allowed = Auth.planPaid(sub) || Auth.trialValid(sub) || !window.supa;
  const lock = $("#planLockCard");
  if (!allowed) {
    lock.classList.remove("hidden");
    const left = Utils.daysLeft(sub.end_date);
    $("#planLockText").textContent = left > 0
      ? `Your free trial ends in ${left} day${left === 1 ? "" : "s"}. Upgrade to Basic (PKR 300/mo) to publish your store with checkout.`
      : "Your trial has ended. Upgrade to Basic (PKR 300/mo) to publish your store. Your design is saved and waiting.";
    $("#deployStatus").textContent = "Locked";
  }

  const log = (msg, cls = "") => {
    const box = $("#deployConsole");
    const line = document.createElement("div");
    line.className = cls;
    line.textContent = "▸ " + msg;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---- Main publish flow ---- */
  const verifyLive = async (url) => {
    // Real reachability check — the site must actually answer HTML.
    try {
      const res = await fetch(url, { redirect: "follow", cache: "no-store", headers: { Range: "bytes=0-1024" } });
      if (!res.ok) return { ok: false, detail: "HTTP " + res.status };
      const type = (res.headers.get("content-type") || "").toLowerCase();
      if (!type.includes("html")) return { ok: false, detail: "Not an HTML page (" + (type || "no content-type") + ")" };
      return { ok: true };
    } catch (err) {
      return { ok: false, detail: "Network error: " + (err.message || err) };
    }
  };

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
    $("#deployStatus").textContent = "Deploying…";

    try {
      // 1. Generate
      log(`Building storefront for "${shop.name || "My Store"}"…`, "warn");
      const files = StoreGenerator.build(sections, shop, products);
      log(`${Object.keys(files).length} files generated (${Math.round(JSON.stringify(files).length / 1024)} KB)`, "ok");

      // 2. Upload (folder: storefronts/<user_id>/<slug>/... per storage policies)
      log(`Uploading to storage ${APP_CONFIG.STORAGE_BUCKET}/${user.id}/${slug}/…`, "warn");
      let uploaded = 0;
      if (window.supa) {
        try {
          const bucket = APP_CONFIG.STORAGE_BUCKET;
          const { data: buckets } = await window.supa.storage.listBuckets();
          if (!buckets?.find(b => b.name === bucket)) {
            const { error } = await window.supa.storage.createBucket(bucket, { public: true });
            if (error) throw error;
          }
          const entries = Object.entries(files);
          const CONCURRENCY = 4;
          const workers = Array.from({ length: Math.min(CONCURRENCY, entries.length) }, async () => {
            while (entries.length) {
              const [fpath, content] = entries.shift();
              const { error: upErr } = await window.supa.storage.from(bucket).upload(user.id + "/" + slug + "/" + fpath, content, {
                upsert: true, contentType: fpath.endsWith(".html") ? "text/html" : fpath.endsWith(".css") ? "text/css" : fpath.endsWith(".js") ? "text/javascript" : "application/xml",
              });
              if (upErr) throw upErr;
              uploaded++;
              if (uploaded % 4 === 0) log(`Uploaded ${uploaded}/${Object.keys(files).length}…`);
            }
          });
          await Promise.all(workers);
        } catch (err) {
          log("Storage upload failed: " + err.message, "warn");
          uploaded = 0;
        }
      }

      // 3. Verify the store is actually reachable on the live URL.
      let live = false;
      if (uploaded) {
        log("Verifying live site answers…", "warn");
        const probe = await verifyLive(domain);
        live = probe.ok;
        if (live) log("✓ Live site answered with HTML", "ok");
        else log("Files uploaded to storage — the live URL did not answer yet: " + probe.detail, "warn");
      }

      if (!uploaded) {
        log("No storage connection — saving the bundle to this browser only.", "warn");
        Utils.store.set("dc_published_" + slug, files);
        $("#deployStatus").textContent = "Saved locally";
        $("#deployStatus").className = "badge badge-ghost";
        btn.disabled = false;
        btn.innerHTML = "⚡ Try publish again";
        toast("warn", "Saved to this browser — connect storage (Supabase) to really go live.");
        Utils.db.update("stores", { id: shop.id }, { status: "draft" }).catch(() => {});
        Utils.store.set("dc_shop", { ...shop, status: "draft" });
        return;
      }

      // 4. SEO + status — files are really in storage; mark live when verified.
      log("Writing robots.txt, sitemap.xml, SEO meta…", "ok");
      const publishedAt = new Date().toISOString();
      Utils.db.update("stores", { id: shop.id }, {
        status: "published", published_at: publishedAt, slug,
      }).catch(() => {});
      Utils.store.set("dc_shop", { ...shop, status: "published", published_at: publishedAt });

      // 5. Done — real URL, really hosted.
      if (live) log(`🎉 Store is LIVE at ${domain}`, "ok");
      else log(`Files live in storage — open ${domain} to see your store (Vercel edge middleware serves it)`, "warn");
      $("#deployStatus").textContent = live ? "Published ✓" : "Uploaded ⏳";
      $("#deployStatus").className = live ? "badge badge-success" : "badge badge-warn";
      btn.disabled = false;
      btn.innerHTML = "⚡ Republish";

      toast("success", live ? "Your store is live! 🎉" : "Store uploaded — verify the live URL when ready.");
      Utils.store.set("dc_published_at", publishedAt);
      $("#previewStoreBtn").classList.remove("hidden");
    } catch (err) {
      log("Error: " + err.message, "warn");
      $("#deployStatus").textContent = "Failed";
      $("#deployStatus").className = "badge badge-danger";
      btn.disabled = false;
      btn.innerHTML = "⚡ Publish now";
      toast("error", "Publish failed: " + err.message);
    }
  };

  /* ---- Preview stored files ---- */
  $("#previewStoreBtn").onclick = () => {
    const files = Utils.store.get("dc_published_" + slug) || StoreGenerator.build(sections, shop, products);
    const w = window.open("", "_blank", "width=1200,height=800");
    if (!w) { toast("warn", "Allow pop-ups to preview"); return; }
    w.document.open();
    w.document.write(files["index.html"]);
    w.document.close();
  };
})();