function onSettingsButtonClick() {
  chrome.tabs.create({ url: chrome.extension.getURL('auth.html') });
}

document.getElementById('settings-btn').onclick = onSettingsButtonClick;