
document.addEventListener("DOMContentLoaded", async () => {
  const sb = MyFridge.createClient();
  const user = await MyFridge.requireAuth(sb);
  if (!user) return;

  const profileEmail = document.getElementById("profileEmail");
  const profileId = document.getElementById("profileId");
  const profileFridgeCode = document.getElementById("profileFridgeCode");
  const logoutBtn = document.getElementById("logoutBtn");

  profileEmail.textContent = user.email;
  profileId.textContent = user.id;
  profileFridgeCode.textContent = MyFridge.getFridgeCode() || "None";

  logoutBtn.addEventListener("click", async () => {
    const { error } = await sb.auth.signOut();
    if (error) {
      alert(error.message || "Logout failed.");
      return;
    }
    MyFridge.goTo("index.html");
  });
});
