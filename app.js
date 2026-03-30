document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  const formBox = document.getElementById("formBox");
  const saveBtn = document.getElementById("saveBtn");
  const useFridgeBtn = document.getElementById("useFridgeBtn");

  const fridgeCodeInput = document.getElementById("fridgeCode");
  const searchInput = document.getElementById("searchInput");
  const itemNameInput = document.getElementById("itemName");
  const expiryDateInput = document.getElementById("expiryDate");
  const itemList = document.getElementById("itemList");
  const emptyState = document.getElementById("emptyState");
  const statusBox = document.getElementById("statusBox");

  const SUPABASE_URL = "https://lcyvdkiovtychcfmwulv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM";

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let items = [];
  let currentFridgeCode = localStorage.getItem("fridge-code") || "";
  fridgeCodeInput.value = currentFridgeCode;

  function setStatus(text, ok) {
    statusBox.textContent = text;
    statusBox.classList.remove("status--ok", "status--warn");
    statusBox.classList.add(ok ? "status--ok" : "status--warn");
  }

  function getDaysLeft(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diff = expiry - today;
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  function saveFridgeCode() {
    currentFridgeCode = fridgeCodeInput.value.trim();
    localStorage.setItem("fridge-code", currentFridgeCode);
    return currentFridgeCode;
  }

  function getFilteredItems() {
    const query = searchInput.value.trim().toLowerCase();
    let filtered = [...items];

    if (query) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
    return filtered;
  }

  function renderItems() {
    const filtered = getFilteredItems();
    itemList.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    filtered.forEach(item => {
      const li = document.createElement("li");
      li.className = "item-card";

      const daysLeft = getDaysLeft(item.expiry);

      if (daysLeft < 0) {
        li.classList.add("item-card--expired");
      } else if (daysLeft <= 1) {
        li.classList.add("item-card--expiring");
      }

      let expiryText = "";
      if (daysLeft > 1) {
        expiryText = "Expires in " + daysLeft + " days";
      } else if (daysLeft === 1) {
        expiryText = "Expires tomorrow";
      } else if (daysLeft === 0) {
        expiryText = "Expires today";
      } else {
        expiryText = "Expired " + Math.abs(daysLeft) + " days ago";
      }

      const left = document.createElement("div");
      left.className = "item-card__main";

      const name = document.createElement("p");
      name.className = "item-card__name";
      name.textContent = item.name;

      const meta = document.createElement("div");
      meta.className = "item-card__meta";
      meta.textContent = expiryText;

      left.appendChild(name);
      left.appendChild(meta);

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

      li.appendChild(left);
      li.appendChild(delBtn);
      itemList.appendChild(li);
    });
  }

  async function loadItems() {
    if (!currentFridgeCode) {
      items = [];
      renderItems();
      setStatus("Sync: enter fridge code", false);
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
  }

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
      alert("Please enter a fridge code first.");
      return;
    }

    if (!name || !expiry) {
      alert("Please enter food name and expiry date.");
      return;
    }

    const { error } = await sb
      .from("Items")
      .insert([
        {
          name: name,
          expiry: expiry,
          fridge_code: fridgeCode
        }
      ]);

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
