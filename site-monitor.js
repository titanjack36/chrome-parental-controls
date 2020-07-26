var watchSiteList = [];
var videoSites = [];
var matchingSite;
var videoSiteDetails;
var lastRecordedTime;

chrome.runtime.sendMessage({ action: 'getWatchSiteListAndVideoSites' },
  response => {
    if (response) {
      if (response.watchSiteList) {
        watchSiteList = response.watchSiteList;
      }
      if (response.videoSites) {
        videoSites = response.videoSites;
      }
      main();
    }
  });

function main() {
  matchingSite = watchSiteList.find(site => location.href.includes(site.url));

  if (matchingSite) {
    const $body = $("body");
    $body.append("<div id='parentalControlChromeExtensionOverlayTimer'>" +
      "<div><span style='font-size:20px;'>还剩 </span><span>--h --m --s</span>" +
      "<span style='font-size:20px;'> remaining</span></div></div>");

    initializeTimer();
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let response;
    if (!request || !request.action) {
      sendResponse(response);
      return true;
    }
    switch (request.action) {
      case 'checkIsTabActive':
        let tabIsActive = false;
        if (matchingSite.isVideoSite && matchingSite.timeVideoOnly) {
          if (!videoSiteDetails) {
            videoSiteDetails = getVideoSiteDetails(matchingSite.url);
          }
          const selectorFound = !!$(videoSiteDetails.selector).length;
          // xor statement
          tabIsActive = selectorFound === videoSiteDetails.activateOnSelectorFound;
        } else {
          tabIsActive = true;
        }
        response = { tabIsActive: tabIsActive };
        break;

      case 'setWatchSiteList':
        if (request.watchSiteList) {
          watchSiteList = request.watchSiteList;
          matchingSite = watchSiteList.find(
            site => location.href.includes(site.url)
          );
        }
        break;
    }
    sendResponse(response);
    return true;
  });
}

function initializeTimer() {
  const $overlay = $("#parentalControlChromeExtensionOverlayTimer");
  const $timer = $overlay.find("span:nth-child(2)");
  var isTimerDisplayed = false;
  $overlay.hide();

  var port = chrome.runtime.connect({ name: "timer" });
  var interval = setInterval(() => {
    port.postMessage({ action: 'getTime' });
  }, 100);
  port.onMessage.addListener(msg => {
    if (!msg || msg.timeRemaining === undefined) {
      return;
    }
    if (msg.isTimerActive && !isTimerDisplayed) {
      $overlay.show();
      isTimerDisplayed = true;
    } else if (!msg.isTimerActive && isTimerDisplayed) {
      $overlay.hide();
      isTimerDisplayed = false;
    }
    updateTimer(msg.timeRemaining, msg.isTimerActive, $timer);
  });
}

function updateTimer(timeRemaining, isTimerActive, $timer) {
  if (timeRemaining === 0 && isTimerActive) {
    chrome.runtime.sendMessage({ action: 'performRedirect' }, response => { });
  }
  if (!lastRecordedTime || Math.floor(timeRemaining) !== Math.floor(lastRecordedTime)) {
    let hrVal = addPrefixZero(Math.floor(timeRemaining / 3600));
    let minVal = addPrefixZero(Math.floor(timeRemaining % 3600 / 60));
    let secVal = addPrefixZero(Math.floor(timeRemaining % 60));
    $timer.text(hrVal + "h " + minVal + "m " + secVal + "s");
  }
  lastRecordedTime = timeRemaining;
}

function getVideoSiteDetails(url) {
  return videoSites.find(site => url.includes(site.url));
}

function addPrefixZero(num) {
  return ("0" + num).slice(-2);
}