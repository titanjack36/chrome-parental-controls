const backgroundImages = [
  "background1.jpg",
  "background2.jpg",
  "background3.jpg",
  "background4.jpg"
];
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

document.addEventListener("DOMContentLoaded", function (event) {
  let randIndex = Math.floor(Math.random() * backgroundImages.length);
  let body = document.getElementsByTagName('body')[0];
  let splashScreen = document.getElementById('splashScreen');
  var img = new Image();
  img.onload = function () {
    splashScreen.classList.add('fadeout');
    body.style.backgroundImage = `url(${this.src})`;
  }
  img.src = `../assets/${backgroundImages[randIndex]}`;
});

var port = chrome.runtime.connect({ name: "timer" });
var interval = setInterval(function () {
  port.postMessage({ action: 'getTime' });
}, 10000);
port.onMessage.addListener(function (msg) {
  if (msg && ((msg.timeRemaining !== undefined && msg.timeRemaining !== 0) 
      || !msg.isTimerActive)) {
    sendAction('restorePage', {});
  }
});

var isAuthShown = false;
var secondsToAdd = 0;
var pendingPasswordValidation = false;
var $passwordField;
var $authSection;

$(document).ready(function () {
  $passwordField = $("#password");
  $authSection = $("#auth");

  $("#timeOptionGroup").append(
    timeOptions.map(
      option => `<button class="timeOption" id="${option.id}">${option.timeStr}</button>`
    ).reduce((optionsGroup, optionHtml) => optionsGroup + optionHtml, "")
  );

  $(".timeOption").click(function () {
    const $this = $(this);
    const selectedOption = timeOptions.find(option => option.id === $this.attr("id"));
    if (!selectedOption) {
      return;
    }
    secondsToAdd = selectedOption.timeInSecs;
    $(".timeOption").each((idx, option) => $(option).removeClass("selected"));
    $this.addClass("selected");
    $authSection.show();
    $passwordField.focus();
  });

  $(`#confirmBtn`).click(function () {
    confirmAddTime();
  });

  $("#password").on('keyup', function (e) {
    if (e.keyCode === 13) {
      confirmAddTime();
    }
  });
});

function confirmAddTime() {
  if (pendingPasswordValidation) {
    return;
  }
  pendingPasswordValidation = true;
  chrome.runtime.sendMessage({ action: 'validatePassword', password: $passwordField.val() },
  response => {
    if (response && response.isPasswordValid) {
      sendAction('addTime', { time: secondsToAdd });
      $(".timeOption").each((idx, option) => $(option).removeClass("selected"));
      $authSection.hide();
      sendAction('restorePage', {});
    }
    pendingPasswordValidation = false;
  });
}

function sendAction(action, payload) {
  chrome.runtime.sendMessage({action, ...payload}, function (response) { });
}