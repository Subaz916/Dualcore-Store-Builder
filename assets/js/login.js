/* ============================================================
   DualCore — login.js
   ============================================================ */

(() => {
  const $ = Utils.$;
  const form = $("#loginForm");
  const btn = $("#liBtn");

  // if already signed in, go to dashboard
  (async () => {
    if (await Utils.isSignedIn()) location.href = "dashboard.html";
  })();

  $("#liEye")?.addEventListener("click", (e) => {
    const input = $("#liPass");
    input.type = input.type === "password" ? "text" : "password";
    e.target.textContent = input.type === "password" ? "👁" : "🙈";
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#liEmail").value.trim();
    const password = $("#liPass").value;
    const remember = $("#liRemember").checked;

    if (!email || !password) { toast("warn", "Enter your email and password."); return; }

    Components.btnLoading(btn, true);
    try {
      await Auth.signIn({ email, password, remember });
      // Ensure user profile/store/subscription exist (for users who signed up
      // with email verification required - dbNewUser wasn't called on signup)
      const user = await Auth.getUser();
      if (user) {
        const stores = await Utils.db.select("stores", { eq: { user_id: user.id }, limit: 1 });
        if (!stores.length) {
          await Auth.dbNewUser(user.id);
        }
      }
      toast("success", "Logged in! Taking you to your dashboard…");
      setTimeout(() => location.href = "dashboard.html", 250);
    } catch (err) {
      Components.btnLoading(btn, false);
      toast("error", err.message || "Login failed.");
    }
  });

  $("#liGoogle")?.addEventListener("click", () => Auth.signInOAuth("google"));
  $("#githubBtn")?.addEventListener("click", () => Auth.signInOAuth("github"));
})();