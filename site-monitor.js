var watchSiteList = [];
var videoSites = [];
var matchingSite;
var matchingEmbeddedSites = [];
var removedIframes = [];
var videoSiteDetails;
var lastRecordedTime;

const uuid = "215b0307-a5ed-46ea-85db-d4880aea34a2";
const timeOptions = [
  { id: "select10Min", timeStr: "10 Min", fullTimeStr: "10 Minutes", timeInSecs: 600 },
  { id: "select15Min", timeStr: "15 Min", fullTimeStr: "15 Minutes", timeInSecs: 900 },
  { id: "select20Min", timeStr: "20 Min", fullTimeStr: "20 Minutes", timeInSecs: 1200 },
  { id: "select25Min", timeStr: "25 Min", fullTimeStr: "25 Minutes", timeInSecs: 1500 },
  { id: "select30Min", timeStr: "30 Min", fullTimeStr: "30 Minutes", timeInSecs: 1800 },
  { id: "select45Min", timeStr: "45 Min", fullTimeStr: "45 Minutes", timeInSecs: 2700 },
  { id: "select1Hr", timeStr: "1 Hr", fullTimeStr: "1 Hour", timeInSecs: 3600 },
  { id: "select1_5Hr", timeStr: "1.5 Hr", fullTimeStr: "1.5 Hours", timeInSecs: 5400 },
  { id: "select2Hr", timeStr: "2 Hr", fullTimeStr: "2 Hours", timeInSecs: 7200 }
];
const popoverDimensionsCss = getPopoverDimensionsCss();

const timerHtml = `
<div id="${uuid}_mainWrapper">
  <div id="${uuid}_addTimePopover" class="${uuid}_popover" style="${popoverDimensionsCss}">
    <div class="${uuid}_title">Add Time</div>
    <div id="${uuid}_timeOptionGroup">
      ${
        timeOptions.map(option => {
          return `
          <button class="${uuid}_timeOption" id="${uuid}_${option.id}">
            ${option.timeStr}
          </button>
          `;
        }).reduce((optionsGroup, optionHtml) => optionsGroup + optionHtml, "")
      }
    </div>
  </div>
  <div id="${uuid}_authPopover" class="${uuid}_popover" style="${popoverDimensionsCss}">
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
    <span id="${uuid}_time">00h 00m 00s</span>
    <button id="${uuid}_addTimeBtn">+</button>
  </div>
</div>
`;
$("body").append(timerHtml);

const embeddedSiteBlockedHtml = `
<div id="${uuid}_blockContent">
  
</div>
`;

const $mainWrapper = $(`#${uuid}_mainWrapper`);
$mainWrapper.hide();
const $timerTime = $mainWrapper.find(`#${uuid}_time`);

chrome.runtime.sendMessage({ action: 'getTimerStateAndExtConfig' }, response => {
  if (!response || !response.timerState || !response.extConfig) {
    return;
  }
  const { timerState, extConfig } = response;
  if (extConfig.watchSiteList) {
    watchSiteList = extConfig.watchSiteList;
  }
  if (extConfig.videoSites) {
    videoSites = extConfig.videoSites;
  }
  matchingSite = watchSiteList.find(site => location.href.includes(site.url));
  matchingEmbeddedSites = findMatchingEmbeddedSites();
  updateSiteTimerState(timerState.isTimerActive);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let response;
  if (!request || !request.action) {
    sendResponse(response);
    return true;
  }
  switch (request.action) {
    case 'checkIsTabActive':
      let tabIsActive = false;
      [matchingSite, ...matchingEmbeddedSites].filter(site => site !== undefined)
        .forEach(site => {
          if (site.isVideoSite && site.timeVideoOnly) {
            if (!videoSiteDetails) {
              videoSiteDetails = getVideoSiteDetails(site.url);
            }
            const selectorFound = !!$(videoSiteDetails.selector).length;
            tabIsActive = selectorFound === videoSiteDetails.activateOnSelectorFound;
          } else {
            tabIsActive = true;
          }
        });
      response = { tabIsActive: tabIsActive };
      break;

    case 'setWatchSiteList':
      matchingEmbeddedSites = findMatchingEmbeddedSites();
      if (request.watchSiteList) {
        watchSiteList = request.watchSiteList;
        matchingSite = watchSiteList.find(site => location.href.includes(site.url));
      }
      updateSiteTimerState(request.isTimerActive);
      break;

    case 'updateSiteTimerState':
      matchingEmbeddedSites = findMatchingEmbeddedSites();
      updateSiteTimerState(request.isTimerActive);
      break;
  }
  sendResponse(response);
  return true;
});

const port = chrome.runtime.connect({ name: "timer" });
port.onMessage.addListener(msg => {
  if (!msg || msg.timeRemaining === undefined) {
    return;
  }
  updateTimer(msg.timeRemaining);
});

