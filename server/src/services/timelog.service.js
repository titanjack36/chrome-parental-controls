const differenceInSeconds = require('date-fns/differenceInSeconds');
const isSameDay = require('date-fns/isSameDay');
const activeSiteExpiryTime = 60;

class TimelogService {
  instanceMap = new Map();
  newSiteCounter = 0;
  lastRecordedTime = new Date();

  getActiveSite = (siteUrl, extensionId, currentStartTime) => {
    const currentTime = new Date();
    if (!isSameDay(currentTime, this.lastRecordedTime)) {
      // Ensure website duration does not span across days
      this.instanceMap = new Map();
      this.newSiteCounter = 0;
    }
    this.lastRecordedTime = currentTime;

    let activeSiteMap = this.instanceMap.get(extensionId);
    if (!activeSiteMap) {
      return null;
    }
    let activeSiteData = activeSiteMap.get(siteUrl);
    if (!activeSiteData || differenceInSeconds(currentStartTime,
        activeSiteData.lastActiveTime) > activeSiteExpiryTime) {
      return null;
    }
    return activeSiteData;
  }

  setActiveSite = (id, endTime, siteUrl, extensionId) => {
    let activeSiteMap = this.instanceMap.get(extensionId);
    if (!activeSiteMap) {
      activeSiteMap = new Map();
      this.instanceMap.set(extensionId, activeSiteMap);
    }
    let activeSiteData = activeSiteMap.get(siteUrl);
    if (!activeSiteData) {
      this.newSiteCounter++;
      activeSiteData = { id, lastActiveTime: endTime };
      activeSiteMap.set(siteUrl, activeSiteData);
    } else {
      activeSiteData.id = id;
      activeSiteData.lastActiveTime = endTime;
    }

    if (this.newSiteCounter >= 500) {
      this.cleanInactiveSites();
      this.newSiteCounter = 0;
    }
  };

  cleanInactiveSites = (expiryTime) => {
    this.instanceMap.forEach((activeSiteMap, extensionId) => {
      activeSiteMap.forEach((activeSiteData, siteUrl) => {
        if (differenceInSeconds(
            activeSiteData.lastActiveTime, expiryTime) > activeSiteExpiryTime) {
          activeSiteMap.delete(siteUrl);
        }
      });
      if (activeSiteMap.size === 0) {
        this.instanceMap.delete(extensionId);
      }
    });
  }
}

module.exports = new TimelogService();