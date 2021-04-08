var isAuthenticated = false;
var lastRecordedTime;
var currentTime;
var savedPassword;
var timerState = {
  isTimerActive: true,
  isTimerRunning: true,
  timeRemaining: 0, /* time is recorded in seconds */
  baseTime: 0 /* time is recorded in seconds */
};
var extConfig = {
  useAutoReset: false,
  useWatchList: false,
  useBreaks: false,
  watchSiteList: [],
  videoSites: [
    { url: "youtube.com", selector: '.playing-mode', activateOnSelectorFound: true },
    { url: "tfo.org", selector: '.jw-state-playing', activateOnSelectorFound: true },
    { url: "tvokids.com", selector: '.vjs-playing', activateOnSelectorFound: true }
  ]
};

var savedSites = new Map();

chrome.storage.local.get(['extConfig', 'timerState', 'lastRecordedTime', 'password'], result => {
  if (!result) {
    return;
  }
  if (result.extConfig) {
    extConfig = { ...result.extConfig, videoSites: extConfig.videoSites };
  }
  if (result.timerState) {
    timerState = result.timerState;
    timerState.isTimerRunning = !extConfig.useWatchList;
  }
  if (result.password) {
    savedPassword = result.password;
  }
  if (result.lastRecordedTime) {
    lastRecordedTime = new Date(JSON.parse(result.lastRecordedTime));
  }
  // If not using watch list, then include time elapsed when browser was closed
  currentTime = !extConfig.useWatchList && lastRecordedTime ? lastRecordedTime : new Date();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request) {
    return;
  }
  let response = {};
  switch (request.action) {
    case 'login':
      isAuthenticated = true;
      setTimeout(() => {
        isAuthenticated = false;
      }, 1000);
      break;

    case 'isLoggedIn':
      response = { isAuth: isAuthenticated };
      break;

    case 'getTimerState':
      response = timerState;
      break;

    case 'getExtConfig':
      response = extConfig;
      break;

    case 'getTimerStateAndExtConfig':
      response = { timerState, extConfig };
      break;

    case 'setTime':
      if (request.time && parseInt(request.time)) {
        timerState.timeRemaining = parseInt(request.time);
        saveTimerState();
      }
      if (request.baseTime && parseInt(request.baseTime)) {
        timerState.baseTime = parseInt(request.baseTime);
        saveTimerState();
      }
      break;

    case 'addTime':
      if (request.time && parseInt(request.time)) {
        timerState.timeRemaining += parseInt(request.time);
        saveTimerState();
      }
      break;

    case 'setTimerActive':
      timerState.isTimerActive = !!request.timerActive;
      saveTimerState();
      sendActionToAllTabs('updateSiteTimerState', { isTimerActive: timerState.isTimerActive });
      break;

    case 'setUseAutoReset':
      extConfig.useAutoReset = !!request.useAutoReset;
      saveTimerState();
      break;

    case 'setUseWatchList':
      extConfig.useWatchList = !!request.useWatchList;
      saveTimerState();
      break;

    case 'performRedirect':
      chrome.tabs.get(sender.tab.id, tab => {
        if (!savedSites.has(sender.tab.id)) {
          savedSites.set(sender.tab.id, tab.url);
        }
        chrome.tabs.update(sender.tab.id,
          { url: chrome.extension.getURL('redirect-page.html') });
      });
      break;

    case 'restorePage':
      const matchingSiteUrl = savedSites.get(sender.tab.id);
      if (matchingSiteUrl) {
        savedSites.delete(sender.tab.id);
        chrome.tabs.update(sender.tab.id, { url: matchingSiteUrl });
      }
      break;

    case 'setWatchSiteList':
      if (request.watchSiteList) {
        extConfig.watchSiteList = request.watchSiteList;
        saveExtConfig();
        sendActionToAllTabs('setWatchSiteList',
          { watchSiteList: extConfig.watchSiteList, isTimerActive: timerState.isTimerActive });
      }
      break;

    case 'setPassword':
      if (request.newPassword) {
        chrome.storage.local.set({ password: request.newPassword }, function () { });
        savedPassword = request.newPassword;
      }
      break;

    case 'validatePassword':
      response = { isPasswordValid: savedPassword && request.password === savedPassword };
      break;
  }
  sendResponse(response);
  return true;
});

chrome.runtime.onConnect.addListener(port => {
  console.assert(port.name === "timer");
  port.onMessage.addListener(msg => {
    port.postMessage(timerState);
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

var dateCheckInterval = setInterval(() => {
  if (!currentTime) {
    return;
  }
  if (extConfig.useAutoReset) {
    let currentDate = getDateFromDateTime(currentTime);
    let lastRecordedDate = getDateFromDateTime(lastRecordedTime);
    if (lastRecordedDate && currentDate.getTime() !== lastRecordedDate.getTime()) {
      timerState.timeRemaining = timerState.baseTime;
      saveTimerState();
    }
  }
  lastRecordedTime = currentTime;
  chrome.storage.local.set({ lastRecordedTime: JSON.stringify(currentTime) },
    () => { });
}, 1000);

var monitorInterval = setInterval(() => {
  chrome.tabs.query({}, tabs => {
    checkForActiveTabs(tabs);
  });
}, 1000);

var timerSyncInterval = setInterval(() => {
  if (!currentTime) {
    return;
  }
  const newTime = new Date();
  const elapsedTime = (newTime.getTime() - currentTime.getTime()) / 1000;
  currentTime = newTime;
  if (timerState.isTimerActive && timerState.isTimerRunning) {
    timerState.timeRemaining -= elapsedTime;
    if (timerState.timeRemaining <= 0) {
      timerState.timeRemaining = 0;
      saveTimerState();
    }
  }
}, 100);

var timerSaveInterval = setInterval(() => saveTimerState(), 50000);

async function checkForActiveTabs(tabs) {
  if (!extConfig.useWatchList) {
    timerState.isTimerRunning = true;
    return;
  }
  let hasActiveTabs = false;
  for (const tab of tabs) {
    if (tab && tab.id !== undefined) {
      hasActiveTabs = hasActiveTabs || await new Promise(resolve => {
        chrome.tabs.sendMessage(tab.id, { action: 'checkIsTabActive' },
          response => {
            resolve(!!(response && response.tabIsActive));
            var lastError = chrome.runtime.lastError;
            if (lastError) {
              return;
            }
          });
      });
    }
  }
  timerState.isTimerRunning = hasActiveTabs;
}

function saveTimerState() {
  chrome.storage.local.set({ 
    timerState: { ...timerState, hasActiveTabs: false }
  }, () => { });
}

function saveExtConfig() {
  chrome.storage.local.set({
    extConfig: { ...extConfig, videoSites: [] }
  }, () => { });
}

function sendActionToAllTabs(action, payload) {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action, ...payload },
        response => {
          var lastError = chrome.runtime.lastError;
          if (lastError) {
            return;
          }
        }
      );
    });
  });
}

function getDateFromDateTime(dateTime) {
  if (!dateTime) {
    return undefined;
  }
  let date = new Date(dateTime);
  date.setHours(0, 0, 0, 0);
  return date;
}