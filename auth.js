document.addEventListener("DOMContentLoaded", async () => {
  const sb = window.supabase.createClient("https://lcyvdkiovtychcfmwulv.supabase.co", "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM");

  const authForm = document.getElementById("authForm");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  const authHint = document.getElementById("authHint");
  const authMessage = document.getElementById("authMessage");

  let mode = "login";

  function setMessage(text, ok) {
    authMessage.hidden = false;
    authMessage.textContent = text;
    authMessage.classList.toggle("message-box--ok", !!ok);
  }

  function clearMessage() {
    authMessage.hidden = true;
    authMessage.textContent = "";
    authMessage.classList.remove("message-box--ok");
  }

  function setMode(nextMode) {
    mode = nextMode;
    clearMessage();
    if (mode === "login") {
      authSubmitBtn.textContent = "Log In";
      tabLogin.classList.add("switch-btn--active");
      tabSignup.classList.remove("switch-btn--active");
      authHint.textContent = "No account yet? Switch to Sign Up.";
    } else {
      authSubmitBtn.textContent = "Sign Up";
      tabSignup.classList.add("switch-btn--active");
      tabLogin.classList.remove("switch-btn--active");
      authHint.textContent = "Already have an account? Switch to Log In.";
    }
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabSignup.addEventListener("click", () => setMode("signup"));

  const { data: sessionData } = await sb.auth.getSession();
  if (sessionData.session) {
    window.location.href = "dashboard.html";
    return;
  }

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
      setMessage("Please enter email and password.", false);
      return;
    }

    clearMessage();

    if (mode === "signup") {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message, false);
        return;
      }
      setMessage("Account created successfully. You can log in now.", true);
      setMode("login");
      return;
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message, false);
      return;
    }

    if (data.user) {
      window.location.href = "dashboard.html";
    }
  });
});
