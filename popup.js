document.getElementById('dashboard-btn').onclick = function () {
  chrome.tabs.create({ url: chrome.extension.getURL('auth.html') });
}