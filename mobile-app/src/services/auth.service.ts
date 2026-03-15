import { Injectable } from '@ionic/react';

export interface LoginRequest {
  phone: string;
  otp: string;
}

export interface SendOtpRequest {
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    phone: string;
    name: string;
    kycStatus: string;
    creditLimit: number;
  };
  token: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  debug?: {
    otp: string;
    note: string;
  };
}

const API_BASE_URL = 'http://localhost:8787';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token: string | null = null;

  constructor() {}

  async sendOtp(phone: string): Promise<SendOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error('发送 OTP 失败');
    }

    return await response.json();
  }

  async verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, otp }),
    });

    if (!response.ok) {
      throw new Error('验证 OTP 失败');
    }

    const data = await response.json();
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async getCurrentUser(): Promise<any> {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }

    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      return null;
    }
  }
}
