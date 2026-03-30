
window.MyFridge = (() => {
  const SUPABASE_URL = "https://lcyvdkiovtychcfmwulv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM";

  function createClient() {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  function getBasePath() {
    const path = window.location.pathname;
    const parts = path.split("/");
    parts.pop();
    return parts.join("/") || "";
  }

  function buildUrl(page) {
    return window.location.origin + getBasePath() + "/" + page;
  }

  function goTo(page, version = "301") {
    window.location.href = buildUrl(page) + "?v=" + encodeURIComponent(version);
  }

  async function getSession(sb) {
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  async function getUser(sb) {
    const session = await getSession(sb);
    return session ? session.user : null;
  }

  async function requireAuth(sb) {
    const user = await getUser(sb);
    if (!user) {
      goTo("index.html");
      return null;
    }
    return user;
  }

  async function ensureProfile(sb, user) {
    try {
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) return;

      if (!data) {
        await sb.from("profiles").insert([{ id: user.id, email: user.email }]);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  function setMessage(el, text, ok = false) {
    if (!el) return;
    el.hidden = false;
    el.textContent = text;
    el.classList.toggle("message-box--ok", !!ok);
  }

  function clearMessage(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = "";
    el.classList.remove("message-box--ok");
  }

  function saveFridgeCode(code) {
    localStorage.setItem("fridge-code", code || "");
  }

  function getFridgeCode() {
    return localStorage.getItem("fridge-code") || "";
  }

  function formatExpiryText(expiry) {
    const today = new Date();
    const exp = new Date(expiry);
    today.setHours(0,0,0,0);
    exp.setHours(0,0,0,0);
    const daysLeft = Math.round((exp - today) / (1000 * 60 * 60 * 24));
    if (daysLeft > 1) return { text: "Expires in " + daysLeft + " days", state: "normal" };
    if (daysLeft === 1) return { text: "Expires tomorrow", state: "expiring" };
    if (daysLeft === 0) return { text: "Expires today", state: "expiring" };
    return { text: "Expired " + Math.abs(daysLeft) + " days ago", state: "expired" };
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(buildUrl("sw.js")).catch(() => {});
    });
  }

  return {
    createClient, buildUrl, goTo, getSession, getUser, requireAuth, ensureProfile,
    setMessage, clearMessage, saveFridgeCode, getFridgeCode, formatExpiryText
  };
})();
