/// <reference types="chrome"/>

import { Site } from "../models/config.interface";
import { Action } from "../models/message.interface";
import { TimerState } from "../models/timer.interface";

export async function getAllTabs(): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, tabs => {
      resolve(tabs.filter(tab => tab.id && tab.url !== undefined));
    });
  });
}

export async function sendActionToTab(tab: chrome.tabs.Tab, action: string, payload?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { action, ...payload },
      response => {
        resolve(response);
        let lastError = chrome.runtime.lastError;
        if (lastError) {
          return;
        }
      });
  });
}

export async function sendActionToAllTabs(action: string, payload?: any): Promise<any[]> {
  const tabs = await getAllTabs();
  const promises: Promise<any>[] = [];
  for (const tab of tabs) {
    promises.push(sendActionToTab(tab, action, payload));
  }
  return await Promise.all(promises);
}

export async function sendAction(action: string, payload?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({action, ...payload}, function (response) {
      resolve(response);
      let lastError = chrome.runtime.lastError;
      if (lastError) {
        return;
      }
    });
  });
}

export async function getActiveSites(): Promise<any> {
  let activeBlockSiteUrls: string[] = [];
  let activeLogSiteUrls: string[] = [];
  for (const tab of await getAllTabs()) {
    const response = await sendActionToTab(tab, Action.getActiveSitesFromTab);
    if (!response) {
      continue;
    }
    if (response.activeBlockSiteUrls) {
      activeBlockSiteUrls = activeBlockSiteUrls.concat(response.activeBlockSiteUrls);
    }
    if (response.activeLogSiteUrls) {
      activeLogSiteUrls = activeLogSiteUrls.concat(response.activeLogSiteUrls);
    }
  }
  return { activeBlockSiteUrls, activeLogSiteUrls };
}

// https://stackoverflow.com/a/5717133/11994724
export function isValidUrl(str: string): boolean {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

export function getMinValue(arr: number[]): number {
  let minValue;
  for (const num of arr) {
    if (minValue === undefined || (num !== undefined && num < minValue)) {
      minValue = num;
    }
  }
  return minValue;
}