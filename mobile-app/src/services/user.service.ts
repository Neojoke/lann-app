// Ionic React 不使用 Injectable 装饰器
// 使用普通 TypeScript 类

import { ApiClient } from './api.client';

export interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  creditScore?: number;
  creditLimit?: number;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

// Ionic React 单例模式
export class UserService extends ApiClient {
  private static instance: UserService;

  private constructor() {
    super();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * 获取用户资料
   */
  async getProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/api/user/profile');
  }

  /**
   * 更新用户资料
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return this.put<UserProfile>('/api/user/profile', data);
  }

  /**
   * 提交 KYC 认证
   */
  async submitKyc(formData: FormData): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>('/api/user/kyc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  /**
   * 获取 KYC 状态
   */
  async getKycStatus(): Promise<{ status: string; reason?: string }> {
    return this.get<{ status: string; reason?: string }>('/api/user/kyc/status');
  }
}
