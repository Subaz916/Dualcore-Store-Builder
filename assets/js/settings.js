/* ============================================================
   DualCore — settings.js
   ============================================================ */

(async () => {
  await requireAuth();
  const user = await Auth.getUser();
  if (!user) return;

  renderSidebar("settings");
  renderTopbar("Settings", "Tune your workspace");

  const shop = Utils.store.get("dc_shop") || {};

  /* --- nav --- */
  const nav = $("#settingsNav");
  nav.querySelectorAll("a").forEach(a => {
    a.onclick = () => {
      nav.querySelectorAll("a").forEach(x => x.classList.remove("active"));
      a.classList.add("active");
      document.querySelectorAll(".settings-section").forEach(s => s.classList.remove("active"));
      document.getElementById("sec-" + a.dataset.section).classList.add("active");
    };
  });

  /* --- load store data --- */
  const load = () => {
    $("#st-name").value = shop.name || "";
    $("#st-tagline").value = shop.tagline || "";
    $("#st-slug").value = shop.slug || Utils.toSlug(shop.name || "mystore");
    $("#st-announce").value = shop.announcement || "";
    $("#pf-name").value = user.name || "";
    $("#pf-email").value = user.email || "";
    $("#pf-avatar").textContent = Utils.initials(user.name || "U");
    $("#pf-avatar").style.background = Utils.avatarColor(user.name || "U");
    $("#seo-title").value = shop.seo_title || "";
    $("#seo-desc").value = shop.seo_desc || "";
    $("#seo-keywords").value = (shop.seo_keywords || []).join(", ");
    $("#br-color").value = shop.theme_color || "#5C6EFF";
    $("#br-font").value = shop.theme_font || "Inter";
    updateSeoCounts();
  };

  const updateSeoCounts = () => {
    $("#seo-title-count").textContent = $("#seo-title").value.length + " / 60";
    $("#seo-desc-count").textContent = $("#seo-desc").value.length + " / 160";
  };
  $("#seo-title").addEventListener("input", updateSeoCounts);
  $("#seo-desc").addEventListener("input", updateSeoCounts);

  const save = async (patch, msg) => {
    Object.assign(shop, patch);
    Utils.store.set("dc_shop", shop);
    if (shop.id) await Utils.db.update("stores", { id: shop.id }, patch).catch(() => {});
    toast("success", msg);
  };

  $("#saveStore").onclick = () => save({
    name: $("#st-name").value.trim() || "My Store",
    tagline: $("#st-tagline").value.trim(),
    slug: Utils.toSlug($("#st-slug").value) || shop.slug,
    announcement: $("#st-announce").value.trim(),
  }, "Store settings saved");

  $("#saveProfile").onclick = async () => {
    const name = $("#pf-name").value.trim();
    if (!name) return toast("warn", "Name can't be empty");
    user.name = name;
    Utils.store.set("dc_user", user);
    await Utils.db.upsert("profiles", [{ id: user.id, name }]).catch(() => {});
    toast("success", "Profile updated");
  };

  $("#saveSeo").onclick = () => {
    save({
      seo_title: $("#seo-title").value.trim(),
      seo_desc: $("#seo-desc").value.trim(),
      seo_keywords: $("#seo-keywords").value.split(",").map(s => s.trim()).filter(Boolean),
    }, "SEO settings saved");
  };

  $("#saveBranding").onclick = () => {
    save({ theme_color: $("#br-color").value, theme_font: $("#br-font").value }, "Branding saved");
  };

  $("#changePassword").onclick = async () => {
    const p1 = $("#sec-password").value, p2 = $("#sec-password2").value;
    if (p1.length < 8) return toast("warn", "Password must be at least 8 characters");
    if (p1 !== p2) return toast("error", "Passwords don't match");
    await Auth.updatePassword(p1);
    $("#sec-password").value = $("#sec-password2").value = "";
    toast("success", "Password changed");
  };

  $("#signOutAll").onclick = async () => {
    const ok = await Components.confirmDialog({ title: "Sign out everywhere?", message: "You'll be logged out on all devices and need to sign in again.", confirmText: "Sign out" });
    if (ok) { await Auth.signOut(); location.href = "login.html"; }
  };

  load();
})();