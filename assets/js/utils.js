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

  /* ---------- Storage abstraction: Supabase OR demo localStorage ----------
     Robust: the Supabase branch never throws. On ANY error it logs a
     warning and falls back to the local (demo) implementation, so pages
     always render even if a table / RLS policy / column is missing.  */
  const demoSel = (table, opts = {}) => {
    let rows = store.get("dc_" + table, []);
    if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) rows = rows.filter(r => r[k] === v);
    if (opts.order) rows.sort((a, b) => opts.asc ? (a[opts.order] > b[opts.order] ? 1 : -1) : (a[opts.order] < b[opts.order] ? 1 : -1));
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return rows;
  };
  const warn = (table, err) => console.warn("[DualCore] " + table + " → demo fallback:", err?.message || err);

  const db = {
    async insert(table, row) {
      if (window.supa) {
        try {
          const { error } = await window.supa.from(table).insert(row);
          if (error) { warn(table, error); }
          else return row;
        } catch (err) { warn(table, err); }
      }
      const rows = store.get("dc_" + table, []);
      rows.push(row); store.set("dc_" + table, rows);
      return row;
    },
    async select(table, opts = {}) {
      if (window.supa) {
        try {
          let q = window.supa.from(table).select(opts.cols || "*");
          if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v);
          if (opts.order) q = q.order(opts.order, { ascending: !!opts.asc });
          if (opts.limit) q = q.limit(opts.limit);
          const { data, error } = await q;
          if (error) throw error;
          if (data) return data;
        } catch (err) { warn(table, err); }
      }
      return demoSel(table, opts);
    },
    async update(table, match, patch) {
      if (window.supa) {
        try {
          const { error } = await window.supa.from(table).update(patch).match(match);
          if (!error) return patch;
          warn(table, error);
        } catch (err) { warn(table, err); }
      }
      const rows = store.get("dc_" + table, []);
      const i = rows.findIndex(r => Object.entries(match).every(([k, v]) => r[k] === v));
      if (i >= 0) rows[i] = { ...rows[i], ...patch }; store.set("dc_" + table, rows);
      return patch;
    },
    async remove(table, match) {
      if (window.supa) {
        try {
          const { error } = await window.supa.from(table).delete().match(match);
          if (!error) return;
          else warn(table, error);
        } catch (err) { warn(table, err); }
      }
      store.set("dc_" + table, store.get("dc_" + table, []).filter(r => !Object.entries(match).every(([k, v]) => r[k] === v)));
    },
    async upsert(table, rows) {
      if (window.supa) {
        try {
          const { error } = await window.supa.from(table).upsert(rows);
          if (!error) return rows;
          else warn(table, error);
        } catch (err) { warn(table, err); }
      }
      const all = store.get("dc_" + table, []);
      for (const r of rows) {
        const i = all.findIndex(x => x.id === r.id);
        if (i >= 0) all[i] = { ...all[i], ...r }; else all.push(r);
      }
      store.set("dc_" + table, all);
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

  const scrollToId = (id) => {
    const el = id === "top" ? document.body : document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------- Escape key closes ---------- */
  const onEscape = (fn) => document.addEventListener("keydown", (e) => { if (e.key === "Escape") fn(); });

  const getLocalUser = () => store.get("dc_user");

  const isSignedIn = async () => {
    if (window.supa) {
      try {
        // getSession() reads the persisted session from localStorage —
        // NO network call, so it never fails on flaky networks.
        const { data } = await window.supa.auth.getSession();
        if (data?.session?.user) return true;
      } catch (err) {
        console.warn("[DualCore] isSignedIn → demo check:", err?.message || err);
      }
      return !!getLocalUser();
    }
    return !!getLocalUser();
  };

  return {
    $, $$, uid, debounce, throttle, esc, fmtMoney, fmtNum, fmtDate, timeAgo, daysLeft, shortId,
    initials, avatarColor, clamp, rand, randInt, toSlug, safe, store, db, uploadFile,
    toCSV, downloadFile, copy, initReveal, animateCount, typeText, fmtShort, qs,
    scrollToId, onEscape, getLocalUser, isSignedIn,
  };
})();

window.Utils = Utils;
window.$ = Utils.$;
window.$$ = Utils.$$;