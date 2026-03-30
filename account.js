document.addEventListener("DOMContentLoaded", async () => {
  const sb = window.supabase.createClient("https://lcyvdkiovtychcfmwulv.supabase.co", "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM");
  const profileEmail = document.getElementById("profileEmail");
  const profileId = document.getElementById("profileId");
  const profileFridgeCode = document.getElementById("profileFridgeCode");
  const logoutBtn = document.getElementById("logoutBtn");

  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData.session ? sessionData.session.user : null;

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  profileEmail.textContent = user.email;
  profileId.textContent = user.id;
  profileFridgeCode.textContent = localStorage.getItem("fridge-code") || "None";

  logoutBtn.addEventListener("click", async () => {
    const { error } = await sb.auth.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    window.location.href = "index.html";
  });
});
