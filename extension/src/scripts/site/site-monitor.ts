import $ from 'jquery';
import { Mutex } from 'async-mutex';
import { sendAction } from '../utils/extension.util';
import { Action } from '../models/message.interface';
import Timer from '../utils/timer.util';
import { EmbeddedSite, ExtConfig, Site } from '../models/config.interface';
import { TimeOption } from '../models/timer.interface';
import * as timeOptionsConfig from '../../config/time-options.json';
import getTimerTemplate from '../templates/timer.template';
import getBlockScreenTemplate from '../templates/block-screen.template';

var tabExtConfig: ExtConfig = {
  isTimerEnabled: false,
  useAutoReset: false,
  timeBlockSitesOnly: false,
  useBreaks: false,
  useLogging: false,
  useBlockSitesAsLogSites: false,
  blockSiteList: [],
  logSiteList: []
};
var tabTimer: Timer = new Timer();
var matchingBlockSites: Site[] = [];
var matchingLogSites: Site[] = [];
var activeBlockScreens: JQuery[] = [];
var redirectOnTimeup: boolean = false;

const uuid = "215b0307-a5ed-46ea-85db-d4880aea34a2";
const timeOptions: TimeOption[] = (timeOptionsConfig as any).default;

$("body").append(getTimerTemplate(uuid, timeOptions));

const $mainWrapper = $(`#${uuid}_mainWrapper`);
$mainWrapper.hide();
const $timerTime = $mainWrapper.find(`#${uuid}_time`);

sendAction(Action.getTimerStateAndExtConfig).then(response => {
  if (!response || !response.timerState || !response.extConfig) {
    return;
  }
  tabTimer.sync(response.timerState);
  tabExtConfig = response.extConfig;
  updateMatchingSites();
  updateTabTimerDisplay();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let response: any = {};
  if (!request || !request.action) {
    sendResponse(response);
    return true;
  }
  switch (request.action) {
    case Action.getActiveSitesFromTab:
      const activeBlockSiteUrls = matchingBlockSites
        .filter(site => checkIfSiteIsActive(site)).map(site => site.url);
      const activeLogSiteUrls = matchingLogSites.map(site => site.url);
      response = { activeBlockSiteUrls, activeLogSiteUrls };
      break;

    case Action.updateExtConfig:
      if (request.extConfig) {
        tabExtConfig = request.extConfig;
        updateMatchingSites();
        updateTabTimerDisplay();
      }
      break;

    case Action.setTimerState:
      if (request.timerState) {
        tabTimer.sync(request.timerState);
      }
      break;

    case Action.startTimer:
      if (request.timerState) {
        tabTimer.sync(request.timerState);
        tabTimer.start();
      }
      break;
    
    case Action.stopTimer:
      tabTimer.stop();
      response = tabTimer.getTimerState().startTimeValue;
      break;
  }
  sendResponse(response);
  return true;
});

var scanEmbeddedSitesInterval = setInterval(() => {
  updateMatchingSites();
  updateTabTimerDisplay();
}, 5000);

var refreshTimerInterval;
function showTimer() {
  $mainWrapper.show();
  if (refreshTimerInterval === undefined) {
    refreshTimerInterval = setInterval(() => {
      if (tabTimer.getTime() === 0) {
        if (redirectOnTimeup) {
          sendAction(Action.performRedirect);
        } else if (matchingBlockSites.length > 0) {
          blockMatchingEmbeddedSites();
        }
      } else if (activeBlockScreens.length > 0) {
        clearActiveBlockScreens();
      }
      $timerTime.text(tabTimer.getFormattedTime());
    }, 100);
  }
}

function hideTimer() {
  $mainWrapper.hide();
  if (refreshTimerInterval !== undefined) {
    clearInterval(refreshTimerInterval);
    refreshTimerInterval = undefined;
  }
}

var isAddTimePopoverShown = false;
var isAuthPopoverShown = false;
var secondsToAdd = 0;
var pendingPasswordValidation = false;

const $addTimePopover = $(`#${uuid}_addTimePopover`);
const $authPopover = $(`#${uuid}_authPopover`);
const $addTimePrompt = $(`#${uuid}_prompt`);
const $passwordField = $(`#${uuid}_password`);
const $errorMsg = $(`#${uuid}_errorMsg`);

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

function showAddTimePopover(): void {
  $addTimePopover.show();
  isAddTimePopoverShown = true;
  $authPopover.hide();
  isAuthPopoverShown = false;
  $addTimePrompt.text("");
  $passwordField.val("");
}

function showAuthPopover(): void {
  $addTimePopover.hide();
  isAddTimePopoverShown = false;
  $authPopover.show();
  isAuthPopoverShown = true;
  $passwordField.focus();
  $errorMsg.hide();
}

