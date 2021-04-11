document.getElementById('dashboard-btn').onclick = function () {
  chrome.tabs.create({ url: chrome.extension.getURL('src/auth.html') });
}