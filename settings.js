var isTimerActive = false;
var $toggleTimerSwitch;
var $inputHr;
var $inputMin;
var $inputSec;
var lastRecordedTime;
var wasTimerEdited = false;

var watchSiteList = [];
var videoSites = [];

const listBtnRegex = /[A-Za-z]+([0-9])/;

chrome.runtime.sendMessage({ action: 'isLoggedIn' }, function (response) {
  if (!(response && response.isAuth)) {
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.update(tab.id, { url: chrome.extension.getURL('auth.html') });
    });
  }
});
chrome.runtime.sendMessage({ action: 'getTimerState' }, function (response) {
  if (response && response.timeRemaining != null) {
    updateTimer(response.timeRemaining);
    toggleTimer(response.isTimerActive);
    if ($toggleTimerSwitch) {
      $toggleTimerSwitch.prop("checked", response.isTimerActive);
    }
  }
});
chrome.runtime.sendMessage({ action: 'getWatchSiteListAndVideoSites' },
  function (response) {
    if (response) {
      if (response.watchSiteList) {
        watchSiteList = response.watchSiteList;
      }
      if (response.videoSites) {
        videoSites = response.videoSites;
      }
      updateWatchSiteList();
    }
  });

var port = chrome.runtime.connect({ name: "timer" });
var interval = setInterval(function () {
  port.postMessage({ action: 'getTime' });
}, 100);
port.onMessage.addListener(function (msg) {
  if (msg && msg.timeRemaining != null && isTimerActive) {
    updateTimer(msg.timeRemaining);
  }
});

$(document).ready(function () {
  $toggleTimerSwitch = $("#toggleTimer");
  $inputHr = $("#inputHr");
  $inputMin = $("#inputMin");
  $inputSec = $("#inputSec");

  $toggleTimerSwitch.change(function () {
    toggleTimer(this.checked);
  });

  $inputHr.on('input propertychange paste', function () {
    wasTimerEdited = true;
  });

  $inputMin.on('input propertychange paste', function () {
    wasTimerEdited = true;
  });

  $inputSec.on('input propertychange paste', function () {
    wasTimerEdited = true;
  });

  $("#resetTimer").click(function () {
    resetTimer();
  });

  $("#changePassword").click(function () {
    chrome.runtime.sendMessage({ action: 'login' }, function (response) { });
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.update(tab.id, { url: chrome.extension.getURL('auth-reset.html') });
    });
  });

  $("#addSiteBtn").click(function () {
    const $inputSiteUrl = $("#inputSiteUrl");
    if ($inputSiteUrl) {
      const isAddSuccessful =
        createNewWatchSiteItem($inputSiteUrl.val());
      if (isAddSuccessful) {
        $("#addSiteModal").modal('hide');
        $inputSiteUrl.val('');
      } else {
        invalidateInputSiteUrl();
      }
    }
  });

  $('body').on('click', '.video-only-site-btn', event => {
    const idMatch = listBtnRegex.exec(event.target.id);
    if (idMatch) {
      $('[data-toggle="popover"]').popover('hide');
      const index = +idMatch[1];
      const siteItem = watchSiteList[index];
      siteItem.timeVideoOnly = !siteItem.timeVideoOnly;
      updateWatchSiteList();
    }
  });

  $('body').on('click', '.confirm-delete-site-btn', event => {
    const idMatch = listBtnRegex.exec(event.target.id);
    if (idMatch) {
      $('[data-toggle="popover"]').popover('hide');
      const index = +idMatch[1];
      watchSiteList.splice(index, 1);
      updateWatchSiteList();
    }
  });

  $('body').on('click', function (e) {
    if ($(e.target).data('toggle') !== 'popover' &&
      $(e.target).parents('[data-toggle="popover"]').length === 0 &&
      $(e.target).parents('.popover').length === 0) {
      $('[data-toggle="popover"]').popover('hide');
    }
  });
});

