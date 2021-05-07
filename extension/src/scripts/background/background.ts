import isSameDay from 'date-fns/isSameDay';

import { getActiveSites, getMinValue, sendAction, sendActionToAllTabs } from '../utils/extension.util';
import * as serverConfig from '../../config/server.json';
import { Action } from '../models/message.interface';
import { TimerSave, TimerState } from '../models/timer.interface';
import { ExtConfig } from '../models/config.interface';
import Timer from '../utils/timer.util';

var masterTimer: Timer = new Timer();
var lastRecordedTime;
var savedPassword: string;
var activeLogSiteMap: Set<string> = new Set();
var lastLogTime: Date = new Date();
var blockedTabIdMap: Map<number, string> = new Map();

var extConfig: ExtConfig = {
  isTimerEnabled: false,
  useAutoReset: false,
  timeBlockSitesOnly: false,
  useBreaks: false,
  useLogging: false,
  useBlockSitesAsLogSites: false,
  blockSiteList: [],
  logSiteList: []
};

chrome.storage.local.get(['extConfig', 'timerSave', 'lastRecordedTime', 'password'], result => {
  if (!result) {
    return;
  }
  if (result.extConfig) {
    extConfig = result.extConfig;
    extConfig.blockSiteList = extConfig.blockSiteList ?? [];
    extConfig.logSiteList = extConfig.logSiteList ?? [];
  }
  if (result.timerSave) {
    masterTimer.restoreFromSave(result.timerSave,
      extConfig.isTimerEnabled && !extConfig.timeBlockSitesOnly);
  }
  if (result.password) {
    savedPassword = result.password;
  }
  if (result.lastRecordedTime) {
    lastRecordedTime = new Date(JSON.parse(result.lastRecordedTime));
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request) {
    return;
  }
  let response = {};
  switch (request.action) {
    case Action.getTimerState:
      response = masterTimer.getTimerState();
      break;

    case Action.getTimeRemaining:
      response = masterTimer.getTime();
      break;

    case Action.getExtConfig:
      response = extConfig;
      break;

    case Action.getTimerStateAndExtConfig:
      response = { timerState: masterTimer.getTimerState(), extConfig };
      break;

    case Action.addTime:
      if (parseInt(request.time) !== NaN) {
        masterTimer.addTime(request.time);
        const timerState = masterTimer.getTimerState();
        sendAction(Action.setTimerState, { timerState });
        sendActionToAllTabs(Action.setTimerState, { timerState });
        saveTimerState(masterTimer.getTimerSave());
      }
      break;

    case Action.setTimerState:
      masterTimer.sync(request.timerState, true);
      sendActionToAllTabs(Action.setTimerState, { timerState: masterTimer.getTimerState() });
      saveTimerState(masterTimer.getTimerSave());
      break;

    case Action.updateExtConfig:
      const { isTimerEnabled, useAutoReset, timeBlockSitesOnly, useBreaks, 
        useLogging, useBlockSitesAsLogSites, blockSiteList, logSiteList } = request;
      if (isTimerEnabled !== undefined) {
        extConfig.isTimerEnabled = !!isTimerEnabled;
        updateTimerState();
      }
      if (useAutoReset !== undefined) {
        extConfig.useAutoReset = !!useAutoReset;
      }
      if (timeBlockSitesOnly !== undefined) {
        extConfig.timeBlockSitesOnly = !!timeBlockSitesOnly;
      }
      if (useBreaks !== undefined) {
        extConfig.useBreaks = !!useBreaks;
      }
      if (useLogging !== undefined) {
        extConfig.useLogging = !!useLogging;
      }
      if (useBlockSitesAsLogSites !== undefined) {
        extConfig.useBlockSitesAsLogSites = !!useBlockSitesAsLogSites;
      }
      if (blockSiteList) {
        extConfig.blockSiteList = blockSiteList;
      }
      if (logSiteList) {
        extConfig.logSiteList = logSiteList;
      }
      sendActionToAllTabs(Action.updateExtConfig, { extConfig });
      saveExtConfig(extConfig);
      break;

    case Action.performRedirect:
      chrome.tabs.get(sender.tab.id, tab => {
        if (!blockedTabIdMap.has(sender.tab.id)) {
          blockedTabIdMap.set(sender.tab.id, tab.url);
        }
        chrome.tabs.update(sender.tab.id,
          { url: chrome.extension.getURL('redirect-page.html') });
      });
      break;

    case Action.restorePage:
      const matchingSiteUrl = blockedTabIdMap.get(sender.tab.id);
      if (matchingSiteUrl) {
        blockedTabIdMap.delete(sender.tab.id);
        chrome.tabs.update(sender.tab.id, { url: matchingSiteUrl });
      }
      break;

    case Action.setPassword:
      let success = false;
      const { currentPassword, newPassword } = request;
      if ((!savedPassword || currentPassword == savedPassword) && newPassword) {
        chrome.storage.local.set({ password: newPassword }, function () { });
        savedPassword = newPassword;
        success = true;
      }
      response = { success };
      break;

    case Action.validatePassword:
      response = { isPasswordValid: savedPassword && request.password === savedPassword };
      break;

    case Action.checkPasswordExists:
      response = { hasPassword: !!savedPassword };
      break;
  }
  sendResponse(response);
  return true;
});

