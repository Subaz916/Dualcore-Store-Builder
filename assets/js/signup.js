/* ============================================================
   DualCore — signup.js
   ============================================================ */

(() => {
  const $ = Utils.$;
  const form = $("#signupForm");
  const btn = $("#suBtn");

  (async () => {
    if (await Utils.isSignedIn()) location.href = "dashboard.html";
  })();

  $("#suEye")?.addEventListener("click", (e) => {
    const input = $("#suPass");
    input.type = input.type === "password" ? "text" : "password";
    e.target.textContent = input.type === "password" ? "👁" : "🙈";
  });

  const pwMeter = $("#pwMeter");
  $("#suPass")?.addEventListener("input", () => {
    const v = $("#suPass").value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const colors = ["var(--light)", "#EF4444", "#F59E0B", "#84CC16", "#00C896"];
    [...pwMeter.children].forEach((bar, i) => bar.style.background = colors[i < score ? score : 0]);
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#suName").value.trim();
    const email = $("#suEmail").value.trim();
    const password = $("#suPass").value;
    const terms = $("#suTerms").checked;

    if (!terms) { toast("warn", "Please accept the terms to continue."); return; }
    if (password.length < 8) { toast("warn", "Password must be at least 8 characters."); return; }

    Components.btnLoading(btn, true);
    try {
      const { needsVerification } = await Auth.signUp({ email, password, name });
      if (needsVerification) {
        toast("info", "Check your inbox to verify your email, then log in.");
        setTimeout(() => location.href = "login.html", 700);
      } else {
        // demo mode → straight to dashboard
        const user = await Auth.getUser();
        if (user) await Auth.dbNewUser(user.id);
        toast("success", "Account created! Setting up your store…");
        setTimeout(() => location.href = "dashboard.html", 300);
      }
    } catch (err) {
      Components.btnLoading(btn, false);
      toast("error", err.message || "Sign up failed.");
    }
  });

  $("#suGoogle")?.addEventListener("click", () => Auth.signInOAuth("google"));
  $("#suGithub")?.addEventListener("click", () => Auth.signInOAuth("github"));
})();