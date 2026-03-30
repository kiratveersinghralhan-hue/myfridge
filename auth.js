
document.addEventListener("DOMContentLoaded", async () => {
  const sb = MyFridge.createClient();

  const authForm = document.getElementById("authForm");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  const authHint = document.getElementById("authHint");
  const authMessage = document.getElementById("authMessage");

  let mode = "login";

  function setMode(nextMode) {
    mode = nextMode;
    MyFridge.clearMessage(authMessage);

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

  const existingUser = await MyFridge.getUser(sb);
  if (existingUser) {
    MyFridge.goTo("dashboard.html");
    return;
  }

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value.trim();

    if (!email || !password) {
      MyFridge.setMessage(authMessage, "Please enter email and password.");
      return;
    }

    MyFridge.clearMessage(authMessage);

    if (mode === "signup") {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) {
        MyFridge.setMessage(authMessage, error.message || "Could not create account.");
        return;
      }
      MyFridge.setMessage(authMessage, "Account created successfully. You can log in now.", true);
      setMode("login");
      return;
    }

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      MyFridge.setMessage(authMessage, error.message || "Login failed.");
      return;
    }

    if (data.user) {
      await MyFridge.ensureProfile(sb, data.user);
      MyFridge.goTo("dashboard.html");
    }
  });
});