var updateTimerStateInterval = setInterval(() => {
  updateTimerState();
}, 1000);

var logActiveSitesInterval = setInterval(async () => {
  const newTime = new Date();
  try {
    if (extConfig.useLogging && activeLogSiteMap.size > 0) {
      const { address, port, logEndpoint } = serverConfig;
      await fetch(`http://${address}:${port}/${logEndpoint}/log`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startTime: lastLogTime.toISOString(),
          endTime: newTime.toISOString(),
          siteUrls: Array.from(activeLogSiteMap),
          extensionId: chrome.runtime.id
        })
      });
    }
    activeLogSiteMap = new Set();
    lastLogTime = newTime;
  } catch (err) {
    console.error(err);
  }
}, 10000);

async function updateTimerState() {
  let currentTime = new Date();
  if (extConfig.useAutoReset && !isSameDay(currentTime, lastRecordedTime)) {
    masterTimer.reset();
  }
  lastRecordedTime = currentTime;

  let activeWatchSiteUrls = [];
  if (extConfig.timeBlockSitesOnly || extConfig.useLogging) {
    const activeSites = await getActiveSites();
    activeSites.activeLogSiteUrls?.forEach(url => activeLogSiteMap.add(url));
    activeWatchSiteUrls = activeSites.activeBlockSiteUrls ?? [];
  }

  if (extConfig.isTimerEnabled 
      && (!extConfig.timeBlockSitesOnly || activeWatchSiteUrls.length > 0)) {
    const wasTimerStopped = masterTimer.start();
    if (wasTimerStopped) {
      const timerState = masterTimer.getTimerState();
      sendAction(Action.startTimer, { timerState });
      sendActionToAllTabs(Action.startTimer, { timerState });
    }
  } else {
    const wasTimerRunning = masterTimer.stop();
    if (wasTimerRunning) {
      const [ dashboardTime, tabTimes ] = await Promise.all([
        sendAction(Action.stopTimer),
        sendActionToAllTabs(Action.stopTimer)
      ]);
      masterTimer.stop();
      const minStartTimeVal = getMinValue([ dashboardTime, ...tabTimes ]);
      if (minStartTimeVal) {
        masterTimer.syncStartTimeValue(minStartTimeVal);
      }
    }
  }

  saveTimerState(masterTimer.getTimerSave());
  chrome.storage.local.set({ lastRecordedTime: JSON.stringify(currentTime) },
    () => { });
}

function saveTimerState(timerSave: TimerSave): void {
  chrome.storage.local.set({ timerSave }, () => { });
}

function saveExtConfig(extConfig: ExtConfig): void {
  chrome.storage.local.set({ extConfig }, () => { });
}