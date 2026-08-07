/* ============================================================
   DualCore — forgot-password.js
   ============================================================ */

(() => {
  const $ = Utils.$;
  const form = $("#fpForm");
  const btn = $("#fpBtn");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#fpEmail").value.trim();
    if (!email) { toast("warn", "Enter your email address."); return; }

    Components.btnLoading(btn, true);
    try {
      await Auth.resetPassword(email);
      Components.btnLoading(btn, false);
      $("#fpSentTo").textContent = email;
      $("#fpEmailStep").classList.add("hidden");
      $("#fpDoneStep").classList.remove("hidden");
    } catch (err) {
      Components.btnLoading(btn, false);
      toast("error", err.message || "Something went wrong.");
    }
  });
})();