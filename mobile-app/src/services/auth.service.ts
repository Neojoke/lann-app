// Ionic React 不使用 Injectable 装饰器
// 使用普通 TypeScript 类 + 单例模式

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

// Ionic React 单例模式
export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async sendOtp(phone: string): Promise<SendOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error('Failed to send OTP');
    }

    return response.json();
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
      throw new Error('Failed to verify OTP');
    }

    const data = await response.json();
    if (data.token) {
      this.token = data.token;
    }
    return data;
  }

  async login(phone: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    if (data.token) {
      this.token = data.token;
    }
    return data;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}
