import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: 'auth.component.html',
  styleUrls: ['./auth.component.css' ],
})
export class AuthComponent implements OnInit {
  password: string = '';

  constructor(private authService: AuthService) { }

  ngOnInit() { }

  onContinue() {
    this.authService.tryUnlock(this.password);
  }
}