function hidePopovers(): void {
  $addTimePopover.hide();
  isAddTimePopoverShown = false;
  $authPopover.hide();
  isAuthPopoverShown = false;
  $addTimePrompt.text("");
  $passwordField.val("");
}

async function confirmAddTime(): Promise<void> {
  if (pendingPasswordValidation) {
    return;
  }
  pendingPasswordValidation = true;
  const response = await sendAction(Action.validatePassword,
    { password: $passwordField.val() });
  if (response?.isPasswordValid) {
    sendAction(Action.addTime, { time: secondsToAdd });
    hidePopovers();
  } else {
    $errorMsg.show();
  }
  pendingPasswordValidation = false;
}

function checkIfSiteIsActive(siteData: Site): boolean {
  if (!siteData) {
    return false;
  }
  const videoSiteData = siteData.videoSiteData;
  if (videoSiteData && videoSiteData.timeVideoOnly) {
    const selectorFound = !!$(videoSiteData.selector).length;
    return selectorFound === videoSiteData.activateOnSelectorFound;
  } else {
    return true;
  }
}

var embeddedBlockSiteMap: Map<number, EmbeddedSite> = new Map();
var blockSiteIdCounter = 0;
function updateMatchingSites(forceUpdate: boolean = false) {
  const blockSiteList = tabExtConfig.blockSiteList;
  const logSiteList = tabExtConfig.useBlockSitesAsLogSites ?
    blockSiteList : tabExtConfig.logSiteList;
  const newEmbeddedBlockSiteMap: Map<number, EmbeddedSite> = new Map();
  const $iframes = $("iframe").toArray().map(iframe => $(iframe))
    .filter($iframe => $iframe.attr("src"));

  $iframes.forEach($iframe => {
    const iframeUrl = $iframe.attr("src");
    const existingId = parseInt($iframe.attr('data-blockSiteId'));
    if (!forceUpdate && 
        existingId !== undefined && embeddedBlockSiteMap.has(existingId)) {
      newEmbeddedBlockSiteMap.set(existingId, embeddedBlockSiteMap.get(existingId));
      return;
    }
    
    const matchingBlockSite = blockSiteList.find(site => iframeUrl.includes(site.url));
    let embeddedBlockSite: EmbeddedSite;
    if (matchingBlockSite) {
      const $iframeParent = $iframe.parent();
      $iframeParent.find(`.${uuid}_blockScreen`).remove();
      $iframeParent.append(
        getBlockScreenTemplate(uuid, $iframe.width(), $iframe.height())
      );
      embeddedBlockSite = {
        ...matchingBlockSite,
        videoSiteData: undefined, // cannot track video sites in iframes
        $iframe,
        $blockScreen: $iframeParent.find(`.${uuid}_blockScreen`)
      };
    }
    $iframe.attr('data-blockSiteId', blockSiteIdCounter.toString());
    newEmbeddedBlockSiteMap.set(blockSiteIdCounter, embeddedBlockSite);
    blockSiteIdCounter++;
  });
  embeddedBlockSiteMap = newEmbeddedBlockSiteMap;
  
  const newMatchingBlockSites =
    Array.from(newEmbeddedBlockSiteMap.values()).filter(site => site) as Site[];
  const tabBlockSite = blockSiteList.find(site => location.href.includes(site.url));
  if (tabBlockSite) {
    newMatchingBlockSites.push(tabBlockSite);
  }
  redirectOnTimeup = !!tabBlockSite;
  matchingBlockSites = newMatchingBlockSites;

  const newMatchingLogSites: Site[] = $iframes
    .map($iframe => logSiteList.find(site => $iframe.attr("src").includes(site.url)))
    .filter(site => site);
  const tabLogSite = logSiteList.find(site => location.href.includes(site.url));
  if (tabLogSite) {
    newMatchingLogSites.push(tabLogSite);
  }
  matchingLogSites = newMatchingLogSites;
}

function blockMatchingEmbeddedSites(): void {
  embeddedBlockSiteMap.forEach((site) => {
    try {
      if (site) {
        site.$iframe.remove();
        site.$blockScreen.attr("data-block-screen-mode", "block");
        activeBlockScreens.push(site.$blockScreen);
      }
    } catch (err) {
      console.error(err);
    }
  });
  embeddedBlockSiteMap = new Map();
}

function clearActiveBlockScreens(): void {
  activeBlockScreens.forEach($blockScreen => {
    $blockScreen.attr("data-block-screen-mode", "refresh");
  });
  activeBlockScreens = [];
}

async function updateTabTimerDisplay(): Promise<void> {
  if (tabExtConfig.isTimerEnabled && 
      (activeBlockScreens.length || matchingBlockSites.length)) {
    showTimer();
  } else {
    hideTimer();
  }
}