import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  resetPassword: boolean = false;
  isAuthenticated: boolean = false;

  constructor(private authService: AuthService) {
  }

  async ngOnInit() {
    this.authService.setIsAuthReset(!await this.authService.hasPassword());
    this.authService.isAuthReset().subscribe(authReset => {
      this.resetPassword = authReset;
    });
    this.authService.isAuthenticated().subscribe(authStatus => {
      this.isAuthenticated = authStatus;
    });
  }
}
