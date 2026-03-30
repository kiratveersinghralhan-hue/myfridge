document.addEventListener("DOMContentLoaded", async () => {
  const sb = window.supabase.createClient(
    "https://lcyvdkiovtychcfmwulv.supabase.co",
    "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM"
  );

  const sideMenu = document.getElementById("sideMenu");
  const menuOverlay = document.getElementById("menuOverlay");
  const openMenuBtn = document.getElementById("openMenuBtn");
  const closeMenuBtn = document.getElementById("closeMenuBtn");
  const menuUserEmail = document.getElementById("menuUserEmail");
  const menuLogoutBtn = document.getElementById("menuLogoutBtn");

  const accountBtn = document.getElementById("accountBtn");
  const accountMenu = document.getElementById("accountMenu");
  const accountEmail = document.getElementById("accountEmail");
  const accountLogoutBtn = document.getElementById("accountLogoutBtn");
  const topUserEmail = document.getElementById("topUserEmail");

  const statusBox = document.getElementById("statusBox");
  const activeFridgeTag = document.getElementById("activeFridgeTag");
  const fridgeCodeInput = document.getElementById("fridgeCode");
  const useFridgeBtn = document.getElementById("useFridgeBtn");
  const searchInput = document.getElementById("searchInput");
  const addBtn = document.getElementById("addBtn");
  const formBox = document.getElementById("formBox");
  const itemNameInput = document.getElementById("itemName");
  const expiryDateInput = document.getElementById("expiryDate");
  const saveBtn = document.getElementById("saveBtn");
  const itemList = document.getElementById("itemList");
  const emptyState = document.getElementById("emptyState");

  let items = [];
  let currentFridgeCode = localStorage.getItem("fridge-code") || "";
  fridgeCodeInput.value = currentFridgeCode;

  function setStatus(text, ok) {
    statusBox.textContent = text;
    statusBox.classList.remove("status-pill--ok", "status-pill--warn");
    statusBox.classList.add(ok ? "status-pill--ok" : "status-pill--warn");
  }

  function saveFridgeCode() {
    currentFridgeCode = fridgeCodeInput.value.trim();
    localStorage.setItem("fridge-code", currentFridgeCode);
    activeFridgeTag.textContent = currentFridgeCode || "No fridge selected";
    return currentFridgeCode;
  }

  function openMenu() {
    sideMenu.hidden = false;
    menuOverlay.hidden = false;
  }

  function closeMenu() {
    sideMenu.hidden = true;
    menuOverlay.hidden = true;
  }

  function getDaysLeft(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
  }

  function getFilteredItems() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = [...items];
    if (query) {
      filtered = filtered.filter(item =>
        (item.name || "").toLowerCase().includes(query)
      );
    }
    filtered.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
    return filtered;
  }

  function renderItems() {
    const filtered = getFilteredItems();
    itemList.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    filtered.forEach(item => {
      const li = document.createElement("li");
      li.className = "item-card";

      const daysLeft = getDaysLeft(item.expiry);
      if (daysLeft < 0) li.classList.add("item-card--expired");
      else if (daysLeft <= 1) li.classList.add("item-card--expiring");

      let expiryText = "";
      if (daysLeft > 1) expiryText = "Expires in " + daysLeft + " days";
      else if (daysLeft === 1) expiryText = "Expires tomorrow";
      else if (daysLeft === 0) expiryText = "Expires today";
      else expiryText = "Expired " + Math.abs(daysLeft) + " days ago";

      const left = document.createElement("div");
      left.className = "item-card__main";

      const name = document.createElement("p");
      name.className = "item-card__name";
      name.textContent = item.name;

      const meta = document.createElement("div");
      meta.className = "item-card__meta";
      meta.textContent = expiryText;

      const delBtn = document.createElement("button");
      delBtn.className = "item-card__delete";
      delBtn.textContent = "Delete";

      delBtn.addEventListener("click", async () => {
        const { error } = await sb
          .from("Items")
          .delete()
          .match({
            name: item.name,
            expiry: item.expiry,
            fridge_code: currentFridgeCode
          });

        if (error) {
          console.error("Delete error:", error);
          setStatus("Sync: OFF (delete error)", false);
          return;
        }

        await loadItems();
      });

      left.appendChild(name);
      left.appendChild(meta);
      li.appendChild(left);
      li.appendChild(delBtn);
      itemList.appendChild(li);
    });
  }

  async function ensureProfile(user) {
    const { data, error } = await sb
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return;

    if (!data) {
      await sb.from("profiles").insert([{ id: user.id, email: user.email }]);
    }
  }

  async function loadItems() {
    if (!currentFridgeCode) {
      items = [];
      renderItems();
      setStatus("Sync: enter fridge code", false);
      activeFridgeTag.textContent = "No fridge selected";
      return;
    }

    const { data, error } = await sb
      .from("Items")
      .select("*")
      .eq("fridge_code", currentFridgeCode);

    if (error) {
      console.error("Fetch error:", error);
      setStatus("Sync: OFF (fetch error)", false);
      return;
    }

    items = data || [];
    renderItems();
    setStatus("Sync: ON", true);
    activeFridgeTag.textContent = currentFridgeCode;
  }

  async function logoutAndGo() {
    const { error } = await sb.auth.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    window.location.href = "index.html";
  }

  try {
    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData.session ? sessionData.session.user : null;

    if (!user) {
      window.location.href = "index.html";
      return;
    }

    if (topUserEmail) topUserEmail.textContent = user.email;
    if (menuUserEmail) menuUserEmail.textContent = user.email;
    if (accountEmail) accountEmail.textContent = user.email;

    await ensureProfile(user);
  } catch (e) {
    console.error("Session error:", e);
    setStatus("Sync: OFF (session error)", false);
    return;
  }

  saveFridgeCode();

  openMenuBtn.addEventListener("click", openMenu);
  closeMenuBtn.addEventListener("click", closeMenu);
  menuOverlay.addEventListener("click", closeMenu);

  accountBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    accountMenu.hidden = !accountMenu.hidden;
  });

  document.addEventListener("click", (e) => {
    if (!accountMenu.hidden && !accountMenu.contains(e.target) && e.target !== accountBtn) {
      accountMenu.hidden = true;
    }
  });

  menuLogoutBtn.addEventListener("click", logoutAndGo);
  accountLogoutBtn.addEventListener("click", logoutAndGo);

  addBtn.addEventListener("click", () => {
    formBox.hidden = !formBox.hidden;
  });

  searchInput.addEventListener("input", renderItems);

  fridgeCodeInput.addEventListener("input", saveFridgeCode);
  fridgeCodeInput.addEventListener("change", saveFridgeCode);
  fridgeCodeInput.addEventListener("blur", saveFridgeCode);

  useFridgeBtn.addEventListener("click", async () => {
    saveFridgeCode();
    await loadItems();
  });

  saveBtn.addEventListener("click", async () => {
    const name = itemNameInput.value.trim();
    const expiry = expiryDateInput.value;
    const fridgeCode = saveFridgeCode();

    if (!fridgeCode) {
      alert("Please enter a family fridge code first.");
      return;
    }

    if (!name || !expiry) {
      alert("Please enter product name and expiry date.");
      return;
    }

    const { error } = await sb
      .from("Items")
      .insert([{ name, expiry, fridge_code: fridgeCode }]);

    if (error) {
      console.error("Insert error:", error);
      setStatus("Sync: OFF (insert error)", false);
      return;
    }

    itemNameInput.value = "";
    expiryDateInput.value = "";
    formBox.hidden = true;
    await loadItems();
  });

  loadItems();
});