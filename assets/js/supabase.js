/* ============================================================
   DualCore — supabase.js
   Loads the Supabase JS SDK (v2) from CDN and guarantees a
   "dualcore:supabase-ready" event is dispatched once the SDK
   has either loaded (cloud mode) or failed (demo mode). This
   lets the app wait for a definitive mode decision before
   running any data/auth logic.
   ============================================================ */

(() => {
  const srcs = [
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
    "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  ];

  let done = false;
  const dispatchReady = () => {
    if (done) return;
    done = true;
    window.dispatchEvent(new CustomEvent("dualcore:supabase-ready"));
  };

  const boot = () => {
    if (typeof window.SUPABASE_CREATE_CLIENT !== "function") {
      window.SUPABASE_CREATE_CLIENT = (url, key) => {
        if (!url || String(url).includes("YOUR-PROJECT")) return null;
        return window.supabase.createClient(url, key);
      };
    }
    if (typeof window.initSupabase === "function") {
      try {
        window.initSupabase(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
      } catch { window.supa = null; }
    }
    dispatchReady();
  };

  // 1) SDK already present → boot now.
  if (window.supabase) { boot(); return; }

  // 2) Max safety timeout: if CDN network is slow, don't block the UI page render
  const timeoutId = setTimeout(() => {
    if (!done && !window.supabase) {
      console.warn("DualCore: Supabase SDK CDN timed out — loading page in local demo mode.");
      window.supa = null;
      dispatchReady();
    }
  }, 1200);

  // 3) Load SDK from CDN. On success or failure, fire dualcore:supabase-ready.
  (function syncLoad(i) {
    if (done) return;
    if (i >= srcs.length) {
      clearTimeout(timeoutId);
      console.warn("DualCore: Supabase SDK unavailable — demo mode with local data.");
      window.supa = null;
      dispatchReady();
      return;
    }
    const s = document.createElement("script");
    s.src = srcs[i];
    s.async = true;
    s.onload = () => {
      clearTimeout(timeoutId);
      if (window.supabase) boot(); else syncLoad(i + 1);
    };
    s.onerror = () => {
      if (!done) syncLoad(i + 1);
    };
    (document.head || document.documentElement).appendChild(s);
  })(0);
})();