function toggleTimer(isSetToRun) {
  if ($inputHr && $inputMin && $inputSec) {
    $inputHr.prop('disabled', isSetToRun);
    $inputMin.prop('disabled', isSetToRun);
    $inputSec.prop('disabled', isSetToRun);
    const timeRemaining = +$inputHr.val() * 3600 + +$inputMin.val() * 60
      + +$inputSec.val();

    if (isSetToRun) {
      if (wasTimerEdited && timeRemaining !== lastRecordedTime) {
        chrome.runtime.sendMessage({
          action: 'setTime', time: timeRemaining,
          baseTime: timeRemaining
        },
          function (response) { });
      }
    } else {
      lastRecordedTime = timeRemaining;
      wasTimerEdited = false;
    }

    isTimerActive = isSetToRun;
    chrome.runtime.sendMessage({ action: isSetToRun ? 'activateTimer' : 'deactivateTimer' },
      function (response) { });
  }
}

function resetTimer() {
  chrome.runtime.sendMessage({ action: 'getBaseTime' }, function (response) {
    let baseTime = (response && response.baseTime) ? response.baseTime : 0;
    chrome.runtime.sendMessage({ action: 'setTime', time: baseTime },
      function (response) { });
    updateTimer(baseTime);
  });
}

function updateTimer(newTime) {
  if ($inputHr && $inputMin && $inputSec) {
    $inputHr.val(addPrefixZero(Math.floor(newTime / 3600)));
    $inputMin.val(addPrefixZero(Math.floor(newTime % 3600 / 60)));
    $inputSec.val(addPrefixZero(Math.floor(newTime % 60)));
  }
}

function addPrefixZero(num) {
  return ("0" + num).slice(-2);
}

function createNewWatchSiteItem(url) {
  if (!validURL(url)) {
    return false;
  }
  watchSiteList.push({ url: url, isVideoSite: isVideoSite(url), timeVideoOnly: false });
  updateWatchSiteList();
  return true;
}

function updateWatchSiteList() {
  chrome.runtime.sendMessage({ action: 'setWatchSiteList', watchSiteList: watchSiteList },
    function (response) { });
  const watchSiteListHtml = watchSiteList.reduce((listHtml, site) => {
    return (listHtml + `
    <div class="list-item col">
      <div class="url">${encodeHTML(site.url)}</div>
      <div class="actions d-flex">
        ${site.isVideoSite ?
        `<button type="button" class="video-site-btn" data-toggle="popover">
          <img src="assets/icons/video-icon.svg" alt="Video Site Options">
        </button>` : ''}
        <button type="button" class="delete-site-btn" data-toggle="popover">
          <img src="assets/icons/close-icon.svg">
        </button>
      </div>
    </div>`);
  }, '');
  updateWatchSiteListPopovers(watchSiteListHtml);
}

function updateWatchSiteListPopovers(watchSiteListHtml) {
  const $watchSiteList = $("#watchSiteList");
  if ($watchSiteList) {
    $watchSiteList.html(watchSiteListHtml);

    const $listItems = $watchSiteList.find('.list-item');
    $listItems.each((index, item) => {
      const site = watchSiteList[index];
      const action = site.timeVideoOnly ? 'Disable' : 'Enable';
      const prompt = site.timeVideoOnly ?
        'Countdown timer will only activate when watching video.' :
        'Enable countdown timer only when watching video?';
      $(item).find('.video-site-btn').popover({
        container: 'body',
        placement: 'bottom',
        title: 'Video Site Options',
        html: true,
        sanitize: false,
        content:
          `<div>${prompt}</div>
          <button type="button" id="videoSiteOnlyBtn${index}"
            class="btn btn-secondary mt-2 video-only-site-btn">
            Click to ${action}
          </button>`
      });

      $(item).find('.delete-site-btn').popover({
        container: 'body',
        placement: 'right',
        html: true,
        sanitize: false,
        content:
          `<button type="button" id="confirmDeleteSiteBtn${index}"
            class="btn btn-danger confirm-delete-site-btn">
            Confirm Delete
          </button>`
      });
    });
  }
}

function encodeHTML(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

function invalidateInputSiteUrl() {
  const $inputSiteUrl = $("#inputSiteUrl");
  const $inputSiteUrlHelp = $("#inputSiteUrlHelp");
  if ($inputSiteUrl && $inputSiteUrlHelp) {
    $inputSiteUrl.addClass("is-invalid");
    $inputSiteUrlHelp.text("URL is invalid.");
  }
}

function isVideoSite(url) {
  return !!videoSites.find(site => url.includes(site.url));
}