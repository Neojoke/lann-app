import { Injectable } from '@ionic/react';

export interface RepayRequest {
  loanId: string;
  method: string;
}

export interface RepayResponse {
  success: boolean;
  repayment: {
    id: string;
    loanId: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  };
}

export interface PendingRepaymentsResponse {
  success: boolean;
  pending: Array<{
    loanId: string;
    amount: number;
    interest: number;
    total: number;
    dueDate: string;
    daysRemaining: number;
  }>;
}

const API_BASE_URL = 'http://localhost:8787';

@Injectable({
  providedIn: 'root',
})
export class RepayService {
  constructor() {}

  async getPendingRepayments(token: string): Promise<PendingRepaymentsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/repayments/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('获取待还款信息失败');
    }

    return await response.json();
  }

  async createRepayment(
    token: string,
    loanId: string,
    method: string
  ): Promise<RepayResponse> {
    const response = await fetch(`${API_BASE_URL}/api/repayments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ loanId, method }),
    });

    if (!response.ok) {
      throw new Error('创建还款失败');
    }

    return await response.json();
  }

  getPaymentMethods(): Array<{ id: string; name: string; description: string; icon: string }> {
    return [
      {
        id: 'bank',
        name: 'ธนาคาร',
        nameEn: 'Bank Transfer',
        description: 'โอนเงินผ่านธนาคาร',
        descriptionEn: 'Transfer via mobile banking',
        icon: 'business',
      },
      {
        id: 'convenience',
        name: 'ร้านสะดวกซื้อ',
        nameEn: 'Convenience Store',
        description: '7-11, FamilyMart',
        descriptionEn: 'Pay at 7-11 or FamilyMart',
        icon: 'storefront',
      },
      {
        id: 'promptpay',
        name: 'พร้อมเพย์',
        nameEn: 'PromptPay',
        description: 'สแกน QR Code',
        descriptionEn: 'Scan QR code to pay',
        icon: 'qr-code-outline',
      },
      {
        id: 'truemoney',
        name: 'ทรูมันนี่',
        nameEn: 'TrueMoney',
        description: 'TrueMoney Wallet',
        descriptionEn: 'TrueMoney Wallet',
        icon: 'wallet',
      },
    ];
  }
}
