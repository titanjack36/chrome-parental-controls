export interface TimerState {
  resetTimeValue: number;
  startTimeValue: number;
  startTimestamp?: number;
  isTimerRunning: boolean;
}

export interface TimerSave {
  resetTimeValue: number;
  timeRemaining: number;
  timeCreated: number;
}

export interface TimeOption {
  id: string;
  timeStr: string;
  fullTimeStr: string;
  timeInSecs: number;
}