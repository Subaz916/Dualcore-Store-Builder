/* ============================================================
   DualCore — auth.js  (Supabase auth OR demo-local fallback)
   ============================================================ */

const Auth = (() => {
  const { db, store, isSignedIn } = Utils;

  const toUser = (u) => u ? {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || u.email?.split("@")[0] || "Store Owner",
    created_at: u.created_at || new Date().toISOString(),
  } : null;

  const mirrorUser = (u) => {
    const meta = toUser(u);
    store.set("dc_user", meta);
    store.set("dc_session", meta);
  };

  /* ---------- Session persistence (keeps local mirror in sync) ----------
     NOTE: never remove the mirror on transient events (a fresh page load
     can fire SIGNED_OUT while the SDK recovers the session) — the mirror
     is only cleared by an explicit signOut(). */
  const persist = () => {
    if (!window.supa || !window.supa.auth.onAuthStateChange) return;
    window.supa.auth.onAuthStateChange((event, session) => {
      if (session?.user) mirrorUser(session.user);
    });
  };

  /* ---------- Restore session (local-first, no network dependency) ---------- */
  const restoreSession = async () => {
    if (!window.supa) return;
    try {
      const { data } = await window.supa.auth.getSession();
      if (data?.session?.user) mirrorUser(data.session.user);
    } catch { /* fall through — mirror/local user saved earlier */ }
    // Fire onAuthStateChange AFTER initial load so events keep mirror fresh
    persist();
  };

  const getUser = async () => {
    if (window.supa) {
      // 1) mirror first (instant, local) — never bounces the user
      const mirror = store.get("dc_session") || store.get("dc_user");
      if (mirror?.id) return mirror;
      // 2) ask Supabase (network) only when no mirror exists
      try {
        const { data } = await window.supa.auth.getSession();
        if (data?.session?.user) { mirrorUser(data.session.user); return toUser(data.session.user); }
        const { data: ud, error } = await window.supa.auth.getUser();
        if (!error && ud?.user) { mirrorUser(ud.user); return toUser(ud.user); }
      } catch { /* demo fallback below */ }
      return Utils.getLocalUser();
    }
    return Utils.getLocalUser();
  };

  const getSession = async () => {
    if (window.supa) {
      try { const { data } = await window.supa.auth.getSession(); return data.session; }
      catch { return null; }
    }
    return Utils.getLocalUser() ? { user: Utils.getLocalUser(), access_token: "local" } : null;
  };

  /* ---------- Sign up ---------- */
  const signUp = async ({ email, password, name }) => {
    if (window.supa) {
      const { data, error } = await window.supa.auth.signUp({
        email, password,
        options: { data: { name }, emailRedirectTo: location.origin + "/dashboard.html" },
      });
      if (error) throw new Error(error.message);
      if (data.session?.user) mirrorUser(data.session.user);
      return { data, needsVerification: !(data.session || data.user?.email_confirmed_at) };
    }
    // Demo mode
    const user = { id: Utils.uid(), email, name, created_at: new Date().toISOString() };
    const users = Utils.store.get("dc_users", []);
    if (users.some(u => u.email === email)) throw new Error("An account with this email already exists.");
    users.push(user); Utils.store.set("dc_users", users);
    Utils.store.set("dc_user", user);
    await dbNewUser(user.id);
    return { data: { user }, needsVerification: false };
  };

  /* ---------- Login ---------- */
  const signIn = async ({ email, password, remember }) => {
    Utils.store.set("dc_remember", remember ?? true);
    if (window.supa) {
      const { data, error } = await window.supa.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (data.session?.user) mirrorUser(data.session.user);
      return data.user;
    }
    const users = Utils.store.get("dc_users", []);
    const user = users.find(u => u.email === email && u.password_hash_broken === undefined);
    // demo: no real passwords stored — accept if account exists
    if (!user) throw new Error("Invalid login credentials.");
    Utils.store.set("dc_user", user);
    return user;
  };

  /* ---------- Social login (Google + GitHub) ---------- */
  const signInOAuth = (provider) => {
    if (window.supa) {
      window.supa.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + "/dashboard.html" } });
      return;
    }
    Utils.toast("info", `${provider} login needs Supabase keys — enabling demo account instead.`);
    const email = Utils.toSlug(provider) + "-" + Date.now() + "@demo.dualcore.shop";
    Utils.store.set("dc_user", { id: Utils.uid(), email, name: `${provider} User`, created_at: new Date().toISOString() });
    setTimeout(() => location.href = "dashboard.html", 800);
  };

  /* ---------- Forgot password ---------- */
  const resetPassword = async (email) => {
    if (window.supa) {
      const { error } = await window.supa.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/forgot-password.html" });
      if (error) throw new Error(error.message);
      return true;
    }
    // demo: pretend we sent it
    return new Promise(res => setTimeout(() => res(true), 700));
  };

  /* ---------- Update password ---------- */
  const updatePassword = async (newPassword) => {
    if (window.supa) {
      const { error } = await window.supa.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      return true;
    }
    return true;
  };

  /* ---------- Send magic link ---------- */
  const sendMagicLink = async (email) => {
    if (window.supa) {
      const { error } = await window.supa.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + "/dashboard.html" } });
      if (error) throw new Error(error.message);
      return true;
    }
    return new Promise((res) => setTimeout(() => res(true), 700));
  };

  /* ---------- Sign out ---------- */
  const signOut = async () => {
    if (window.supa) { try { await window.supa.auth.signOut(); } catch (e) { console.error(e); } }
    Utils.store.remove("dc_user");
    Utils.store.remove("dc_session");
    Utils.store.remove("dc_shop");
  };

  /* ---------- Bootstrap a new user (store, subscriptions …) ---------- */
  const dbNewUser = async (userId) => {
    const now = new Date();
    const end = new Date(now.getTime() + APP_CONFIG.MAX_TRIAL_DAYS * 864e5).toISOString();

    const profile = { id: userId || Utils.uid(), name: "Store Owner", avatar: null, created_at: now.toISOString() };
    await db.upsert("profiles", [profile]);

    await db.insert("subscriptions", {
      id: Utils.uid(), user_id: userId, plan: "free", status: "active",
      start_date: now.toISOString(), end_date: end, renewal: "none", payment_method: "none",
      created_at: now.toISOString(),
    });

    const name = (Utils.store.get("dc_user") || {}).name?.split(" ")[0] || "My Shop";

    const shop = {
      id: Utils.uid(), user_id: userId, name, slug: Utils.toSlug(name) + "-" + Date.now().toString(36).slice(-4),
      theme: "minimal", status: "draft", plan: "free",
      created_at: now.toISOString(), updated_at: now.toISOString(),
    };
    await db.insert("stores", [shop]);
    return shop;
  };

  /* Alias used by seed helpers */
  async function newUser(id) { return dbNewUser(id); }

  /* ---------- Subscription helpers ---------- */
  const getSubscription = async (userId) => {
    const list = await db.select("subscriptions", { eq: { user_id: userId }, order: "created_at", asc: false, limit: 1 });
    return list[0] || { plan: "free", status: "active", end_date: null };
  };

  const planPaid = (sub) => sub && (sub.plan === "basic" || sub.plan === "premium") && sub.status === "active";
  const trialValid = (sub) => sub && sub.plan === "free" && sub.end_date && Utils.daysLeft(sub.end_date) > 0;

  const canPublish = (sub) => planPaid(sub);
  const canUseCheckout = (sub) => planPaid(sub);

  return {
    getUser, getSession, signIn, signUp, signInOAuth,
    resetPassword, updatePassword, sendMagicLink, signOut,
    dbNewUser, newUser, getSubscription, planPaid, trialValid, canPublish, canUseCheckout,
    restoreSession,
  };
})();

window.Auth = Auth;

/* ---------- Bootstrap: restore session into the local mirror ---------- */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Auth.restoreSession());
} else {
  Auth.restoreSession();
}