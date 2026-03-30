// MyFridge FINAL (Fridge system + reliable fridge code save + Supabase sync)

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  const formBox = document.getElementById("formBox");
  const saveBtn = document.getElementById("saveBtn");

  const itemNameInput = document.getElementById("itemName");
  const expiryDateInput = document.getElementById("expiryDate");
  const itemList = document.getElementById("itemList");
  const searchInput = document.getElementById("searchInput");
  const fridgeCodeInput = document.getElementById("fridgeCode");

  // ---------- STATUS ----------
  const status = document.createElement("div");
  status.style.fontSize = "13px";
  status.style.margin = "6px 0 12px 0";
  status.style.padding = "8px 10px";
  status.style.borderRadius = "10px";
  status.style.background = "#f0f0f0";
  status.textContent = "Sync: checking...";
  document.querySelector("main.container").prepend(status);

  function setStatus(text, ok) {
    status.textContent = text;
    status.style.background = ok ? "#e7f7ee" : "#fff3cd";
  }

  // ---------- LOCAL ITEMS ----------
  let items = JSON.parse(localStorage.getItem("myfridge-items")) || [];

  function saveToStorage() {
    localStorage.setItem("myfridge-items", JSON.stringify(items));
  }

  // ---------- FRIDGE CODE ----------
  const savedFridgeCode = localStorage.getItem("fridge-code") || "";
  fridgeCodeInput.value = savedFridgeCode;

  function saveFridgeCode() {
    const code = fridgeCodeInput.value.trim();
    localStorage.setItem("fridge-code", code);
    return code;
  }

  fridgeCodeInput.addEventListener("input", saveFridgeCode);
  fridgeCodeInput.addEventListener("change", saveFridgeCode);
  fridgeCodeInput.addEventListener("blur", saveFridgeCode);

  // ---------- HELPERS ----------
  function getDaysLeft(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
  }

  function renderItems(filterText = "") {
    itemList.innerHTML = "";

    let filtered = items.filter(item =>
      item.name.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

    filtered.forEach(item => {
      const li = document.createElement("li");
      const span = document.createElement("span");

      const daysLeft = getDaysLeft(item.expiry);

      let text = item.name + " – ";
      if (daysLeft > 1) text += "expires in " + daysLeft + " days";
      else if (daysLeft === 1) text += "expires tomorrow";
      else if (daysLeft === 0) text += "expires today";
      else text += "expired " + Math.abs(daysLeft) + " days ago";

      span.textContent = text;

      if (daysLeft < 0) li.style.background = "#ffe5e5";
      else if (daysLeft <= 1) li.style.background = "#fff3cd";

      li.appendChild(span);
      itemList.appendChild(li);
    });
  }

  // ---------- UI ----------
  addBtn.addEventListener("click", () => {
    formBox.style.display = formBox.style.display === "none" ? "block" : "none";
  });

  searchInput.addEventListener("input", () => {
    renderItems(searchInput.value);
  });

  // ---------- SUPABASE ----------
  const SUPABASE_URL = "https://lcyvdkiovtychcfmwulv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM";

  let sb = null;
  try {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (e) {
    sb = null;
  }

  // ---------- LOAD ITEMS ----------
  async function loadItems() {
    if (!sb) {
      setStatus("Sync: OFF (Supabase not loaded)", false);
      renderItems(searchInput.value);
      return;
    }

    const fridgeCode = saveFridgeCode() || "default-fridge";

    const { data, error } = await sb
      .from("Items")
      .select("*")
      .eq("fridge_code", fridgeCode);

    if (error) {
      console.error("Supabase fetch error:", error);
      setStatus("Sync: OFF (fetch error: " + (error.message || "") + ")", false);
      renderItems(searchInput.value);
      return;
    }

    setStatus("Sync: ON", true);

    items = (data || []).map(d => ({
      name: d.name,
      expiry: d.expiry
    }));

    saveToStorage();
    renderItems(searchInput.value);
  }

  // ---------- SAVE ITEM ----------
  saveBtn.addEventListener("click", async () => {
    const name = itemNameInput.value.trim();
    const expiry = expiryDateInput.value;

    if (!name || !expiry) {
      alert("Enter name and expiry");
      return;
    }

    const fridgeCode = saveFridgeCode() || "default-fridge";

    // local first
    items.push({ name, expiry });
    saveToStorage();
    renderItems(searchInput.value);

    if (sb) {
      const { error } = await sb.from("Items").insert([
        {
          name: name,
          expiry: expiry,
          fridge_code: fridgeCode
        }
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        setStatus("Sync: OFF (insert error: " + (error.message || "") + ")", false);
      } else {
        setStatus("Sync: ON", true);
      }
    } else {
      setStatus("Sync: OFF (Supabase not loaded)", false);
    }

    itemNameInput.value = "";
    expiryDateInput.value = "";
  });

  // reload when fridge code changes
  fridgeCodeInput.addEventListener("change", loadItems);
  fridgeCodeInput.addEventListener("blur", loadItems);

  // initial paint from local, then cloud
  renderItems(searchInput.value);
  loadItems();
});
