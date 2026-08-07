/* ============================================================
   DualCore — supabase.js
   Loads the Supabase JS SDK (v2) from CDN SYNCHRONOUSLY so that
   window.supa is ready before any page script runs. This keeps
   the whole app in ONE consistent mode (cloud OR demo) per load
   — no mid-session flips between localStorage and Supabase auth.
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

  // 1) SDK already present (edge cache / other loader) → boot now.
  if (window.supabase) { boot(); return; }

  // 2) Synchronous load: a classic script appended from the parser
  //    blocks further parsing until it executes, so the scripts that
  //    follow (app.js, auth.js, page scripts) see window.supa ready.
  (function syncLoad(i) {
    if (i >= srcs.length) {
      // No network access → demo mode. supa stays null deliberately.
      console.warn("DualCore: Supabase SDK unavailable — demo mode with local data.");
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
