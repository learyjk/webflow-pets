(() => {
  // src/scripts/popup.ts
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
            console.log(response);
            chrome.storage.sync.set(
              {
                enableAnimation,
                interval
              },
              function() {
                var status2 = document.querySelector("#status");
                if (!status2)
                  return;
                status2.textContent = "Options saved.";
                setTimeout(function() {
                  if (!status2)
                    return;
                  status2.textContent = "";
                }, 750);
              }
            );
          }
        );
      } else {
        var status = document.querySelector("#status");
        if (!status)
          return;
        status.textContent = "Options cannot be saved on this page.";
        setTimeout(function() {
          if (!status)
            return;
          status.textContent = "";
        }, 750);
      }
    });
  }
  function restoreSettings() {
    console.log("restoreSettings");
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
