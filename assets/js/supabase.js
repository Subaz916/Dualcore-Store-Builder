/* ============================================================
   DualCore — supabase.js
   Loads the Supabase JS SDK (v2) from CDN and exposes
   window.supabase, then config.js builds window.supa client.
   ============================================================ */

(() => {
  if (window.supabase) { init(); return; }

  const srcs = [
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
    "https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  ];
  const load = (i) => {
    if (i >= srcs.length) return; // no network → app runs in demo mode
    const s = document.createElement("script");
    s.src = srcs[i];
    s.async = true;
    s.onload = () => { if (window.supabase) init(); else load(i + 1); };
    s.onerror = () => load(i + 1);
    document.head.appendChild(s);
  };
  load(0);

  function init() {
    window.SUPABASE_CREATE_CLIENT = (url, key) => {
      if (!url || url.includes("YOUR-PROJECT")) return null; // demo mode until configured
      return window.supabase.createClient(url, key);
    };
    window.dispatchEvent(new CustomEvent("dualcore:supabase-ready"));
  }
})();