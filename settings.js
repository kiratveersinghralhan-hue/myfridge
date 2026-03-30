document.addEventListener("DOMContentLoaded", () => {
  const savedFridgeCode = document.getElementById("savedFridgeCode");
  const clearFridgeBtn = document.getElementById("clearFridgeBtn");
  const settingsMessage = document.getElementById("settingsMessage");

  function setMessage(text, ok) {
    settingsMessage.hidden = false;
    settingsMessage.textContent = text;
    settingsMessage.classList.toggle("message-box--ok", !!ok);
  }

  function refreshCode() {
    savedFridgeCode.textContent = localStorage.getItem("fridge-code") || "None";
  }

  clearFridgeBtn.addEventListener("click", () => {
    localStorage.removeItem("fridge-code");
    refreshCode();
    setMessage("Saved family code cleared successfully.", true);
  });

  refreshCode();
});
