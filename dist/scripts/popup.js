(() => {
  // src/scripts/popup.ts
  var ANIMATION_DELAY = 750;
  function saveSettings() {
    const toggleAnimation = document.querySelector("#toggleAnimation");
    const intervalTime = document.querySelector("#intervalTime");
    if (!toggleAnimation || !intervalTime)
      return;
    const enableAnimation = toggleAnimation.checked;
    const interval = parseInt(intervalTime.value);
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
      var activeTab = tabs[0];
      if (!activeTab || !activeTab.id || !activeTab.url)
        return;
      let url = new URL(activeTab.url);
      if (url.hostname === "webflow.com" && url.pathname.startsWith("/design/")) {
        chrome.tabs.sendMessage(
          activeTab.id,
          {
            type: "updateSettings",
            enableAnimation,
            interval
          },
          function(response) {
            chrome.storage.sync.set(
              {
                enableAnimation,
                interval
              },
              function() {
                var status2 = document.querySelector(".status");
                if (!status2)
                  return;
                status2.textContent = "Options saved.";
                status2.classList.remove("hidden");
                console.log({ status: status2 });
                setTimeout(function() {
                  if (!status2)
                    return;
                  status2.classList.add("hidden");
                }, ANIMATION_DELAY);
              }
            );
          }
        );
      } else {
        var status = document.querySelector(".status");
        if (!status)
          return;
        status.textContent = "Options cannot be saved on this page.";
        status.classList.remove("hidden");
        setTimeout(function() {
          if (!status)
            return;
          status.classList.add("hidden");
        }, ANIMATION_DELAY);
      }
    });
  }
  function restoreSettings() {
    const toggleAnimation = document.querySelector("#toggleAnimation");
    if (!toggleAnimation)
      return;
    const intervalTime = document.querySelector("#intervalTime");
    if (!intervalTime)
      return;
    chrome.storage.sync.get(
      {
        enableAnimation: true,
        interval: 500
      },
      function(items) {
        toggleAnimation.checked = items.enableAnimation;
        intervalTime.value = items.interval;
      }
    );
  }
  document.querySelector("#saveBtn").addEventListener("click", saveSettings);
  document.addEventListener("DOMContentLoaded", restoreSettings);
})();
//# sourceMappingURL=popup.js.map
