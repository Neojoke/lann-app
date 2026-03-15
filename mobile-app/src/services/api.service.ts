import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  sendOtp(phone: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/send-otp`, { phone });
  }

  verifyOtp(phone: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify-otp`, { phone, otp });
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/profile`);
  }

  getCreditInfo(): Observable<any> {
    return this.http.get(`${this.baseUrl}/user/credit`);
  }

  getLoans(): Observable<any> {
    return this.http.get(`${this.baseUrl}/loans`);
  }

  getPendingRepayments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/repayments/pending`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/user/profile`, data);
  }
}
