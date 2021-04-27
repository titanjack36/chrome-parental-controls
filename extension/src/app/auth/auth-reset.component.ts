import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth-reset',
  templateUrl: 'auth-reset.component.html',
  styleUrls: [ './auth.component.css' ]
})
export class AuthResetComponent implements OnInit {
  isAuthenticated: boolean = false;
  currentPassword: string = '';
  newPassword: string = '';
  repeatedNewPassword: string = '';
  authError: string = '';
  authResetError: string = '';

  constructor(private authService: AuthService) { }

  async ngOnInit() {
    this.isAuthenticated = await this.authService.isAuthenticatedNow();
  }

  async handleSubmit() {
    if (!this.newPassword) {
      this.authResetError = 'New password cannot be empty.';
      this.authError = '';
      return;
    }
    if (this.newPassword !== this.repeatedNewPassword) {
      this.authResetError = 'Passwords do not match.';
      this.authError = '';
      return;
    }
    const success = await this.authService.setPassword(
      this.newPassword, this.currentPassword);
    if (!success) {
      this.authError = 'Incorrect password.';
      this.authResetError = '';
      return;
    }
    this.authError = '';
    this.authResetError = '';
    if (await this.authService.tryUnlock(this.newPassword)) {
      this.authService.setIsAuthReset(false);
    }
  }

  handleCancel() {
    if (this.isAuthenticated) {
      this.authService.setIsAuthReset(false);
    }
  }
}