var scanEmbeddedSitesInterval = setInterval(() => {
  matchingEmbeddedSites = findMatchingEmbeddedSites();
  updateSiteTimerState();
}, 5000);

var getTimeInterval;
function showTimer() {
  $mainWrapper.show();
  if (getTimeInterval === undefined) {
    getTimeInterval = setInterval(() => {
      port.postMessage({ action: 'getTime' });
    }, 100);
  }
}

function hideTimer() {
  $mainWrapper.hide();
  if (getTimeInterval !== undefined) {
    clearInterval(getTimeInterval);
    getTimeInterval = undefined;
  }
}

function updateTimer(timeRemaining) {
  if (timeRemaining === 0) {
    if (matchingSite) {
      sendAction('performRedirect', {});
    } else if (matchingEmbeddedSites.length > 0) {
      blockMatchingEmbeddedSites();
    }
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

var isAddTimePopoverShown = false;
var isAuthPopoverShown = false;
var secondsToAdd = 0;
var pendingPasswordValidation = false;

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
  const selectedOption = timeOptions.find(
      option => `${uuid}_${option.id}` === $(this).attr("id"));
  if (!selectedOption) {
    return;
  }
  secondsToAdd = selectedOption.timeInSecs;
  $addTimePrompt.text(`Add ${selectedOption.fullTimeStr} to the timer?`);
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
  $passwordField.focus();
}

function hidePopovers() {
  $addTimePopover.hide();
  isAddTimePopoverShown = false;
  $authPopover.hide();
  isAuthPopoverShown = false;
  $addTimePrompt.text("");
  $passwordField.val("");
}

function confirmAddTime() {
  if (pendingPasswordValidation) {
    return;
  }
  pendingPasswordValidation = true;
  chrome.runtime.sendMessage({ action: 'validatePassword', password: $passwordField.val() },
  response => {
    if (response && response.isPasswordValid) {
      sendAction('addTime', { time: secondsToAdd });
      hidePopovers();
    }
    pendingPasswordValidation = false;
  });
}

function sendAction(action, payload) {
  chrome.runtime.sendMessage({action, ...payload}, function (response) { });
}

function getPopoverDimensionsCss() {
  const timeOptionDimensions = 100;
  const titleHeight = 30;
  const padding = 20;

  // Behaviour:
  // # Options    Row Count   Col Count
  // 1            1           1
  // 2            2           1
  // 3            2           2
  // 4            2           2
  // 5            3           2
  // ...
  const rowCount = Math.ceil(Math.sqrt(timeOptions.length));
  const colCount = Math.ceil(timeOptions.length / rowCount);
  const popoverWidth = timeOptionDimensions * rowCount + padding;
  const popoverHeight = timeOptionDimensions * colCount + padding + titleHeight;

  return `width: ${popoverWidth}px; height: ${popoverHeight}px`;
}

function findMatchingEmbeddedSites() {
  const matchingEmbeddedSites = [];
  $("iframe").each((idx, iframe) => {
    const $iframe = $(iframe);
    const iframeUrl = $iframe.attr("src");
    let matchingSite = undefined;
    if (iframeUrl) {
      matchingSite = watchSiteList.find(site => iframeUrl.includes(site.url));
    }
    if (matchingSite) {
      matchingEmbeddedSites.push({ ...matchingSite, siteIframe: iframe });
    }
  });
  return matchingEmbeddedSites;
}

function blockMatchingEmbeddedSites() {
  matchingEmbeddedSites.map(site => $(site.siteIframe))
    .filter($iframe => $iframe != undefined)
    .forEach($iframe => {
      $iframe.remove()
    });
  matchingEmbeddedSites = [];
}

const mutex = new Mutex();
async function updateSiteTimerState(isTimerActive) {
  const unlock = await mutex.lock();
  if (matchingSite || matchingEmbeddedSites.length > 0) {
    if (isTimerActive === undefined) {
      isTimerActive = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({action: 'getTimerState'}, function (response) {
          if (response) {
            resolve(!!response.isTimerActive);
          } else {
            reject("Failed to get timer state");
          }
        });
      });
    }
    if (isTimerActive) {
      showTimer();
    } else {
      hideTimer();
    }
  } else {
    hideTimer();
  }
  unlock();
}

// https://stackoverflow.com/a/51086893/11994724
function Mutex() {
  let current = Promise.resolve();
  this.lock = () => {
      let _resolve;
      const p = new Promise(resolve => {
          _resolve = () => resolve();
      });
      // Caller gets a promise that resolves when the current outstanding
      // lock resolves
      const rv = current.then(() => _resolve);
      // Don't allow the next request until the new promise is done
      current = p;
      // Return the new promise
      return rv;
  };
}