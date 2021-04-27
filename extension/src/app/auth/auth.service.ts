import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { sendAction } from '../../scripts/utils/extension.util';
import { Action } from '../../scripts/models/message.interface';

@Injectable({providedIn: 'root'})
export class AuthService {
  private authState: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private authReset: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor() { }
  
  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }

  isAuthReset(): Observable<boolean> {
    return this.authReset.asObservable();
  }

  setIsAuthReset(isAuthReset: boolean) {
    this.authReset.next(isAuthReset);
  }

  async hasPassword(): Promise<boolean> {
    const response = await sendAction(Action.checkPasswordExists);
    return !!response?.hasPassword;
  }

  async setPassword(newPassword: string, currentPassword?: string): Promise<boolean> {
    const response = await sendAction(Action.setPassword, { newPassword, currentPassword });
    return !!response?.success;
  }

  async tryUnlock(password): Promise<boolean> {
    const response = await sendAction(Action.validatePassword, { password });
    const newAuthState: boolean = !!response?.isPasswordValid;
    this.authState.next(newAuthState);
    return newAuthState;
  }

  lock() {
    this.authState.next(false);
  }
}