/* ============================================================
   DualCore — auth.js  (Supabase auth OR demo-local fallback)
   ============================================================ */

const Auth = (() => {
  const { db, store, isSignedIn } = Utils;

  /* ---------- Session persistence (Google/remember-me friendly) ---------- */
  const persist = () => {
    if (!window.supa) return;
    const enabled = store.get("dc_remember");
    if (enabled && window.supa.auth.onAuthStateChange) {
      window.supa.auth.onAuthStateChange(() => {});
    }
  };

  const getUser = async () => {
    if (window.supa) {
      try {
        const { data, error } = await window.supa.auth.getUser();
        if (error || !data?.user) { Utils.store.remove("dc_user"); return null; }
        const u = data.user;
        const userMeta = { email: u.email, name: u.user_metadata?.name || u.email?.split("@")[0] || "User", id: u.id };
        return userMeta;
      } catch { return null; }
    }
    return Utils.getLocalUser();
  };

  const getSession = async () => {
    if (window.supa) { const { data } = await window.supa.auth.getSession(); return data.session; }
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
      return { data, needsVerification: !(data.session || data.user?.email_confirmed_at) };
    }
    // Demo mode
    const user = { id: Utils.uid(), email, name, created_at: new Date().toISOString() };
    const users = Utils.store.get("dc_users", []);
    if (users.some(u => u.email === email)) throw new Error("An account with this email already exists.");
    users.push(user); Utils.store.set("dc_users", users);
    Utils.store.set("dc_user", user);
    await seedNewUser(user.id);
    return { data: { user }, needsVerification: false };
  };

  /* ---------- Login ---------- */
  const signIn = async ({ email, password, remember }) => {
    Utils.store.set("dc_remember", remember ?? true);
    if (window.supa) {
      const { data, error } = await window.supa.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
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
    if (window.supa) { const { error } = await window.supa.auth.signOut(); if (error) console.error(error); }
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
  };
})();

window.Auth = Auth;