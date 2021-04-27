import $ from 'jquery';
import { Action } from '../scripts/models/message.interface';
import { TimeOption } from '../scripts/models/timer.interface';
import { sendAction } from '../scripts/utils/extension.util';
import * as backgroundImgUrlConfig from '../config/background-image-urls.json';
import * as timeOptionsConfig from '../config/time-options.json';

const backgroundImageUrls: string[] = (backgroundImgUrlConfig as any).default;
const timeOptions: TimeOption[] = (timeOptionsConfig as any).default;

document.addEventListener("DOMContentLoaded", function (event: any): void {
  const img = new Image();
  img.onload = function () {
    $('#splashScreen').addClass('fadeout');
    $("body").css('backgroundImage', `url(${img.src})`);
  }
  const randIndex = Math.floor(Math.random() * backgroundImageUrls.length);
  img.src = backgroundImageUrls[randIndex];
});

var getTimeInterval = setInterval(async function () {
  const timeRemaining = await sendAction(Action.getTimeRemaining);
  const extConfig = await sendAction(Action.getExtConfig);
  if ((extConfig && !extConfig.isTimerEnabled) || timeRemaining > 0) {
    sendAction(Action.restorePage);
  }
}, 5000);

var secondsToAdd = 0;
var pendingPasswordValidation = false;
var $passwordField;
var $authSection;
var $errorMsg;

$(document).ready(function () {
  $passwordField = $("#password");
  $authSection = $("#auth");
  $errorMsg = $("#errorMsg");

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
    $(".timeOption").each((idx, option) => {
      $(option).removeClass("selected")
    });
    $this.addClass("selected");
    $authSection.show();
    $passwordField.focus();
    $errorMsg.hide();
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

async function confirmAddTime() {
  if (pendingPasswordValidation) {
    return;
  }
  pendingPasswordValidation = true;
  const response = await sendAction(Action.validatePassword, 
    { password: $passwordField.val() });
  if (response?.isPasswordValid) {
    sendAction(Action.addTime, { time: secondsToAdd });
    $(".timeOption").each((idx, option) => {
      $(option).removeClass("selected")
    });
    $authSection.hide();
    $errorMsg.hide();
    sendAction(Action.restorePage);
  } else {
    $errorMsg.show();
  }
  pendingPasswordValidation = false;
}