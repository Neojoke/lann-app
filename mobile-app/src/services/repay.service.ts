// 简化的还款服务（不依赖 Angular）
// Simplified repayment service (without Angular dependencies)

export interface RepaymentSchedule {
  id: string;
  loan_id: string;
  installment_number: number;
  total_installments: number;
  principal_amount: number;
  interest_amount: number;
  fee_amount: number;
  total_amount: number;
  paid_principal: number;
  paid_interest: number;
  paid_fee: number;
  paid_total: number;
  due_date: string;
  paid_at?: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
}

export interface LoanInfo {
  id: string;
  principal: number;
  total_repayment: number;
  status: string;
  due_date: string;
}

export interface RepayScheduleResponse {
  success: boolean;
  schedules?: RepaymentSchedule[];
  loans?: LoanInfo[];
  early_settlement_amount?: number;
}

export class RepayService {
  private readonly baseUrl = 'http://localhost:3000';

  /**
   * 获取贷款列表
   */
  async getLoans(token: string): Promise<RepayScheduleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/loans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      // 模拟数据用于开发
      return {
        success: true,
        loans: [
          {
            id: 'loan_001',
            principal: 10000,
            total_repayment: 13000,
            status: 'active',
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };
    }
  }

  /**
   * 获取还款计划
   */
  async getRepaySchedule(token: string, loanId: string): Promise<RepayScheduleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/repay/schedule?loan_id=${loanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      // 模拟数据用于开发
      const schedules: RepaymentSchedule[] = [];
      for (let i = 1; i <= 4; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (i * 7));
        schedules.push({
          id: `schedule_${i}`,
          loan_id: loanId,
          installment_number: i,
          total_installments: 4,
          principal_amount: 2500,
          interest_amount: 750,
          fee_amount: 0,
          total_amount: 3250,
          paid_principal: i <= 2 ? 2500 : 0,
          paid_interest: i <= 2 ? 750 : 0,
          paid_fee: 0,
          paid_total: i <= 2 ? 3250 : 0,
          due_date: dueDate.toISOString(),
          paid_at: i <= 2 ? new Date().toISOString() : undefined,
          status: i <= 2 ? 'paid' : 'pending',
        });
      }
      
      return {
        success: true,
        schedules,
      };
    }
  }

  /**
   * 计算提前还款金额
   */
  async calculateEarlyRepayment(token: string, loanId: string): Promise<RepayScheduleResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/repay/prepayment-calc?loan_id=${loanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      // 模拟数据用于开发
      return {
        success: true,
        early_settlement_amount: 6500,
      };
    }
  }

  /**
   * 计算罚息（前端工具方法）
   */
  calculatePenalty(
    principal: number,
    overdueDays: number,
    penaltyRate: number = 0.005
  ): number {
    return principal * penaltyRate * overdueDays;
  }

  /**
   * 计算提前还款金额（前端工具方法）
   */
  calculatePrepaymentAmount(
    principal: number,
    usedDays: number,
    dailyRate: number = 0.01,
    feePercentage: number = 0
  ): {
    principal: number;
    interest: number;
    fee: number;
    total: number;
    savings: number;
  } {
    const interest = principal * dailyRate * usedDays;
    const fee = principal * feePercentage;
    const total = principal + interest + fee;
    const originalInterest = principal * dailyRate * 30;
    const savings = originalInterest - interest;

    return {
      principal,
      interest,
      fee,
      total,
      savings,
    };
  }
}
