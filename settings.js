var isTimerActive = false;
var $toggleTimerSwitch;
var $inputHr;
var $inputMin;
var $inputSec;
var lastRecordedTime;
var wasTimerEdited = false;

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