import { ApiClient } from './api.client';
import {
  ApplyLoanRequest,
  ApplyLoanResponse,
  ConfirmLoanRequest,
  LoanStatusResponse,
  LoanDetailsResponse,
  GetProductsResponse,
  ApiResponse,
  LoanProduct,
  LoanStatus,
  LoanProductType,
} from '../models/loan';

/**
 * 借款服务
 * Loan Service
 * 
 * 提供借款申请、确认、状态查询、产品列表等功能
 */
export class LoanService extends ApiClient {
  private static instance: LoanService;

  private constructor() {
    super();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): LoanService {
    if (!LoanService.instance) {
      LoanService.instance = new LoanService();
    }
    return LoanService.instance;
  }

  /**
   * 借款申请
   * Apply for loan
   * 
   * @param request 申请请求
   * @returns 申请结果
   */
  async applyLoan(request: ApplyLoanRequest): Promise<ApiResponse<ApplyLoanResponse>> {
    return this.post<ApiResponse<ApplyLoanResponse>>('/api/loan/apply', request);
  }

  /**
   * 确认借款（电子签约）
   * Confirm loan (e-signature)
   * 
   * @param request 确认请求
   * @returns 确认结果
   */
  async confirmLoan(request: ConfirmLoanRequest): Promise<ApiResponse<void>> {
    return this.post<ApiResponse<void>>('/api/loan/confirm', request);
  }

  /**
   * 查询借款状态
   * Get loan status
   * 
   * @param loanId 借款 ID
   * @returns 借款状态
   */
  async getLoanStatus(loanId: string): Promise<ApiResponse<LoanStatusResponse>> {
    return this.get<ApiResponse<LoanStatusResponse>>(`/api/loan/${loanId}/status`);
  }

  /**
   * 获取借款详情
   * Get loan details
   * 
   * @param loanId 借款 ID
   * @returns 借款详情
   */
  async getLoanDetails(loanId: string): Promise<ApiResponse<LoanDetailsResponse>> {
    return this.get<ApiResponse<LoanDetailsResponse>>(`/api/loan/${loanId}`);
  }

  /**
   * 获取产品列表
   * Get loan products
   * 
   * @returns 产品列表
   */
  async getProducts(): Promise<ApiResponse<GetProductsResponse>> {
    return this.get<ApiResponse<GetProductsResponse>>('/api/loan/products');
  }

  /**
   * 取消借款申请
   * Cancel loan application
   * 
   * @param applicationId 申请 ID
   * @returns 取消结果
   */
  async cancelLoan(applicationId: string): Promise<ApiResponse<void>> {
    return this.post<ApiResponse<void>>(`/api/loan/${applicationId}/cancel`);
  }

  /**
   * 计算借款利息（前端工具方法）
   * Calculate loan interest (client-side utility)
   * 
   * @param principal 本金
   * @param days 天数
   * @param rate 日利率
   * @param method 计算方式
   * @returns 利息和总还款额
   */
  calculateInterest(
    principal: number,
    days: number,
    rate: number = 0.01,
    method: 'flat' | 'reducing' = 'flat'
  ): {
    interest: number;
    totalRepayment: number;
    dailyInterest: number;
  } {
    let interest: number;

    if (method === 'flat') {
      // 固定利息计算
      interest = principal * rate * days;
    } else {
      // 递减利息计算（简化版）
      interest = principal * rate * days * 0.5;
    }

    const totalRepayment = principal + interest;
    const dailyInterest = interest / days;

    return {
      interest,
      totalRepayment,
      dailyInterest,
    };
  }

  /**
   * 计算分期还款金额
   * Calculate installment payment
   * 
   * @param principal 本金
   * @param totalInterest 总利息
   * @param months 期数
   * @returns 每月还款额
   */
  calculateInstallmentPayment(
    principal: number,
    totalInterest: number,
    months: number
  ): {
    monthlyPayment: number;
    totalPayment: number;
  } {
    const totalPayment = principal + totalInterest;
    const monthlyPayment = totalPayment / months;

    return {
      monthlyPayment,
      totalPayment,
    };
  }

  /**
   * 获取产品类型显示名称
   * Get product type display name
   * 
   * @param type 产品类型
   * @param language 语言
   * @returns 显示名称
   */
  getProductTypeName(
    type: LoanProductType,
    language: 'en' | 'th'
  ): string {
    const names: Record<LoanProductType, { en: string; th: string }> = {
      payday: {
        en: 'Payday Loan',
        th: 'เงินด่วนรายวัน',
      },
      installment: {
        en: 'Installment Loan',
        th: 'เงินผ่อนชำระ',
      },
      revolving: {
        en: 'Revolving Credit',
        th: 'วงเงินหมุนเวียน',
      },
    };

    return names[type][language];
  }

  /**
   * 获取借款状态显示名称
   * Get loan status display name
   * 
   * @param status 借款状态
   * @param language 语言
   * @returns 显示名称
   */
  getStatusName(
    status: LoanStatus | string,
    language: 'en' | 'th'
  ): string {
    const names: Record<string, { en: string; th: string }> = {
      pending: {
        en: 'Pending Approval',
        th: 'รอการอนุมัติ',
      },
      approved: {
        en: 'Approved',
        th: 'อนุมัติแล้ว',
      },
      rejected: {
        en: 'Rejected',
        th: 'ถูกปฏิเสธ',
      },
      signing: {
        en: 'Signing',
        th: 'กำลังเซ็นสัญญา',
      },
      disbursing: {
        en: 'Disbursing',
        th: 'กำลังโอนเงิน',
      },
      active: {
        en: 'Active',
        th: 'อยู่ระหว่างชำระ',
      },
      overdue: {
        en: 'Overdue',
        th: 'ค้างชำระ',
      },
      completed: {
        en: 'Completed',
        th: 'ชำระเสร็จสิ้น',
      },
      written_off: {
        en: 'Written Off',
        th: 'ตัดจำหน่าย',
      },
    };

    return names[status]?.[language] || status;
  }

  /**
   * 获取借款状态颜色
   * Get loan status color
   * 
   * @param status 借款状态
   * @returns 颜色代码
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#F59E0B',    // 黄色
      approved: '#10B981',   // 绿色
      rejected: '#EF4444',   // 红色
      signing: '#3B82F6',    // 蓝色
      disbursing: '#3B82F6', // 蓝色
      active: '#10B981',     // 绿色
      overdue: '#DC2626',    // 深红色
      completed: '#6B7280',  // 灰色
      written_off: '#6B7280',// 灰色
    };

    return colors[status] || '#9CA3AF';
  }
}

// 导出单例实例
export const loanService = LoanService.getInstance();
