var isAuthenticated = false;
var isTimerActive = false;
var isTimerRunning = false;
var timeRemaining = 0;
var baseTime = 0;
var lastRecordedDate;

var savedSites = new Map();
var monitorSiteList = [
  "youtube.com",
  "developer.chrome.com"
];

chrome.storage.local.get(['savedTime'], function (result) {
  if (result && result.savedTime && parseInt(result.savedTime)) {
    timeRemaining = parseInt(result.savedTime);
  }
});
chrome.storage.local.get(['isTimerActive'], function (result) {
  if (result) {
    isTimerActive = result.isTimerActive;
  }
});
chrome.storage.local.get(['timerBaseTime'], function (result) {
  if (result) {
    baseTime = parseInt(result.timerBaseTime);
  }
});
chrome.storage.local.get(['lastRecordedDate'], function (result) {
  if (result && result.lastRecordedDate) {
    lastRecordedDate = new Date(JSON.parse(result.lastRecordedDate));
  }
});

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request) {
      let response = {};
      switch (request.action) {
        case 'login':
          isAuthenticated = true;
          setTimeout(function () {
            isAuthenticated = false;
          }, 1000);
          break;

        case 'isLoggedIn':
          response = { isAuth: isAuthenticated };
          break;

        case 'getTimerState':
          response = {
            timeRemaining: timeRemaining,
            isTimerActive: isTimerActive
          };
          break;

        case 'setTime':
          if (request.time && parseInt(request.time)) {
            timeRemaining = parseInt(request.time);
            chrome.storage.local.set({ savedTime: timeRemaining },
              function () { });
          }
          if (request.baseTime && parseInt(request.baseTime)) {
            baseTime = parseInt(request.baseTime);
            chrome.storage.local.set({ timerBaseTime: baseTime },
              function () { });
          }
          break;

        case 'activateTimer':
          updateTimerState(true);
          break;

        case 'deactivateTimer':
          updateTimerState(false);
          break;

        case 'getBaseTime':
          response = { baseTime: baseTime };
          break;

        case 'performRedirect':
          chrome.tabs.update(sender.tab.id, { url: chrome.extension.getURL('redirect-page.html') });
          chrome.tabs.get(sender.tab.id, function (tab) {
            savedSites.set(sender.tab.id, tab.url);
          });
          break;

        case 'restorePage':
          const matchingSiteUrl = savedSites.get(sender.tab.id);
          if (matchingSiteUrl) {
            chrome.tabs.update(sender.tab.id, { url: matchingSiteUrl });
          }
          break;

      }
      sendResponse(response);
    }
    return true;
  }
);

chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name == "timer");
  port.onMessage.addListener(function (msg) {
    port.postMessage({
      timeRemaining: timeRemaining,
      isTimerActive: isTimerActive
    });
    return true;
  });
});

/*chrome.tabs.onRemoved.addListener(function (tabId, removed) {
  checkAllTabs();
});

function checkAllTabs() {
  chrome.tabs.getAllInWindow(null, function (tabs) {
    let matchingSite = undefined;
    tabs.forEach(tab => {
      matchingSite = monitorSiteList.find(siteUrl =>
        location.href.includes(siteUrl)
      );
    });
    if (!matchingSite) {
      isTimerRunning = false;
    }
  });
}*/

var dateCheckInterval = setInterval(function () {
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  if (!lastRecordedDate || currentDate.getTime() !== lastRecordedDate.getTime()) {
    if (lastRecordedDate) {
      timeRemaining = baseTime;
    }
    lastRecordedDate = currentDate;
    chrome.storage.local.set({ lastRecordedDate: JSON.stringify(currentDate) },
      function () { });
  }
}, 10000);

var monitorInterval = setInterval(function () {
  chrome.tabs.query({}, function (tabs) {
    checkForActiveTabs(tabs);
  });
}, 1000);

async function checkForActiveTabs(tabs) {
  let hasActiveTabs = false;
  for (const tab of tabs) {
    if (tab && tab.id !== undefined) {
      hasActiveTabs = hasActiveTabs || await new Promise(resolve => {
        chrome.tabs.sendMessage(tab.id, {}, function (response) {
          resolve(!!(response && response.tabIsActive));
          var lastError = chrome.runtime.lastError;
          if (lastError) {
            return;
          }
        });
      });
    }
  }
  isTimerRunning = hasActiveTabs;
}

function updateTimerState(isSetToActive) {
  isTimerActive = isSetToActive;
  chrome.storage.local.set({ isTimerActive: isSetToActive }, function () { });
}

var counter = 0;
var currentTime = new Date();
var timerInterval = setInterval(function () {
  const newTime = new Date();
  const elapsedTime = (newTime.getTime() - currentTime.getTime()) / 1000;
  currentTime = newTime;
  if (isTimerActive && isTimerRunning) {
    if (timeRemaining - elapsedTime > 0) {
      timeRemaining -= elapsedTime;
    } else {
      timeRemaining = 0;
    }
    if (counter >= 50 || timeRemaining === 0) {
      chrome.storage.local.set({ savedTime: timeRemaining }, function () { });
      counter = 0;
    }
    counter++;
  }
}, 100);