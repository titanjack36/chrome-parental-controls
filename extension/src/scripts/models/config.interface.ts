export interface ExtConfig {
  isTimerEnabled: boolean;
  useAutoReset: boolean;
  timeBlockSitesOnly: boolean;
  useBreaks: boolean;
  useLogging: boolean;
  useBlockSitesAsLogSites: boolean;
  blockSiteList: Site[];
  logSiteList: Site[];
}

export interface Site {
  url: string;
  videoSiteData: VideoSiteData;
}

export interface EmbeddedSite extends Site {
  $iframe: any;
  $blockScreen: any;
}

export interface VideoSiteConfig {
  url: string;
  selector: string;
  activateOnSelectorFound: boolean;
}

export interface VideoSiteData extends VideoSiteConfig {
  timeVideoOnly: boolean;
}