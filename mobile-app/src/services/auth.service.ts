import { Injectable } from '@angular/core';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private currentUserValue: User | null = null;

  get currentUser(): User | null {
    if (!this.currentUserValue) {
      const stored = localStorage.getItem('current_user');
      if (stored) this.currentUserValue = JSON.parse(stored);
    }
    return this.currentUserValue;
  }

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  setCurrentUser(user: User): void {
    this.currentUserValue = user;
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('current_user');
    this.currentUserValue = null;
  }
}
