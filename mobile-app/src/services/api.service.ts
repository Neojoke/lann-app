import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface User {
  id: string;
  phone: string;
  name: string;
  kycStatus: string;
  creditLimit: number;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:8787';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  private loadUserFromStorage() {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Failed to parse user from storage', e);
      }
    }
  }

  sendOtp(phone: string): Observable<{ success: boolean; message: string; expiresIn: number }> {
    return this.http.post<{ success: boolean; message: string; expiresIn: number }>(
      `${this.baseUrl}/api/auth/send-otp`,
      { phone }
    );
  }

  verifyOtp(phone: string, otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/api/auth/verify-otp`,
      { phone, otp }
    ).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('current_user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserProfile(): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(
      `${this.baseUrl}/api/user/profile`,
      { headers: this.headers }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  getCreditInfo(): Observable<{ success: boolean; credit: { available: number; total: number; used: number } }> {
    return this.http.get<{ success: boolean; credit: { available: number; total: number; used: number } }>(
      `${this.baseUrl}/api/user/credit`,
      { headers: this.headers }
    );
  }

  createLoan(amount: number, days: number): Observable<{ success: boolean; loan: any }> {
    return this.http.post<{ success: boolean; loan: any }>(
      `${this.baseUrl}/api/loans`,
      { amount, days },
      { headers: this.headers }
    );
  }

  getLoans(): Observable<{ success: boolean; loans: any[] }> {
    return this.http.get<{ success: boolean; loans: any[] }>(
      `${this.baseUrl}/api/loans`,
      { headers: this.headers }
    );
  }

  getPendingRepayments(): Observable<{ success: boolean; pending: any[] }> {
    return this.http.get<{ success: boolean; pending: any[] }>(
      `${this.baseUrl}/api/repayments/pending`,
      { headers: this.headers }
    );
  }

  createRepayment(loanId: string, method: string): Observable<{ success: boolean; repayment: any }> {
    return this.http.post<{ success: boolean; repayment: any }>(
      `${this.baseUrl}/api/repayments`,
      { loanId, method },
      { headers: this.headers }
    );
  }
}
