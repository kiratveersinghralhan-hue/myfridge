
document.addEventListener("DOMContentLoaded", async () => {
  const sb = MyFridge.createClient();
  const user = await MyFridge.requireAuth(sb);
  if (!user) return;

  await MyFridge.ensureProfile(sb, user);

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
  let currentFridgeCode = MyFridge.getFridgeCode();
  let realtimeChannel = null;

  fridgeCodeInput.value = currentFridgeCode;

  menuUserEmail.textContent = user.email;
  accountEmail.textContent = user.email;
  topUserEmail.textContent = user.email;
  activeFridgeTag.textContent = currentFridgeCode || "No fridge selected";

  function setStatus(text, ok) {
    statusBox.textContent = text;
    statusBox.classList.remove("status-pill--ok", "status-pill--warn");
    statusBox.classList.add(ok ? "status-pill--ok" : "status-pill--warn");
  }

  function saveCurrentFridgeCode() {
    currentFridgeCode = fridgeCodeInput.value.trim();
    MyFridge.saveFridgeCode(currentFridgeCode);
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

  async function logoutAndGo() {
    if (realtimeChannel) {
      await sb.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    const { error } = await sb.auth.signOut();
    if (error) {
      alert(error.message || "Logout failed.");
      return;
    }
    MyFridge.goTo("index.html");
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

      const expiryInfo = MyFridge.formatExpiryText(item.expiry);
      if (expiryInfo.state === "expired") li.classList.add("item-card--expired");
      if (expiryInfo.state === "expiring") li.classList.add("item-card--expiring");

      const left = document.createElement("div");
      left.className = "item-card__main";

      const name = document.createElement("p");
      name.className = "item-card__name";
      name.textContent = item.name;

      const meta = document.createElement("div");
      meta.className = "item-card__meta";
      meta.textContent = expiryInfo.text;

      const delBtn = document.createElement("button");
      delBtn.className = "item-card__delete";
      delBtn.textContent = "Delete";

      delBtn.addEventListener("click", async () => {
        let query = sb.from("Items").delete().eq("fridge_code", currentFridgeCode);

        if (item.id) {
          query = query.eq("id", item.id);
        } else {
          query = query.eq("name", item.name).eq("expiry", item.expiry);
        }

        const { error } = await query;

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

  function setupRealtime() {
    if (realtimeChannel) {
      sb.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    if (!currentFridgeCode) return;

    realtimeChannel = sb
      .channel("items-live-" + currentFridgeCode)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Items",
          filter: "fridge_code=eq." + currentFridgeCode
        },
        async () => {
          await loadItems(false);
        }
      )
      .subscribe();
  }

  async function loadItems(resetRealtime = true) {
    if (!currentFridgeCode) {
      items = [];
      renderItems();
      setStatus("Sync: enter fridge code", false);
      activeFridgeTag.textContent = "No fridge selected";

      if (realtimeChannel) {
        await sb.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
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

    if (resetRealtime) {
      setupRealtime();
    }
  }

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
  fridgeCodeInput.addEventListener("input", saveCurrentFridgeCode);
  fridgeCodeInput.addEventListener("change", saveCurrentFridgeCode);
  fridgeCodeInput.addEventListener("blur", saveCurrentFridgeCode);

  useFridgeBtn.addEventListener("click", async () => {
    saveCurrentFridgeCode();
    await loadItems(true);
  });

  saveBtn.addEventListener("click", async () => {
    const name = itemNameInput.value.trim();
    const expiry = expiryDateInput.value;
    const fridgeCode = saveCurrentFridgeCode();

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

    await loadItems(true);
  });

  await loadItems(true);
});