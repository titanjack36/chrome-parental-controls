var port = chrome.runtime.connect({ name: "timer" });
var interval = setInterval(function () {
  port.postMessage({ action: 'getTime' });
}, 10000);
port.onMessage.addListener(function (msg) {
  if (msg && msg.timeRemaining !== undefined && msg.timeRemaining !== 0) {
    chrome.runtime.sendMessage({ action: 'restorePage' }, function (response) { });
  }
});