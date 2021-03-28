const backgroundImages = [
  "background1.jpg",
  "background2.jpg",
  "background3.jpg",
  "background4.jpg"
];
const hoursToSeconds = 3600;

document.addEventListener("DOMContentLoaded", function (event) {
  let randIndex = Math.floor(Math.random() * backgroundImages.length);
  let body = document.getElementsByTagName('body')[0];
  let splashScreen = document.getElementById('splashScreen');
  var img = new Image();
  img.onload = function () {
    splashScreen.classList.add('fadeout');
    body.style.backgroundImage = `url(${this.src})`;
  }
  img.src = `assets/${backgroundImages[randIndex]}`;
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
var hoursToAdd = 0;
var pendingPasswordValidation = false;
var $passwordField;
var $authSection;

$(document).ready(function () {
  $passwordField = $("#password");
  $authSection = $("#auth");

  $(".timeOption").click(function () {
    const $this = $(this);
    switch($this.attr("id")) {
      case "select15Min":
        hoursToAdd = 0.25;
        break;
      case "select30Min":
        hoursToAdd = 0.5;
        break;
      case "select45Min":
        hoursToAdd = 0.75;
        break;
      case "select1Hr":
        hoursToAdd = 1;
        break;
      case "select1_5Hr":
        hoursToAdd = 1.5;
        break;
      case "select2Hr":
        hoursToAdd = 2;
        break;
      default:
        hoursToAdd = 0;
    }
    $(".timeOption").each((idx, option) => $(option).removeClass("selected"));
    if (hoursToAdd != 0) {
      $this.addClass("selected");
      $authSection.show();
    }
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
      sendAction('addTime', { time: hoursToAdd * hoursToSeconds });
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