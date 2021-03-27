var watchSiteList = [];
var videoSites = [];
var matchingSite;
var videoSiteDetails;
var lastRecordedTime;

var isAddTimePopoverShown = false;
var isAuthPopoverShown = false;
var hoursToAdd = 0;

const hoursToSeconds = 3600;
const uuid = "215b0307-a5ed-46ea-85db-d4880aea34a2";

var timerHtml = `
<div id="215b0307-a5ed-46ea-85db-d4880aea34a2_mainWrapper">
  <div id="${uuid}_addTimePopover" class="${uuid}_popover">
    <div class="${uuid}_title">Select Amount</div>
    <div class="${uuid}_timeOptionRow">
      <button class="${uuid}_timeOption" id="${uuid}_select15Min">15 Min</button>
      <button class="${uuid}_timeOption" id="${uuid}_select30Min">30 Min</button>
    </div>
    <div class="${uuid}_timeOptionRow">
      <button class="${uuid}_timeOption" id="${uuid}_select45Min">45 Min</button>
      <button class="${uuid}_timeOption" id="${uuid}_select1Hr">1 Hr</button>
    </div>
    <div class="${uuid}_timeOptionRow">
      <button class="${uuid}_timeOption" id="${uuid}_select1_5Hr">1.5 Hr</button>
      <button class="${uuid}_timeOption" id="${uuid}_select2Hr">2 Hr</button>
    </div>
  </div>
  <div id="${uuid}_authPopover" class="${uuid}_popover">
    <div id="${uuid}_authWrapper">
      <div class="${uuid}_title">Enter Password</div>
      <input type="password" id="${uuid}_password">
      <div id="${uuid}_prompt"></div>
      <div class="${uuid}_buttonRow">
        <button class="${uuid}_action" id="${uuid}_backBtn">Back</button>
        <button class="${uuid}_action" id="${uuid}_confirmBtn">Confirm</button>
      </div>
    </div>
  </div>
  <div id="${uuid}_timer">
    <span id="${uuid}_time">01h 25m 32s</span>
    <button id="${uuid}_addTimeBtn">+</button>
  </div>
</div>
`;

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
    $body.append(timerHtml);
    initializeTimer();
    initializeJQueryListeners();
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
        if (matchingSite) {
          if (matchingSite.isVideoSite && matchingSite.timeVideoOnly) {
            if (!videoSiteDetails) {
              videoSiteDetails = getVideoSiteDetails(matchingSite.url);
            }
            const selectorFound = !!$(videoSiteDetails.selector).length;
            tabIsActive = selectorFound === videoSiteDetails.activateOnSelectorFound;
          } else {
            tabIsActive = true;
          }
          response = { tabIsActive: tabIsActive };
        }
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
  const $mainWrapper = $(`#${uuid}_mainWrapper`);
  const $timerTime = $mainWrapper.find(`#${uuid}_time`);
  var isTimerDisplayed = false;
  $mainWrapper.hide();

  var port = chrome.runtime.connect({ name: "timer" });
  var interval = setInterval(() => {
    port.postMessage({ action: 'getTime' });
  }, 100);
  port.onMessage.addListener(msg => {
    if (!msg || msg.timeRemaining === undefined) {
      return;
    }
    if (msg.isTimerActive && !isTimerDisplayed) {
      $mainWrapper.show();
      isTimerDisplayed = true;
    } else if (!msg.isTimerActive && isTimerDisplayed) {
      $mainWrapper.hide();
      isTimerDisplayed = false;
    }
    updateTimer(msg.timeRemaining, msg.isTimerActive, $timerTime);
  });
}

function updateTimer(timeRemaining, isTimerActive, $timerTime) {
  if (timeRemaining === 0 && isTimerActive) {
    chrome.runtime.sendMessage({ action: 'performRedirect' }, response => { });
  }
  if (!lastRecordedTime || Math.floor(timeRemaining) !== Math.floor(lastRecordedTime)) {
    let hrVal = addPrefixZero(Math.floor(timeRemaining / 3600));
    let minVal = addPrefixZero(Math.floor(timeRemaining % 3600 / 60));
    let secVal = addPrefixZero(Math.floor(timeRemaining % 60));
    $timerTime.text(hrVal + "h " + minVal + "m " + secVal + "s");
  }
  lastRecordedTime = timeRemaining;
}

