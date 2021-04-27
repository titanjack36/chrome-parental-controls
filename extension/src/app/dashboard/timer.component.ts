import { Component, OnInit, ViewChild } from '@angular/core';
import { Action } from 'src/scripts/models/message.interface';
import { TimerState } from 'src/scripts/models/timer.interface';
import { sendAction } from 'src/scripts/utils/extension.util';
import Timer from 'src/scripts/utils/timer.util';

@Component({
  selector: 'app-timer',
  templateUrl: 'timer.component.html',
  styleUrls: [ './timer.component.css' ]
})
export class TimerComponent implements OnInit {
  @ViewChild('timerInput') timerInput; 

  private timer: Timer = new Timer();

  isEditingTimer: boolean = false;
  wasTimerEdited: boolean = false;
  timerBeforeEdit: TimerDisplay;
  timerDisplay: TimerDisplay = {
    secOnes: { value: 0, greyedOut: false },
    secTens: { value: 0, greyedOut: false },
    minOnes: { value: 0, greyedOut: false },
    minTens: { value: 0, greyedOut: false },
    hrOnes: { value: 0, greyedOut: false },
    hrTens: { value: 0, greyedOut: false }
  };

  constructor() { }

  async ngOnInit() {
    const timerState = await sendAction(Action.getTimerState);
    if (timerState) {
      this.timer.sync(timerState);
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      let response: any = {};
      if (!request || !request.action) {
        sendResponse(response);
        return true;
      }
      switch (request.action) {
        case Action.startTimer:
          if (request.timerState) {
            this.timer.sync(request.timerState);
            this.timer.start();
          }
          break;
        
        case Action.stopTimer:
          this.timer.stop();
          response = this.timer.getTimerState().startTimeValue;
          break;

        case Action.setTimerState:
          if (request.timerState) {
            this.timer.sync(request.timerState);
          }
          break;
      }
      sendResponse(response);
      return true;
    });

    let updateTimerInterval = setInterval(() => {
      if (this.isEditingTimer) {
        return;
      }
      this.updateTimerDisplay();
    }, 100);
  }

  handleEdit() {
    this.timerBeforeEdit = this.timerDisplay;
    for (const digit in this.timerDisplay) {
      this.timerDisplay[digit].greyedOut = true;
    }
    this.isEditingTimer = true;
    this.timerInput?.nativeElement?.focus();
  }

  async handleSaveEdit() {
    if (this.wasTimerEdited) {
      const { secOnes, secTens, minOnes, minTens, hrOnes, hrTens } = this.timerDisplay;
      const hours = hrTens.value * 10 + hrOnes.value;
      const minutes = minTens.value * 10 + minOnes.value;
      const seconds = secTens.value * 10 + secOnes.value;
      const newTime = hours * 3600 + minutes * 60 + seconds;
      
      this.timer.setTime(newTime);
      sendAction(Action.setTimerState, { timerState: this.timer.getTimerState() });
    }
    this.handleStopEdit();
  }

  handleStopEdit() {
    if (!this.isEditingTimer) {
      return;
    }
    for (const digit in this.timerDisplay) {
      this.timerDisplay[digit].greyedOut = false;
    }
    this.isEditingTimer = false;
    this.wasTimerEdited = false;
    this.updateTimerDisplay();
  }

  handleTimerAddDigit(event: any) {
    const numPattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.keyCode);
    if (!numPattern.test(inputChar)) {
      return;
    }
    if (!this.wasTimerEdited) {
      for (const digit in this.timerDisplay) {
        this.timerDisplay[digit].value = 0;
      }
      this.wasTimerEdited = true;
    }
    let carryOver: TimerDigit = { value: parseInt(inputChar), greyedOut: false };
    for (const digit in this.timerDisplay) {
      [this.timerDisplay[digit], carryOver] = [carryOver, this.timerDisplay[digit]];
    }
  }

  handleTimerRemoveDigit() {
    let carryOver: TimerDigit = { value: 0, greyedOut: true };
    for (const digit of Object.keys(this.timerDisplay).reverse()) {
      [this.timerDisplay[digit], carryOver] = [carryOver, this.timerDisplay[digit]];
    }
  }

  handleReset() {
    this.timer.reset();
    sendAction(Action.setTimerState, { timerState: this.timer.getTimerState() });
    this.updateTimerDisplay();
  }

  private updateTimerDisplay() {
    const timeStr = this.timer.getFormattedTime();
    const { secOnes, secTens, minOnes, minTens, hrOnes, hrTens } = this.timerDisplay;
    secOnes.value = +timeStr[9];
    secTens.value = +timeStr[8];
    minOnes.value = +timeStr[5];
    minTens.value = +timeStr[4];
    hrOnes.value = +timeStr[1];
    hrTens.value = +timeStr[0];
  }
}

interface TimerDisplay {
  secOnes: TimerDigit;
  secTens: TimerDigit;
  minOnes: TimerDigit;
  minTens: TimerDigit;
  hrOnes: TimerDigit;
  hrTens: TimerDigit;
}

interface TimerDigit {
  value: number;
  greyedOut: boolean;
}