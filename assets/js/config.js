/* ============================================================
   DualCore — Configuration
   ============================================================ */

const APP_CONFIG = {
  // ── SUPABASE ────────────────────────────────────────────────
  // 1) Sign in to https://supabase.com
  // 2) Create a project
  // 3) Open Project Settings → API → copy the URL + anon key here
  SUPABASE_URL: "https://vtmjewwatshbdermcpyc.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bWpld3dhdHNoYmRlcm1jcHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNzYyNTksImV4cCI6MjEwMTY1MjI1OX0.dZnIzEgmrtcKF6bJrxInDhZwC0sM7ri8Dci7GAQsa_Q",

  BRAND: "DualCore",
  PLATFORM_DOMAIN: "dualcore.shop",

  PLANS: {
    free:     { name: "Free",      price: "Free",        monthly: 0,    days: 3,    trial: true },
    basic:    { name: "Basic",     price: "PKR 300",     monthly: 300,  days: 30,   trial: false },
    premium:  { name: "Premium",   price: "PKR 1000",    monthly: 1000, days: 30,   trial: false },
  },

  PRICE_FALLBACK: {
    opex: { basic: 300, premium: 1000 },
  },

  STORAGE_BUCKET: "storefronts",

  MAX_TRIAL_DAYS: 3,
};

/* ---------- Supabase client ----------
   supabase.js loads the SDK from CDN asynchronously and then
   dispatches "dualcore:supabase-ready". We create the client
   here (immediately if the SDK is already available, otherwise
   when the ready event fires). No keys / no network → demo mode. */
window.initSupabase = (url, key) => {
  const create = typeof window.SUPABASE_CREATE_CLIENT === "function" ? window.SUPABASE_CREATE_CLIENT : null;
  if (!create || !url || String(url).includes("YOUR-PROJECT") || !key) { window.supa = null; return; }
  try {
    window.supa = create(url, key);
    console.warn("DualCore: Supabase client initialised.");
  } catch { window.supa = null; }
};

/* ---------- Readiness promise ----------
   Resolves when the SDK has either loaded (cloud) or failed (demo).
   This guarantees page scripts and data layer wait for a definitive
   mode before running, fixing "works on hard refresh only" bug. */
window.SUPABASE_READY = new Promise((resolve) => {
  if (typeof window.supabase !== "undefined") {
    resolve();
  } else {
    window.addEventListener("dualcore:supabase-ready", () => resolve(), { once: true });
  }
});

if (typeof window.SUPABASE_CREATE_CLIENT !== "undefined") {
  window.initSupabase(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
} else {
  console.warn("DualCore: waiting for Supabase SDK…");
  window.supa = null;
  window.addEventListener("dualcore:supabase-ready", () => {
    window.initSupabase(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
  });
}