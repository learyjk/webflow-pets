function saveSettings() {
  const toggleAnimation =
    document.querySelector<HTMLInputElement>("#toggleAnimation");
  const intervalTime =
    document.querySelector<HTMLInputElement>("#intervalTime");

  if (!toggleAnimation || !intervalTime) return;

  // Get the values from the UI elements
  const enableAnimation = toggleAnimation.checked;
  const interval = parseInt(intervalTime.value);

  // Send a message to the content script with the updated settings
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var activeTab = tabs[0];
    if (!activeTab || !activeTab.id) return;
    chrome.tabs.sendMessage(activeTab.id, {
      type: "updateSettings",
      enableAnimation,
      interval,
    });
  });
}

// Function to restore the saved settings
function restoreSettings() {
  const toggleAnimation =
    document.querySelector<HTMLInputElement>("#toggleAnimation");
  if (!toggleAnimation) return;
  const intervalTime =
    document.querySelector<HTMLInputElement>("#intervalTime");
  if (!intervalTime) return;

  // Get the saved settings from Chrome storage
  chrome.storage.sync.get(["enableAnimation", "interval"], (result) => {
    // Set the values of the UI elements
    toggleAnimation.checked = result.enableAnimation;
    intervalTime.value = result.interval || 1000;
  });
}

// Add event listener to the Save button
document.querySelector("#saveBtn")!.addEventListener("click", saveSettings);

// Restore the saved settings when the popup is opened
document.addEventListener("DOMContentLoaded", restoreSettings);
