import { TimeOption } from "../models/timer.interface";

export default function getTimerTemplate(templateUuid: string, timeOptions: TimeOption[]): string {
  if (!templateUuid || !timeOptions) {
    return '';
  }
  const uuid = templateUuid;
  const popoverSizeCss = getPopoverSizeCss(timeOptions.length);
  return `
  <div id="${uuid}_mainWrapper">
    <div id="${uuid}_addTimePopover" class="${uuid}_popover" style="${popoverSizeCss}">
      <div class="${uuid}_title">Add Time</div>
      <div id="${uuid}_timeOptionGroup">
        ${
          timeOptions.map(option => {
            return `
            <button class="${uuid}_timeOption" id="${uuid}_${option.id}">
              ${option.timeStr}
            </button>
            `;
          }).reduce((optionsGroup, optionHtml) => optionsGroup + optionHtml, "")
        }
      </div>
    </div>
    <div id="${uuid}_authPopover" class="${uuid}_popover" style="${popoverSizeCss}">
      <div id="${uuid}_authWrapper">
        <div class="${uuid}_title">Enter Password</div>
        <div id="${uuid}_passwordWrapper">
          <input type="password" id="${uuid}_password">
          <div id="${uuid}_errorMsg">Invalid password.</div>
        </div>
        <div id="${uuid}_prompt"></div>
        <div class="${uuid}_buttonRow">
          <button class="${uuid}_action" id="${uuid}_backBtn">Back</button>
          <button class="${uuid}_action" id="${uuid}_confirmBtn">Confirm</button>
        </div>
      </div>
    </div>
    <div id="${uuid}_timer">
      <span id="${uuid}_time">00h 00m 00s</span>
      <button id="${uuid}_addTimeBtn">+</button>
    </div>
  </div>
  `;
}

function getPopoverSizeCss(numTimeOptions: number): string {
  const timeOptionDimensions = 100;
  const titleHeight = 30;
  const padding = 20;

  // Behaviour:
  // # Options    Row Count   Col Count
  // 1            1           1
  // 2            2           1
  // 3            2           2
  // 4            2           2
  // 5            3           2
  // ...
  const rowCount = Math.ceil(Math.sqrt(numTimeOptions));
  const colCount = Math.ceil(numTimeOptions / rowCount);
  const popoverWidth = timeOptionDimensions * rowCount + padding;
  const popoverHeight = timeOptionDimensions * colCount + padding + titleHeight;

  return `width: ${popoverWidth}px; height: ${popoverHeight}px`;
}