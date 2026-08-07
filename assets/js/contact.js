/* ============================================================
   DualCore — contact.js
   ============================================================ */

(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("cfName").value.trim();
    const email = document.getElementById("cfEmail").value.trim();
    const msg = document.getElementById("cfMsg").value.trim();
    const btn = document.getElementById("cfSubmit");

    if (!name || !email || !msg) {
      toast("warn", "Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast("error", "That email doesn't look right.");
      return;
    }

    try {
      Components.btnLoading(btn, true, { keepText: true });
      await new Promise(r => setTimeout(r, 700)); // simulate send
      Components.btnLoading(btn, false);
      toast("success", "Message sent! We'll reply within one business day.");
      form.reset();
    } catch (err) {
      Components.btnLoading(btn, false);
      toast("error", err.message || "Could not send your message.");
    }
  });
})();