function getVideoSiteDetails(url) {
  return videoSites.find(site => url.includes(site.url));
}

function addPrefixZero(num) {
  return ("0" + num).slice(-2);
}

function initializeJQueryListeners() {
  const $addTimePopover = $(`#${uuid}_addTimePopover`);
  const $authPopover = $(`#${uuid}_authPopover`);
  const $addTimePrompt = $(`#${uuid}_prompt`);
  const $passwordField = $(`#${uuid}_password`);

  $(document).click(function (event) {
    if (!(isAddTimePopoverShown || isAuthPopoverShown)) {
      return;
    }
    var $target = $(event.target);
    if ($target.closest(`#${uuid}_addTimeBtn`).length) {
      return;
    }
    if(!$target.closest(`#${uuid}_addTimePopover`).length &&
        !$target.closest(`#${uuid}_authPopover`).length) {
      hidePopovers();
    }
  })

  $(`#${uuid}_addTimeBtn`).click(function () {
    if (isAddTimePopoverShown || isAuthPopoverShown) {
      hidePopovers();
    } else {
      showAddTimePopover();
    }
  });

  $(`.${uuid}_timeOption`).click(function () {
    switch($(this).attr("id")) {
      case `${uuid}_select15Min`:
        hoursToAdd = 0.25;
        setAddTimePrompt("15 minutes");
        break;
      case `${uuid}_select30Min`:
        hoursToAdd = 0.5;
        setAddTimePrompt("30 minutes");
        break;
      case `${uuid}_select45Min`:
        hoursToAdd = 0.75;
        setAddTimePrompt("45 minutes");
        break;
      case `${uuid}_select1Hr`:
        hoursToAdd = 1;
        setAddTimePrompt("1 hour");
        break;
      case `${uuid}_select1_5Hr`:
        hoursToAdd = 1.5;
        setAddTimePrompt("1.5 hours");
        break;
      case `${uuid}_select2Hr`:
        hoursToAdd = 2;
        setAddTimePrompt("2 hours");
        break;
      default:
        hoursToAdd = 0;
    }
    showAuthPopover();
  });

  $(`#${uuid}_backBtn`).click(function () {
    showAddTimePopover();
  });

  $(`#${uuid}_confirmBtn`).click(function () {
    confirmAddTime();
  });

  $passwordField.on('keyup', function (e) {
    if (e.keyCode === 13) {
      confirmAddTime();
    }
  });

  function showAddTimePopover() {
    $addTimePopover.show();
    isAddTimePopoverShown = true;
    $authPopover.hide();
    isAuthPopoverShown = false;
    $addTimePrompt.text("");
    $passwordField.val("");
  }
  
  function showAuthPopover() {
    $addTimePopover.hide();
    isAddTimePopoverShown = false;
    $authPopover.show();
    isAuthPopoverShown = true;
  }

  function hidePopovers() {
    $addTimePopover.hide();
    isAddTimePopoverShown = false;
    $authPopover.hide();
    isAuthPopoverShown = false;
    $addTimePrompt.text("");
    $passwordField.val("");
  }

  function setAddTimePrompt(timeStr) {
    $addTimePrompt.text(`Add ${timeStr} to the timer?`);
  }

  function confirmAddTime() {
    chrome.runtime.sendMessage({ action: 'validatePassword', password: $passwordField.val() },
    response => {
      if (response && response.isPasswordValid) {
        sendAction('addTime', { time: hoursToAdd * hoursToSeconds });
        hidePopovers();
      }
    });
  }
}

function sendAction(action, payload) {
  chrome.runtime.sendMessage({action, ...payload}, function (response) { });
}