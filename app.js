// MyFridge (GitHub Pages-safe + Sync Status)

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  const formBox = document.getElementById("formBox");
  const saveBtn = document.getElementById("saveBtn");

  const itemNameInput = document.getElementById("itemName");
  const expiryDateInput = document.getElementById("expiryDate");
  const itemList = document.getElementById("itemList");
  const searchInput = document.getElementById("searchInput");

  // ----- Status banner (visible on phone) -----
  const status = document.createElement("div");
  status.style.fontSize = "13px";
  status.style.margin = "6px 0 12px 0";
  status.style.padding = "8px 10px";
  status.style.borderRadius = "10px";
  status.style.background = "#f0f0f0";
  status.textContent = "Sync: checking...";
  const container = document.querySelector("main.container");
  container.insertBefore(status, container.firstChild);

  function setStatus(text, ok) {
    status.textContent = text;
    status.style.background = ok ? "#e7f7ee" : "#fff3cd";
  }

  // ----- Local (offline) -----
  let items = JSON.parse(localStorage.getItem("myfridge-items")) || [];

  function saveToStorage() {
    localStorage.setItem("myfridge-items", JSON.stringify(items));
  }

  function getDaysLeft(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    const diff = expiry - today;
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  function renderItems(filterText = "") {
    itemList.innerHTML = "";

    let filtered = items.filter(i =>
      i.name.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));

    filtered.forEach((item) => {
      const realIndex = items.indexOf(item);

      const li = document.createElement("li");
      const leftPart = document.createElement("span");
      const daysLeft = getDaysLeft(item.expiry);

      let text = item.name + " – ";
      if (daysLeft > 1) text += "expires in " + daysLeft + " days";
      else if (daysLeft === 1) text += "expires tomorrow";
      else if (daysLeft === 0) text += "expires today";
      else text += "expired " + Math.abs(daysLeft) + " days ago";

      leftPart.textContent = text;

      if (daysLeft < 0) li.style.background = "#ffe5e5";
      else if (daysLeft <= 1) li.style.background = "#fff3cd";

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";

      delBtn.addEventListener("click", async () => {
        const deletedItem = items[realIndex];

        items.splice(realIndex, 1);
        saveToStorage();
        renderItems(searchInput.value);

        if (sb) {
          const { error } = await sb.from("Items").delete().match({
            name: deletedItem.name,
            expiry: deletedItem.expiry
          });
          if (error) {
            console.error("Supabase delete error:", error);
            setStatus("Sync: OFF (delete error: " + error.message + ")", false);
          }
        }
      });

      li.appendChild(leftPart);
      li.appendChild(delBtn);
      itemList.appendChild(li);
    });
  }

  // UI events
  addBtn.addEventListener("click", () => {
    formBox.style.display = (formBox.style.display === "none") ? "block" : "none";
  });

  searchInput.addEventListener("input", () => {
    renderItems(searchInput.value);
  });

  // ----- Supabase -----
  const SUPABASE_URL = "https://lcyvdkiovtychcfmwulv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM"; // <-- paste exactly, inside quotes


  let sb = null;
  try {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (e) {
    sb = null;
  }

  // Render offline immediately
  renderItems();

  // Test + Load from Supabase
  (async function initShared() {
    if (!sb) {
      setStatus("Sync: OFF (Supabase library not loaded)", false);
      return;
    }

    const test = await sb.from("Items").select("*");

    
    setStatus("Sync: ON", true);

    const { data, error } = await sb
  .from("Items")
  .select("*");
    if (error) {
      console.error("Supabase fetch error:", error);
      setStatus("Sync: OFF (fetch error: " + error.message + ")", false);
      return;
    }

    items = data.map(d => ({ name: d.name, expiry: d.expiry }));
    saveToStorage();
    renderItems(searchInput.value);
  })();

  // Save item
  saveBtn.addEventListener("click", async () => {
    const name = itemNameInput.value.trim();
    const expiry = expiryDateInput.value;

    if (!name || !expiry) {
      alert("Please enter food name and expiry date");
      return;
    }

    // Local save always
    items.push({ name, expiry });
    saveToStorage();
    renderItems(searchInput.value);

    // Supabase save
    if (sb) {
      const { error } = await sb.from("Items").insert([{ name, expiry }]);
      if (error) {
        console.error("Supabase insert error:", error);
        setStatus("Sync: OFF (insert error: " + error.message + ")", false);
      } else {
        setStatus("Sync: ON", true);
      }
    } else {
      setStatus("Sync: OFF (Supabase not loaded)", false);
    }

    itemNameInput.value = "";
    expiryDateInput.value = "";
  });
});