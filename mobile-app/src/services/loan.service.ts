import { Injectable } from '@ionic/react';

export interface LoanRequest {
  amount: number;
  days: number;
}

export interface LoanResponse {
  success: boolean;
  loan: {
    id: string;
    user_id: string;
    amount: number;
    days: number;
    interest_rate: number;
    interest: number;
    total_repayment: number;
    status: string;
    created_at: string;
    due_date: string;
  };
  message: string;
}

export interface LoansResponse {
  success: boolean;
  loans: Array<{
    id: string;
    amount: number;
    days: number;
    interest: number;
    total_repayment: number;
    status: string;
    created_at: string;
    due_date: string;
  }>;
}

export interface CreditResponse {
  success: boolean;
  credit: {
    available: number;
    total: number;
    used: number;
  };
}

const API_BASE_URL = 'http://localhost:8787';

@Injectable({
  providedIn: 'root',
})
export class LoanService {
  constructor() {}

  async getCredit(token: string): Promise<CreditResponse> {
    const response = await fetch(`${API_BASE_URL}/api/user/credit`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取额度失败');
    }

    return await response.json();
  }

  async createLoan(token: string, amount: number, days: number): Promise<LoanResponse> {
    const response = await fetch(`${API_BASE_URL}/api/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, days }),
    });

    if (!response.ok) {
      throw new Error('创建借款失败');
    }

    return await response.json();
  }

  async getLoans(token: string): Promise<LoansResponse> {
    const response = await fetch(`${API_BASE_URL}/api/loans`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取借款记录失败');
    }

    return await response.json();
  }

  calculateInterest(amount: number, days: number): {
    interest: number;
    totalRepayment: number;
  } {
    const interestRate = 0.01; // 1% 日利率
    const interest = amount * interestRate * days;
    const totalRepayment = amount + interest;

    return {
      interest,
      totalRepayment,
    };
  }
}
