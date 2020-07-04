var savedPassword;

chrome.storage.local.get(['password'], function (result) {
  if (result && result.password) {
    savedPassword = result.password;
  } else {
    setAuthenticated(true);
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.update(tab.id, { url: chrome.extension.getURL('auth-reset.html') });
    });
  }
});

$(document).ready(function () {
  $("#submitPassword").click(function () {
    submitPassword();
  });
  $("#inputPassword").on('keyup', function (e) {
    if (e.keyCode === 13) {
      submitPassword();
    }
  });
});

function submitPassword() {
  const password = $("#inputPassword").val();
  if (password === savedPassword) {
    setAuthenticated(true);
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.update(tab.id, { url: chrome.extension.getURL('settings.html') });
    });
  }
}

function setAuthenticated(isAuth) {
  chrome.runtime.sendMessage({ action: 'login' }, function (response) { });
}