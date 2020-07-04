chrome.runtime.sendMessage({ action: 'isLoggedIn' }, function (response) {
  if (!(response && response.isAuth)) {
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.update(tab.id, { url: chrome.extension.getURL('auth.html') });
    });
  }
});

$(document).ready(function () {
  $("#submitPassword").click(function () {
    submitPassword();
  });
  $("#confirmPassword").on('keyup', function (e) {
    if (e.keyCode === 13) {
      submitPassword();
    }
  });
});

function submitPassword() {
  const newPassword = $("#newPassword").val();
  const confirmPassword = $("#confirmPassword").val();
  if (newPassword.length > 0 && newPassword === confirmPassword) {
    chrome.storage.local.set({ password: newPassword }, function () { });
    chrome.runtime.sendMessage({ action: 'login' }, function (response) { });
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.update(tab.id, { url: chrome.extension.getURL('settings.html') });
    });
  }
}