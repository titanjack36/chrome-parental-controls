var backgroundImages = [
  "background1.jpg",
  "background2.jpg",
  "background3.jpg",
  "background4.jpg",
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
  img.src = `assets/${backgroundImages[randIndex]}`;
});

var port = chrome.runtime.connect({ name: "timer" });
var interval = setInterval(function () {
  port.postMessage({ action: 'getTime' });
}, 10000);
port.onMessage.addListener(function (msg) {
  if (msg && ((msg.timeRemaining !== undefined && msg.timeRemaining !== 0)
    || !msg.isTimerActive)) {
    chrome.runtime.sendMessage({ action: 'restorePage' }, function (response) { });
  }
});