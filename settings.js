
document.addEventListener("DOMContentLoaded", () => {
  const savedFridgeCode = document.getElementById("savedFridgeCode");
  const clearFridgeBtn = document.getElementById("clearFridgeBtn");
  const settingsMessage = document.getElementById("settingsMessage");

  function refreshCode() {
    savedFridgeCode.textContent = MyFridge.getFridgeCode() || "None";
  }

  clearFridgeBtn.addEventListener("click", () => {
    MyFridge.saveFridgeCode("");
    refreshCode();
    MyFridge.setMessage(settingsMessage, "Saved family code cleared successfully.", true);
  });

  refreshCode();
});
