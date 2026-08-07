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
    window.dispatchEvent(new CustomEvent("dualcore:supabase-ready"));
  };

  // 1) SDK already present → boot now.
  if (window.supabase) { boot(); return; }

  // 2) Load SDK from CDN. On success or total failure, fire
  //    dualcore:supabase-ready so the app can proceed.
  (function syncLoad(i) {
    if (i >= srcs.length) {
      // All CDNs failed → demo mode. Ensure ready event fires.
      console.warn("DualCore: Supabase SDK unavailable — demo mode with local data.");
      window.supa = null;
      window.dispatchEvent(new CustomEvent("dualcore:supabase-ready"));
      return;
    }
    const s = document.createElement("script");
    s.src = srcs[i];
    s.async = false;
    s.onload = () => { if (window.supabase) boot(); else syncLoad(i + 1); };
    s.onerror = () => syncLoad(i + 1);
    (document.head || document.documentElement).appendChild(s);
  })(0);
})();
