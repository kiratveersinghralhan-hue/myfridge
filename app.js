// MyFridge (Netlify-safe): UI works even if Supabase fails
alert("APP.JS LOADED v100");

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  const formBox = document.getElementById("formBox");
  const saveBtn = document.getElementById("saveBtn");

  const itemNameInput = document.getElementById("itemName");
  const expiryDateInput = document.getElementById("expiryDate");
  const itemList = document.getElementById("itemList");
  const searchInput = document.getElementById("searchInput");

  // Local (offline) data always works
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

    // Sort soonest expiry first
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

      // highlight
      if (daysLeft < 0) li.style.background = "#ffe5e5";       // red
      else if (daysLeft <= 1) li.style.background = "#fff3cd"; // yellow

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";

      delBtn.addEventListener("click", async () => {
        const deletedItem = items[realIndex];

        // local delete
        items.splice(realIndex, 1);
        saveToStorage();
        renderItems(searchInput.value);

        // supabase delete (only if available)
        if (sb) {
          const { error } = await sb.from("Items").insert([{ name, expiry }]);
            alert(error ? ("Insert error: " + error.message) : "Inserted OK");
            
          if (error) console.error("Supabase delete error:", error);
        }
      });

      li.appendChild(leftPart);
      li.appendChild(delBtn);
      itemList.appendChild(li);
    });
  }

  // UI always works
  addBtn.addEventListener("click", () => {
    formBox.style.display = (formBox.style.display === "none") ? "block" : "none";
  });

  searchInput.addEventListener("input", () => {
    renderItems(searchInput.value);
  });

  // ---- Supabase (optional, won’t break UI) ----
  const SUPABASE_URL = "https://lcyvdkiovtychcfmwulv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM";

  let sb = null;
  try {
    // supabase.min.js exposes window.supabase
    if (window.supabase && typeof window.supabase.createClient === "function") {
      sb = window.supabase.createClient(
        "https://lcyvdkiovtychcfmwulv.supabase.co",
        "sb_publishable_F9N78vRV4oRgdwmUMFDr3w_OyNvllNM"
      );

      alert("Supabase client: " + (sb ? "ON" : "OFF"));

    } else {
      console.warn("Supabase library did not load. App will work offline only.");
    }
  } catch (e) {
    console.warn("Supabase init failed. App will work offline only.", e);
  }

  // Save item (local always, supabase if available)
  saveBtn.addEventListener("click", async () => {
    const name = itemNameInput.value.trim();
    const expiry = expiryDateInput.value;

    if (!name || !expiry) {
      alert("Please enter food name and expiry date");
      return;
    }

    // local save
    items.push({ name, expiry });
    saveToStorage();
    renderItems(searchInput.value);

    // supabase save
    if (sb) {
      const { data, error } = await sb.from("Items").insert([{ name, expiry }]);

      console.log("INSERT RESULT:", data, error);

      if (error) {
      alert("Insert error: " + error.message);
}
    }

    itemNameInput.value = "";
    expiryDateInput.value = "";
  });

  // First paint (offline data)
  renderItems();

  // Load shared data if supabase is available
  (async function loadShared() {
    if (!sb) return;

    const { data, error } = await sb
      .from("Items")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase fetch error:", error);
      return;
    }

    items = data.map(d => ({ name: d.name, expiry: d.expiry }));
    saveToStorage();
    renderItems(searchInput.value);
  })();
});