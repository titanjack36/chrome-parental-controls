var monitorSiteList = [
  "youtube.com",
  "developer.chrome.com"
];
var matchingSiteUrl = monitorSiteList.find(siteUrl => location.href.includes(siteUrl));
var $body;

if (matchingSiteUrl) {
  $body = $("body");
  $body.append("<div id='parentalControlChromeExtensionOverlayTimer'>" +
    "<span style='font-size:20px;'>还剩 </span><span>02h 00m 00s</span>" +
    "<span style='font-size:20px;'> remaining</span></div>");

  initializeTimer();

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      let tabIsActive = false;
      if (matchingSiteUrl) {
        if (matchingSiteUrl === 'youtube.com') {
          tabIsActive = $(".playing-mode").length;
        } else {
          tabIsActive = true;
        }
      }
      sendResponse({ tabIsActive: tabIsActive });
      return true;
    }
  );
}

function initializeTimer() {
  var $timer = $("#parentalControlChromeExtensionOverlayTimer > span:nth-child(2)");
  var lastRecordedTime;

  var port = chrome.runtime.connect({ name: "timer" });
  var interval = setInterval(function () {
    port.postMessage({ action: 'getTime' });
  }, 100);
  port.onMessage.addListener(function (msg) {
    if (msg && msg.timeRemaining !== undefined) {
      let currentTime = msg.timeRemaining;
      if (currentTime === 0) {
        chrome.runtime.sendMessage({ action: 'performRedirect' }, function (response) { });
      }
      if (!lastRecordedTime || Math.floor(currentTime) !== Math.floor(lastRecordedTime)) {
        let hrVal = addPrefixZero(Math.floor(msg.timeRemaining / 3600));
        let minVal = addPrefixZero(Math.floor(msg.timeRemaining % 3600 / 60));
        let secVal = addPrefixZero(Math.floor(msg.timeRemaining % 60));
        $timer.text(hrVal + "h " + minVal + "m " + secVal + "s");
      }
      lastRecordedTime = currentTime;
    }
  });
}

function addPrefixZero(num) {
  return ("0" + num).slice(-2);
}