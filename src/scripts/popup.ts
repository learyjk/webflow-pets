const ANIMATION_DELAY = 750;

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
    if (!activeTab || !activeTab.id || !activeTab.url) return;
    let url = new URL(activeTab.url);
    if (url.hostname === "webflow.com" && url.pathname.startsWith("/design/")) {
      chrome.tabs.sendMessage(
        activeTab.id,
        {
          type: "updateSettings",
          enableAnimation,
          interval,
        },
        function (response) {
          chrome.storage.sync.set(
            {
              enableAnimation,
              interval,
            },
            function () {
              // Update status to let user know options were saved.
              var status = document.querySelector<HTMLDivElement>(".status");
              if (!status) return;
              status.textContent = "Options saved.";
              status.classList.remove("hidden");
              console.log({ status });
              setTimeout(function () {
                if (!status) return;
                status.classList.add("hidden");
              }, ANIMATION_DELAY);
            }
          );
        }
      );
    } else {
      // not on webflow designer
      var status = document.querySelector<HTMLDivElement>(".status");
      if (!status) return;
      status.textContent = "Options cannot be saved on this page.";
      status.classList.remove("hidden");
      setTimeout(function () {
        if (!status) return;
        status.classList.add("hidden");
      }, ANIMATION_DELAY);
    }
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

  chrome.storage.sync.get(
    {
      enableAnimation: true,
      interval: 500,
    },
    function (items) {
      toggleAnimation.checked = items.enableAnimation;
      intervalTime.value = items.interval;
    }
  );
}

// Add event listener to the Save button
document.querySelector("#saveBtn")!.addEventListener("click", saveSettings);

// Restore the saved settings when the popup is opened
document.addEventListener("DOMContentLoaded", restoreSettings);
