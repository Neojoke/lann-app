export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  id_card?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  employment_status?: string;
  monthly_income?: number;
  employer_name?: string;
  employer_phone?: string;
  profile_completed: boolean;
  credit_score?: number;
  credit_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface CreditApplyRequest {
  id_card: string;
  employment_status: string;
  monthly_income: number;
  employer_name: string;
  employer_phone: string;
  address: string;
  city: string;
  zip_code: string;
}

export interface CreditApplyResponse {
  success: boolean;
  credit_score: number;
  credit_limit: number;
  message: string;
}

export interface CreditStatusResponse {
  success: boolean;
  credit_score: number;
  credit_limit: number;
  credit_used: number;
  credit_available: number;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
}

const API_BASE_URL = 'http://localhost:8787';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}

  async getProfile(token: string): Promise<{ success: boolean; user: UserProfile }> {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }

    return await response.json();
  }

  async updateProfile(token: string, profile: Partial<UserProfile>): Promise<{ success: boolean; user: UserProfile }> {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error('更新用户信息失败');
    }

    return await response.json();
  }

  async getCreditStatus(token: string): Promise<CreditStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/user/credit`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取信用状态失败');
    }

    return await response.json();
  }

  async applyForCredit(token: string, data: CreditApplyRequest): Promise<CreditApplyResponse> {
    const response = await fetch(`${API_BASE_URL}/api/user/credit/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '信用申请失败');
    }

    return await response.json();
  }
}
