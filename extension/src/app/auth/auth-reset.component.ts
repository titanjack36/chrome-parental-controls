import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth-reset',
  templateUrl: 'auth-reset.component.html',
  styleUrls: [ './auth.component.css' ]
})
export class AuthResetComponent implements OnInit {
  hasExistingPassword: boolean = false;
  currentPassword: string = '';
  newPassword: string = '';
  repeatedNewPassword: string = '';

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    this.hasExistingPassword = await this.authService.hasPassword();
  }

  async onSubmit() {
    if (this.newPassword && this.newPassword === this.repeatedNewPassword) {
      await this.authService.setPassword(
        this.newPassword, this.currentPassword);
      if (await this.authService.tryUnlock(this.newPassword)) {
        this.authService.setIsAuthReset(false);
      }
    }
  }
}