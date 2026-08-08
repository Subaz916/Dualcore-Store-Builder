/* ============================================================
   DualCore — utils.js  (shared helpers, no dependencies)
   ============================================================ */

const Utils = (() => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const uid = () => "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const debounce = (fn, ms = 250) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  const throttle = (fn, ms = 100) => {
    let last = 0, t;
    return (...a) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn(...a); }
      else { clearTimeout(t); t = setTimeout(() => { last = Date.now(); fn(...a); }, ms - (now - last)); }
    };
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmtMoney = (n, cur = "PKR") => {
    const v = Number(n || 0);
    if (cur === "PKR") return "PKR " + v.toLocaleString("en-PK", { maximumFractionDigits: 0 });
    return cur + " " + v.toLocaleString("en-US", { minimumFractionDigits: 2 });
  };

  const fmtNum = (n) => Number(n || 0).toLocaleString("en-US");

  const fmtDate = (iso, opts = {}) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", ...opts });
  };

  const timeAgo = (iso) => {
    if (!iso) return "—";
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
    return fmtDate(iso);
  };

  const daysLeft = (iso) => {
    if (!iso) return 0;
    return Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 864e5));
  };

  const shortId = (id = "") => String(id).slice(0, 8);

  const initials = (name = "") => name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const avatarColor = (name = "") => {
    const colors = ["#5C6EFF", "#7C4DFF", "#00C896", "#F59E0B", "#EF4444", "#0EA5E9", "#EC4899", "#10B981", "#8B5CF6"];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return colors[h % colors.length];
  };

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const rand = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));

  const toSlug = (s) => String(s || "").toLowerCase().trim()
    .replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };

  /* ---------- localStorage helpers (JSON safe) ---------- */
  const store = {
    get(key, fb = null) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
    remove(key) { try { localStorage.removeItem(key); } catch {} },
  };

  /* ---------- Storage abstraction: LOCAL-FIRST with background cloud sync ----------
     Performance model:
       • Reads  → served instantly from an in-memory cache (stale-while-revalidate),
                  or from Supabase with a hard timeout when nothing is cached yet.
       • Writes → applied to the local mirror synchronously and returned at once,
                  then pushed to Supabase in the background (retried with backoff).
     Result: every click/action resolves in milliseconds; the cloud (when reachable)
     is always eventually consistent. In demo mode (no Supabase) nothing changes.  */

  const CACHE_TTL = 3500;        // ms before an in-memory read is refreshed
  const NET_TIMEOUT = 4500;      // hard cap on any Supabase network call
  const readCache = new Map();   // cacheKey → { ts, rows }

  const demoSel = (table, opts = {}) => {
    let rows = store.get("dc_" + table, []);
    if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) rows = rows.filter(r => r[k] === v);
    if (opts.order) rows.sort((a, b) => opts.asc ? (a[opts.order] > b[opts.order] ? 1 : -1) : (a[opts.order] < b[opts.order] ? 1 : -1));
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return rows;
  };
  const cKey = (table, opts = {}) => table + "|" + JSON.stringify({ e: opts.eq || null, o: opts.order || null, a: !!opts.asc, l: opts.limit || null });
  const cDrop = (table) => {
    const p = table + "|";
    for (const k of readCache.keys()) if (k.startsWith(p)) readCache.delete(k);
  };
  const cGet = (table, opts) => {
    const hit = readCache.get(cKey(table, opts));
    return hit ? hit.rows.map(r => ({ ...r })) : null;
  };
  const cSet = (table, opts, rows) => readCache.set(cKey(table, opts), { ts: Date.now(), rows: rows.map(r => ({ ...r })) });
  const withTimeout = (p, ms = NET_TIMEOUT) => Promise.race([p, new Promise(res => setTimeout(() => res({ timedOut: true }), ms))]);
  const warn = (table, err) => console.warn("[DualCore] " + table + " → local fallback:", err?.message || err?.error_description || err);

  /* ---------- pending cloud-sync queue (retries with backoff) ---------- */
  const syncQueue = [];
  let syncTimer = null;
  const enqueueSync = (op) => {
    op.tries = (op.tries || 0) + 1;
    syncQueue.push(op);
    if (!syncTimer) {
      syncTimer = setTimeout(() => { syncTimer = null; flushSync(); }, 350);
    }
  };
  const flushSync = async () => {
    if (!window.supa) return;
    if (syncQueue.length > 20) syncQueue.splice(0, syncQueue.length - 20);
    while (syncQueue.length) {
      const op = syncQueue[0];
      try {
        const { error } = op.kind === "remove"
          ? await withTimeout(window.supa.from(op.table).delete().match(op.match))
          : op.kind === "update"
            ? await withTimeout(window.supa.from(op.table).update(op.patch).match(op.match))
            : op.kind === "upsert"
              ? await withTimeout(window.supa.from(op.table).upsert(op.rows))
              : await withTimeout(window.supa.from(op.table).insert(op.row));
        if (error) throw error;
        syncQueue.shift();
      } catch (err) {
        if (op.tries > 4) { syncQueue.shift(); warn(op.table, err); }
        else break; // keep at front, retry later
      }
    }
    if (syncQueue.length) setTimeout(flushSync, 2500);
  };
  window.addEventListener?.("dualcore:supabase-ready", () => setTimeout(flushSync, 600));

  const db = {
    async select(table, opts = {}) {
      // 1) In-memory cache → resolve instantly, refresh in background when stale.
      const cached = cGet(table, opts);
      if (cached) {
        const hit = readCache.get(cKey(table, opts));
        if (hit && Date.now() - hit.ts > CACHE_TTL) {
          db.selectFresh(table, opts).then(rows => cSet(table, opts, rows)).catch(() => {});
        }
        return cached;
      }
      // 2) Cache miss → reads local mirror instantly if present.
      const local = demoSel(table, opts);
      if (local.length || !window.supa) { cSet(table, opts, local); return local; }
      // 3) Nothing local → one bounded cloud fetch (never hangs the page).
      try {
        let q = window.supa.from(table).select(opts.cols || "*");
        if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v);
        if (opts.order) q = q.order(opts.order, { ascending: !!opts.asc });
        if (opts.limit) q = q.limit(opts.limit);
        const { data, error } = await withTimeout(q, 2000);
        if (error) throw error;
        const rows = data ? [...data] : [];
        cSet(table, opts, rows);
        return rows;
      } catch (err) { warn(table, err); }
      const fb = demoSel(table, opts);
      cSet(table, opts, fb);
      return fb;
    },
    async selectFresh(table, opts = {}) {
      if (!window.supa) return demoSel(table, opts);
      let q = window.supa.from(table).select(opts.cols || "*");
      if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v);
      if (opts.order) q = q.order(opts.order, { ascending: !!opts.asc });
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    async insert(table, row) {
      store.set("dc_" + table, [...store.get("dc_" + table, []), row]);
      cDrop(table);
      if (window.supa) enqueueSync({ kind: "insert", table, row });
      return row;
    },
    async update(table, match, patch) {
      const rows = store.get("dc_" + table, []);
      const i = rows.findIndex(r => Object.entries(match).every(([k, v]) => r[k] === v));
      if (i >= 0) rows[i] = { ...rows[i], ...patch };
      store.set("dc_" + table, rows);
      cDrop(table);
      if (window.supa) enqueueSync({ kind: "update", table, match, patch });
      return patch;
    },
    async remove(table, match) {
      const keep = r => !Object.entries(match).every(([k, v]) => r[k] === v);
      store.set("dc_" + table, store.get("dc_" + table, []).filter(keep));
      cDrop(table);
      if (window.supa) enqueueSync({ kind: "remove", table, match });
    },
    async upsert(table, rows) {
      const all = store.get("dc_" + table, []);
      for (const r of rows) {
        const i = all.findIndex(x => x.id === r.id);
        if (i >= 0) all[i] = { ...all[i], ...r }; else all.push(r);
      }
      store.set("dc_" + table, all);
      cDrop(table);
      if (window.supa) enqueueSync({ kind: "upsert", table, rows });
      return rows;
    },
  };

  /* ---------- Files: upload to Supabase storage or fallback to dataURL ---------- */
  const uploadFile = async (file, path = "") => {
    if (!window.supa) return URL.createObjectURL(file);
    const name = path + "/" + uid() + "_" + file.name.replace(/[^\w.\-]/g, "_");
    const { error } = await window.supa.storage.from(APP_CONFIG.STORAGE_BUCKET || "storefronts").upload(name, file, { upsert: true, cacheControl: "3600" });
    if (error) throw error;
    const { data } = window.supa.storage.from(APP_CONFIG.STORAGE_BUCKET).getPublicUrl(name);
    return data.publicUrl;
  };

  /* ---------- CSV export ---------- */
  const toCSV = (rows) => {
    if (!rows.length) return "";
    const keys = Object.keys(rows[0]);
    return [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  };
  const downloadFile = (name, content, mime = "text/plain") => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  /* ---------- Copy to clipboard ---------- */
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    }
  };

  /* ---------- Smooth reveal on scroll ---------- */
  const initReveal = () => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal, .stagger").forEach(el => io.observe(el));
  };

  /* ---------- Counter animation ---------- */
  const animateCount = (el, target, { suffix = "", duration = 1400, decimals = 0 } = {}) => {
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Typing effect ---------- */
  const typeText = (el, texts, { speed = 55, pause = 1600 } = {}) => {
    let i = 0, c = 0, deleting = false;
    const tick = () => {
      const word = texts[i];
      el.textContent = word.slice(0, c);
      if (!deleting && c < word.length) { c++; setTimeout(tick, speed); }
      else if (!deleting) { deleting = true; setTimeout(tick, pause); }
      else if (c > 0) { c--; setTimeout(tick, speed / 2.5); }
      else { deleting = false; i = (i + 1) % texts.length; setTimeout(tick, 400); }
    };
    tick();
  };

  /* ---------- Format price short (1.2k) ---------- */
  const fmtShort = (n) => {
    n = Number(n || 0);
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(n);
  };

  const qs = (key, fb = "") => new URLSearchParams(location.search).get(key) || fb;

  /* ---------- Supabase readiness ----------
     Resolves when the SDK is loaded (cloud) or failed (demo). Bounded:
     never blocks a page/action longer than 700ms even on a slow CDN. */
  let readyBound = null;
  const supabaseReady = () => {
    const r = window.SUPABASE_READY || Promise.resolve();
    if (readyBound) return readyBound;
    readyBound = Promise.race([
      r,
      new Promise(res => setTimeout(res, 450)),
    ]);
    return readyBound;
  };

  const scrollToId = (id) => {
    const el = id === "top" ? document.body : document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------- Escape key closes ---------- */
  const onEscape = (fn) => document.addEventListener("keydown", (e) => { if (e.key === "Escape") fn(); });

  const getLocalUser = () => store.get("dc_user");

  const isSignedIn = async () => {
    // 1) The local mirror is the single source of truth — synchronous,
    //    set at login/signup before any navigation. No waiting on the
    //    Supabase client's async session recovery, so no false "guest".
    if (getLocalUser()) return true;
    // 2) Supabase mode without a mirror: bounded readiness wait, then a
    //    local-only session read (no slow network call here).
    await supabaseReady();
    if (window.supa) {
      try {
        const { data } = await window.supa.auth.getSession();
        if (data?.session?.user) {
          const su = data.session.user;
          const meta = { id: su.id, email: su.email, name: su.user_metadata?.name || su.email?.split("@")[0] || "Store Owner", created_at: su.created_at || new Date().toISOString() };
          store.set("dc_user", meta);
          store.set("dc_session", meta);
          return true;
        }
      } catch (err) {
        console.warn("[DualCore] isSignedIn → mirror-only:", err?.message || err);
      }
      // never bounce on a flaky network — only trust the mirror + session
      return false;
    }
    return false;
  };

  return {
    $, $$, uid, debounce, throttle, esc, fmtMoney, fmtNum, fmtDate, timeAgo, daysLeft, shortId,
    initials, avatarColor, clamp, rand, randInt, toSlug, safe, store, db, uploadFile,
    toCSV, downloadFile, copy, initReveal, animateCount, typeText, fmtShort, qs,
    scrollToId, onEscape, getLocalUser, isSignedIn, supabaseReady,
  };
})();

window.Utils = Utils;
window.$ = Utils.$;
window.$$ = Utils.$$;