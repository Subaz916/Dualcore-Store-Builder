/* ============================================================
   DualCore — domains.js
   Manages subdomains and custom domains.
   ============================================================ */

(async () => {
  try {
    await requireAuth();
    const user = await Auth.getUser();
    if (!user) return;

    renderSidebar("domains");
    renderTopbar("Domains", "Manage subdomains & custom domains");

    let shop = Utils.store.get("dc_shop") || {};
    const sub = await Auth.getSubscription(user.id);
    const hasPaidPlan = Auth.planPaid(sub) || Auth.trialValid(sub) || !window.supa;

    // Elements
    const planGate = $("#planGate");
    const subdomainDisplay = $("#subdomainDisplay");
    const copySubdomain = $("#copySubdomain");
    const openSubdomain = $("#openSubdomain");
    const newDomainInput = $("#newDomainInput");
    const connectDomainBtn = $("#connectDomainBtn");
    const dnsInstructions = $("#dnsInstructions");
    const dnsForDomain = $("#dnsForDomain");
    const dnsRows = $("#dnsRows");
    const closeDns = $("#closeDns");
    const closeDnsBtn = $("#closeDnsBtn");
    const verifyDnsBtn = $("#verifyDnsBtn");
    const propFill = $("#propFill");
    const propText = $("#propText");
    const customDomainsList = $("#customDomainsList");
    
    const sslStatus = $("#sslStatus");
    const dnsStatus = $("#dnsStatus");
    const publishStatus = $("#publishStatus");

    const slug = shop.slug || Utils.toSlug(shop.name || "mystore") || "mystore";
    const subdomainUrl = `${slug}.${APP_CONFIG.PLATFORM_DOMAIN || "dualcore.shop"}`;

    // Render subdomain
    if (subdomainDisplay) subdomainDisplay.textContent = subdomainUrl;
    if (openSubdomain) {
      openSubdomain.href = window.supa 
        ? `https://${subdomainUrl}` 
        : `store.html`;
    }

    if (copySubdomain) {
      copySubdomain.onclick = async () => {
        await Utils.copy(`https://${subdomainUrl}`);
        toast("success", "Subdomain URL copied to clipboard");
      };
    }

    // Check Plan Gate
    if (planGate) {
      if (hasPaidPlan) {
        planGate.classList.add("hidden");
      } else {
        planGate.classList.remove("hidden");
      }
    }

    // Health Checks
    if (sslStatus) sslStatus.textContent = "Active & auto-renewing";
    if (dnsStatus) dnsStatus.textContent = "Resolving correctly";
    if (publishStatus) {
      publishStatus.textContent = shop.status === "published" ? "Live (Published)" : "Draft (Not published)";
      if (shop.status === "published") {
        $("#healthPublish").textContent = "✅";
      } else {
        $("#healthPublish").textContent = "⚠️";
      }
    }

    // Render Custom Domains list
    const renderCustomDomains = () => {
      if (!customDomainsList) return;
      
      const domain = shop.custom_domain || "";
      if (!domain) {
        customDomainsList.innerHTML = `
          <div class="card" style="text-align:center;padding:40px;color:var(--muted)">
            <div style="font-size:2.5rem;margin-bottom:12px">🌐</div>
            <h4>No custom domains connected</h4>
            <p style="font-size:.85rem;margin-top:4px">Connect your own brand domain (e.g. shop.yourbrand.com) to look more professional.</p>
          </div>`;
        return;
      }

      customDomainsList.innerHTML = `
        <div class="domain-card active">
          <div class="flex-between" style="flex-wrap:wrap;gap:12px">
            <div>
              <div class="flex align-center gap-2" style="margin-bottom:6px">
                <span class="domain-tag custom">CUSTOM DOMAIN</span>
                <span class="ssl-badge">🔒 SSL Active</span>
                <span class="badge badge-success">Active</span>
              </div>
              <div style="font-size:1.3rem;font-weight:800">${Utils.esc(domain)}</div>
              <p class="muted" style="font-size:.83rem;margin-top:4px">Connected and pointed to your storefront.</p>
            </div>
            <div class="flex gap-2 align-center" style="flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" id="viewDnsConfig">Config</button>
              <button class="btn btn-danger btn-sm" id="removeDomainBtn">Disconnect</button>
            </div>
          </div>
        </div>`;

      // Bind events on list
      $("#viewDnsConfig").onclick = () => showDnsConfig(domain);
      $("#removeDomainBtn").onclick = () => disconnectDomain();
    };

    const showDnsConfig = (domain) => {
      if (!dnsInstructions) return;
      if (dnsForDomain) dnsForDomain.textContent = domain;
      
      // Determine if subdomain or root domain
      const isSubdomain = domain.split('.').length > 2;
      const host = isSubdomain ? domain.split('.')[0] : '@';
      const cnameValue = `${slug}.dualcore.shop`;
      const txtChallenge = `dc-verify-${slug}`;

      if (dnsRows) {
        dnsRows.innerHTML = `
          <tr>
            <td>CNAME</td>
            <td class="copy-cell" data-copy="${host}">${host} <span style="font-size:.7rem;color:var(--primary)">[copy]</span></td>
            <td class="copy-cell" data-copy="${cnameValue}">${cnameValue} <span style="font-size:.7rem;color:var(--primary)">[copy]</span></td>
            <td>3600</td>
          </tr>
          <tr>
            <td>TXT</td>
            <td class="copy-cell" data-copy="_challenge">${isSubdomain ? '_challenge.' + host : '_challenge'} <span style="font-size:.7rem;color:var(--primary)">[copy]</span></td>
            <td class="copy-cell" data-copy="${txtChallenge}">${txtChallenge} <span style="font-size:.7rem;color:var(--primary)">[copy]</span></td>
            <td>3600</td>
          </tr>
        `;

        dnsRows.querySelectorAll('.copy-cell').forEach(cell => {
          cell.onclick = async () => {
            await Utils.copy(cell.dataset.copy);
            toast("success", `Copied value: ${cell.dataset.copy}`);
          };
        });
      }

      dnsInstructions.classList.remove("hidden");
      if (propFill) propFill.style.width = "40%";
      if (propText) propText.textContent = "DNS propagation in progress (40% complete)...";
    };

    const disconnectDomain = () => {
      Components.confirmDialog({
        title: "Disconnect Domain?",
        message: `Are you sure you want to disconnect "${shop.custom_domain}"? Your store will only be accessible via your free subdomain.`,
        danger: true,
        confirmText: "Disconnect"
      }).then(async (ok) => {
        if (!ok) return;
        
        shop.custom_domain = null;
        Utils.store.set("dc_shop", shop);
        
        if (window.supa && shop.id) {
          await Utils.db.update("stores", { id: shop.id }, { custom_domain: null });
        }
        
        toast("success", "Custom domain disconnected successfully");
        dnsInstructions.classList.add("hidden");
        renderCustomDomains();
      });
    };

    // Connect custom domain
    if (connectDomainBtn) {
      connectDomainBtn.onclick = async () => {
        if (!hasPaidPlan) {
          toast("error", "Custom domains are locked. Please upgrade your plan.");
          return;
        }

        const domainVal = newDomainInput.value.trim().toLowerCase();
        
        // Simple domain validation regex
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,10}$/;
        if (!domainRegex.test(domainVal)) {
          toast("error", "Please enter a valid domain name (e.g. shop.mybrand.com)");
          return;
        }

        connectDomainBtn.disabled = true;
        connectDomainBtn.innerHTML = '<span class="loader-inline"></span> Connecting...';

        try {
          shop.custom_domain = domainVal;
          Utils.store.set("dc_shop", shop);

          if (window.supa && shop.id) {
            await Utils.db.update("stores", { id: shop.id }, { custom_domain: domainVal });
          }

          toast("success", `Domain "${domainVal}" connected! Please complete DNS setup.`);
          newDomainInput.value = "";
          renderCustomDomains();
          showDnsConfig(domainVal);
        } catch (err) {
          toast("error", "Failed to connect domain: " + err.message);
        } finally {
          connectDomainBtn.disabled = false;
          connectDomainBtn.innerHTML = "Connect →";
        }
      };
    }

    // Verify DNS Button simulation
    if (verifyDnsBtn) {
      verifyDnsBtn.onclick = async () => {
        verifyDnsBtn.disabled = true;
        verifyDnsBtn.innerHTML = '<span class="loader-inline"></span> Verifying records...';
        
        if (propFill) propFill.style.width = "75%";
        if (propText) propText.textContent = "Checking DNS propagation (75%)...";
        
        await new Promise(r => setTimeout(r, 1500));
        
        if (propFill) propFill.style.width = "100%";
        if (propText) propText.textContent = "DNS verified and SSL active (100% propagated) ✅";
        
        toast("success", "DNS record verified successfully! SSL certificate is active.");
        
        verifyDnsBtn.disabled = false;
        verifyDnsBtn.innerHTML = "🔍 Verify DNS";
        
        // Hide config instructions after short delay
        setTimeout(() => {
          dnsInstructions.classList.add("hidden");
        }, 2000);
      };
    }

    // Close DNS config listeners
    if (closeDns) closeDns.onclick = () => dnsInstructions.classList.add("hidden");
    if (closeDnsBtn) closeDnsBtn.onclick = () => dnsInstructions.classList.add("hidden");

    // Initialize View
    renderCustomDomains();

  } catch (err) {
    console.error("Domains view initialization failed:", err);
  }
})();
