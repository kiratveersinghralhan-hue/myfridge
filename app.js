// MyFridge FINAL (Fridge system + Supabase + Sync)

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

  // ---------- LOCAL STORAGE ----------
  let items = JSON.parse(localStorage.getItem("myfridge-items")) || [];

  function saveToStorage() {
    localStorage.setItem("myfridge-items", JSON.stringify(items));
  }

  // ---------- FRIDGE CODE SAVE ----------
  const savedFridge = localStorage.getItem("fridge-code");
  if (savedFridge) {
    fridgeCodeInput.value = savedFridge;
  }

  function saveFridgeCode() {
    localStorage.setItem("fridge-code", fridgeCodeInput.value.trim());
  }

  fridgeCodeInput.addEventListener("input", saveFridgeCode);
  fridgeCodeInput.addEventListener("change", saveFridgeCode);

  // ---------- HELPERS ----------
  function getDaysLeft(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0,0,0,0);
    expiry.setHours(0,0,0,0);
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
  if (window.supabase) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  renderItems();

  // ---------- LOAD FROM SUPABASE ----------
  async function loadItems() {
    if (!sb) {
      setStatus("Sync: OFF", false);
      return;
    }

    const fridgeCode = fridgeCodeInput.value.trim() || "default-fridge";

    const { data, error } = await sb
      .from("Items")
      .select("*")
      .eq("fridge_code", fridgeCode);

    if (error) {
      console.error(error);
      setStatus("Sync: OFF (fetch error)", false);
      return;
    }

    setStatus("Sync: ON", true);

    items = data.map(d => ({
      name: d.name,
      expiry: d.expiry
    }));

    saveToStorage();
    renderItems();
  }

  // ---------- SAVE ITEM ----------
  saveBtn.addEventListener("click", async () => {

    const name = itemNameInput.value.trim();
    const expiry = expiryDateInput.value;

    if (!name || !expiry) {
      alert("Enter name and expiry");
      return;
    }

    saveFridgeCode();

    const fridgeCode = fridgeCodeInput.value.trim() || "default-fridge";

    items.push({ name, expiry });
    saveToStorage();
    renderItems();

    if (sb) {
      const { error } = await sb.from("Items").insert([
        { name, expiry, fridge_code: fridgeCode }
      ]);

      if (error) {
        console.error(error);
        setStatus("Sync: OFF (insert error)", false);
      } else {
        setStatus("Sync: ON", true);
      }
    }

    itemNameInput.value = "";
    expiryDateInput.value = "";
  });

  // Reload when fridge code changes
  fridgeCodeInput.addEventListener("change", loadItems);

  loadItems();

});
