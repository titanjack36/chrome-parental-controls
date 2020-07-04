var backgroundImages = [
  "background1.jpg",
  "background2.jpg",
  "background3.jpg",
  "background4.jpg",
  "background5.jpg",
];

document.addEventListener("DOMContentLoaded", function (event) {
  let randIndex = Math.floor(Math.random() * 5);
  let body = document.getElementsByTagName('body')[0];
  body.style.backgroundImage = "url(assets/" + backgroundImages[randIndex] + ")";
});

var port = chrome.runtime.connect({ name: "timer" });
var interval = setInterval(function () {
  port.postMessage({ action: 'getTime' });
}, 10000);
port.onMessage.addListener(function (msg) {
  if (msg && msg.timeRemaining !== undefined && msg.timeRemaining !== 0) {
    chrome.runtime.sendMessage({ action: 'restorePage' }, function (response) { });
  }
});