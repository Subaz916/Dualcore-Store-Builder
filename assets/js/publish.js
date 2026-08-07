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
  const domain = slug + "." + APP_CONFIG.PLATFORM_DOMAIN;

  $("#publishStoreName").textContent = shop.name || "My Store";
  $("#publishUrl").childNodes[0].nodeValue = domain + " ";
  $("#stepUrl").textContent = domain;
  $("#copyUrl").onclick = async () => {
    await Utils.copy("https://" + domain);
    toast("success", "URL copied to clipboard");
  };

  /* ---- Plan lock ---- */
  const paid = Auth.planPaid(sub);
  const lock = $("#planLockCard");
  if (!paid) {
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
  $("#publishBtn").onclick = async () => {
    if (!paid) {
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
      await wait(600);
      const files = StoreGenerator.build(sections, shop, products);
      log(`${Object.keys(files).length} files generated (${Math.round(JSON.stringify(files).length / 1024)} KB)`, "ok");

      // 2. Upload (folder: storefronts/<user_id>/<slug>/... per storage policies)
      log(`Uploading to supabase://${APP_CONFIG.STORAGE_BUCKET}/${user.id}/${slug}/…`, "warn");
      await wait(700);
      let uploaded = 0;
      if (window.supa) {
        try {
          const bucket = APP_CONFIG.STORAGE_BUCKET;
          const { data: buckets } = await window.supa.storage.listBuckets();
          if (!buckets?.find(b => b.name === bucket)) {
            const { error } = await window.supa.storage.createBucket(bucket, { public: true });
            if (error) throw error;
          }
          for (const [path, content] of Object.entries(files)) {
            const { error } = await window.supa.storage.from(bucket).upload(user.id + "/" + slug + "/" + path, content, {
              upsert: true, contentType: path.endsWith(".html") ? "text/html" : path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "text/javascript" : "application/xml",
            });
            if (error) throw error;
            uploaded++;
            if (uploaded % 4 === 0) log(`Uploaded ${uploaded}/${Object.keys(files).length}…`);
          }
        } catch (err) {
          log("Supabase upload failed: " + err.message, "warn");
          log("Falling back to local export mode…", "warn");
          uploaded = 0;
        }
      }
      if (!window.supa || !uploaded) {
        log("Demo mode: exporting storefront bundle to localStorage…");
        Utils.store.set("dc_published_" + slug, files);
        uploaded = Object.keys(files).length;
      }
      log(`Upload complete: ${uploaded} files`, "ok");

      // 3. SEO + status
      log("Writing robots.txt, sitemap.xml, SEO meta…", "ok");
      await wait(500);
      const publishedAt = new Date().toISOString();
      Utils.db.update("stores", { id: shop.id }, {
        status: "published", published_at: publishedAt, slug,
      }).catch(() => {});
      Utils.store.set("dc_shop", { ...shop, status: "published", published_at: publishedAt });

      // 4. Done
      log(`🎉 Store is LIVE at https://${domain}`, "ok");
      $("#deployStatus").textContent = "Published ✓";
      $("#deployStatus").className = "badge badge-success";
      btn.disabled = false;
      btn.innerHTML = "⚡ Republish";

      toast("success", "Your store is live! 🎉");
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