document.addEventListener("DOMContentLoaded", () => {

  const SUPABASE_URL = "https://lcyvdkiovtychcfmwulv.supabase.co";
  const SUPABASE_KEY = "PASTE_YOUR_KEY";

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const fridgeInput = document.getElementById("fridgeCode");
  const useFridgeBtn = document.getElementById("useFridgeBtn");
  const addBtn = document.getElementById("addBtn");
  const formBox = document.getElementById("formBox");
  const saveBtn = document.getElementById("saveBtn");

  const itemName = document.getElementById("itemName");
  const expiryDate = document.getElementById("expiryDate");
  const itemList = document.getElementById("itemList");
  const searchInput = document.getElementById("searchInput");
  const statusBox = document.getElementById("statusBox");

  let fridgeCode = localStorage.getItem("fridge") || "";
  fridgeInput.value = fridgeCode;

  function setStatus(text, ok) {
    statusBox.textContent = text;
    statusBox.style.background = ok ? "#e7f7ee" : "#fff3cd";
  }

  useFridgeBtn.onclick = () => {
    fridgeCode = fridgeInput.value.trim();
    localStorage.setItem("fridge", fridgeCode);
    loadItems();
  };

  addBtn.onclick = () => {
    formBox.style.display = formBox.style.display === "none" ? "block" : "none";
  };

  function getDays(expiry) {
    const today = new Date();
    const exp = new Date(expiry);
    return Math.round((exp - today) / (1000 * 60 * 60 * 24));
  }

  function render(data) {
    itemList.innerHTML = "";

    data.forEach(item => {
      const li = document.createElement("li");

      const days = getDays(item.expiry);

      let text = item.name;

      if (days < 0) {
        li.classList.add("expired");
        text += " (Expired)";
      } else if (days <= 1) {
        li.classList.add("expiring");
        text += " (Soon)";
      }

      li.innerHTML = `
        <span>${text}</span>
        <button class="delete-btn">X</button>
      `;

      li.querySelector("button").onclick = async () => {
        await sb.from("Items").delete().eq("id", item.id);
        loadItems();
      };

      itemList.appendChild(li);
    });
  }

  async function loadItems() {
    if (!fridgeCode) return;

    const { data, error } = await sb
      .from("Items")
      .select("*")
      .eq("fridge_code", fridgeCode);

    if (error) {
      setStatus("Sync OFF", false);
      return;
    }

    setStatus("Sync ON", true);
    render(data);
  }

  saveBtn.onclick = async () => {
    if (!itemName.value || !expiryDate.value) return;

    await sb.from("Items").insert([{
      name: itemName.value,
      expiry: expiryDate.value,
      fridge_code: fridgeCode
    }]);

    itemName.value = "";
    expiryDate.value = "";

    loadItems();
  };

  loadItems();
});
