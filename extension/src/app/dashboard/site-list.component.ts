import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Site, VideoSiteConfig, VideoSiteData } from 'src/scripts/models/config.interface';
import { isValidUrl } from 'src/scripts/utils/extension.util';
import * as videoSitesConfig from '../../config/video-sites.json';

@Component({
  selector: 'app-site-list',
  templateUrl: 'site-list.component.html',
  styleUrls: ['site-list.component.css']
})
export class SiteListComponent implements OnInit {
  @Input() siteList: Site[] = [];
  @Input() showVideoOption: boolean = false;
  @Output() onSiteListChange = new EventEmitter<void>();

  inputSiteUrl: string = '';
  addSiteError: string = undefined;

  constructor() { }

  ngOnInit() { }

  handleAddSite(): void {
    if (isValidUrl(this.inputSiteUrl)) {
      this.siteList.push({ 
        url: this.inputSiteUrl,
        videoSiteData: this.getVideoSiteData(this.inputSiteUrl) 
      });
      this.inputSiteUrl = '';
      this.addSiteError = '';
      this.onSiteListChange.emit();
    } else {
      this.addSiteError = 'URL is invalid';
    }
  }

  handleDeleteSite(siteIndex: number): void {
    if (!this.siteList[siteIndex]) {
      return;
    }
    this.siteList.splice(siteIndex, 1);
    this.onSiteListChange.emit();
  }

  handleDisableVideoSetting(siteIndex: number): void {
    if (!this.siteList[siteIndex]?.videoSiteData) {
      return;
    }
    this.siteList[siteIndex].videoSiteData.timeVideoOnly = false;
    this.onSiteListChange.emit();
  }

  handleEnableVideoSetting(siteIndex: number): void {
    if (!this.siteList[siteIndex]?.videoSiteData) {
      return;
    }
    this.siteList[siteIndex].videoSiteData.timeVideoOnly = true;
    this.onSiteListChange.emit();
  }

  private getVideoSiteData(url: string): VideoSiteData {
    const videoSitesList: VideoSiteConfig[] = (videoSitesConfig as any).default;
    const videoSiteConfig: VideoSiteConfig = videoSitesList.find(site => url.includes(site.url));
    if (!videoSiteConfig) {
      return undefined;
    }
    return {
      ...videoSiteConfig,
      timeVideoOnly: false
    } as VideoSiteData;
  }
}