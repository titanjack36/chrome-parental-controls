export default function getBlockScreenTemplate(templateUuid: string, width: number, height: number): string {
  if (!templateUuid || !width || !height) {
    return '';
  }
  const uuid = templateUuid;
  return `
  <div class="${uuid}_blockScreen" data-block-screen-mode="hide"
    style="width: ${width}px; height: ${height}px;">
    <div class="${uuid}_blockMessage">
      You may not access this content while the timer is at zero.
    </div>
    <div class="${uuid}_refreshMessage">
      Please <button onclick="window.location.reload()">Refresh</button>
      to continue viewing content.
    </div>
  </div>
  `;
}