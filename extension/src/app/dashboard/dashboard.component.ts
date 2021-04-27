import { Component, OnInit } from '@angular/core';
import { ExtConfig } from 'src/scripts/models/config.interface';
import { Action } from 'src/scripts/models/message.interface';
import { TimerState } from 'src/scripts/models/timer.interface';
import { sendAction } from 'src/scripts/utils/extension.util';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['./dashboard.component.css' ],
})
export class DashboardComponent implements OnInit {
  extConfig: ExtConfig = {
    isTimerEnabled: false,
    useAutoReset: false,
    timeBlockSitesOnly: false,
    useBreaks: false,
    useLogging: false,
    useBlockSitesAsLogSites: false,
    blockSiteList: [],
    logSiteList: []
  };

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    this.extConfig = await sendAction(Action.getExtConfig) || this.extConfig;
  }

  handleUpdateExtConfig() {
    sendAction(Action.updateExtConfig, this.extConfig);
  }

  handleChangePassword() {
    this.authService.setIsAuthReset(true);
  }
}