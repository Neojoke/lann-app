/**
 * 借款申请服务 - Loan Application Service
 * 
 * 负责借款申请创建、资格检查、审批流程、利息计算和申请状态管理
 */

import { D1Database } from '@cloudflare/workers-types';
import {
  LoanProduct,
  LoanProductService,
  InterestRate,
  formatAmount,
  getErrorMessage,
} from './loan-product.service';

// ============ 类型定义 ============

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'signing' | 'disbursing' | 'active' | 'overdue' | 'completed' | 'written_off';
export type ApprovalType = 'auto' | 'manual';

export interface LoanApplication {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  termDays: number;
  purpose?: string;
  status: ApplicationStatus;
  approvedAmount?: number;
  approvedTermDays?: number;
  interestRate?: number;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  applicationId: string;
  productId: string;
  principal: number;
  interestRate: number;
  termDays: number;
  totalInterest: number;
  totalRepayment: number;
  paidAmount: number;
  remainingAmount: number;
  status: LoanStatus;
  disbursedAt?: string;
  dueDate: string;
  completedAt?: string;
  isOverdue: boolean;
  overdueDays: number;
  penaltyAmount: number;
  contractUrl?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  productId: string;
  amount: number;
  termDays: number;
  purpose?: string;
}

export interface CreditCheckResult {
  passed: boolean;
  creditScore?: number;
  availableLimit?: number;
  totalLimit?: number;
  reason?: string;
}

export interface ApprovalDecision {
  approved: boolean;
  type: ApprovalType;
  reason?: string;
  approvedAmount?: number;
  approvedTermDays?: number;
  interestRate?: number;
}

export interface LoanCalculation {
  principal: number;
  interest: number;
  totalRepayment: number;
  dailyPayment?: number;
  monthlyPayment?: number;
}

// ============ 多语言错误消息 ============

const ERROR_MESSAGES: Record<string, { en: string; th: string }> = {
  ...{
    PRODUCT_NOT_FOUND: { en: 'Product not found', th: 'ไม่พบผลิตภัณฑ์' },
    INVALID_AMOUNT: { en: 'Invalid loan amount', th: 'จำนวนเงินกู้ไม่ถูกต้อง' },
    INVALID_TERM: { en: 'Invalid loan term', th: 'ระยะเวลากู้ไม่ถูกต้อง' },
  },
  INSUFFICIENT_CREDIT: {
    en: 'Insufficient credit limit',
    th: 'วงเงินเครดิตไม่เพียงพอ',
  },
  APPLICATION_NOT_FOUND: {
    en: 'Application not found',
    th: 'ไม่พบคำขอสินเชื่อ',
  },
  LOAN_NOT_FOUND: {
    en: 'Loan not found',
    th: 'ไม่พบสินเชื่อ',
  },
  INVALID_STATUS: {
    en: 'Invalid status for this operation',
    th: 'สถานะไม่ถูกต้องสำหรับการดำเนินการนี้',
  },
  ALREADY_HAS_ACTIVE_LOAN: {
    en: 'You already have an active loan',
    th: 'คุณมีสินเชื่อที่ใช้งานอยู่แล้ว',
  },
  CANCEL_NOT_ALLOWED: {
    en: 'Cancellation is not allowed',
    th: 'ไม่อนุญาตให้ยกเลิก',
  },
};

// ============ 常量 ============

const AUTO_APPROVAL_THRESHOLDS = {
  MIN_CREDIT_SCORE: 650,
  MAX_AMOUNT: 20000,
  MAX_DAILY_RATE: 0.01,
};

export class LoanApplicationService {
  private db: D1Database;
  private productService: LoanProductService;

  constructor(db: D1Database, productService: LoanProductService) {
    this.db = db;
    this.productService = productService;
  }

  /**
   * 创建借款申请
   */
  async createApplication(
    userId: string,
    input: CreateApplicationInput,
    lang: 'en' | 'th' = 'en'
  ): Promise<{
    success: boolean;
    application?: LoanApplication & { loanDetails?: LoanCalculation };
    error?: { code: string; message: string };
  }> {
    try {
      // 1. 获取产品
      const product = await this.productService.getById(input.productId, lang);
      if (!product) {
        return {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: getErrorMessage('PRODUCT_NOT_FOUND', lang),
          },
        };
      }

      // 2. 验证借款参数
      const validation = this.productService.validateLoanParams(
        product,
        input.amount,
        input.termDays
      );
      if (!validation.valid && validation.error) {
        return {
          success: false,
          error: {
            code: validation.error.code,
            message: validation.error.message[lang],
          },
        };
      }

      // 3. 信用检查
      const creditCheck = await this.checkCredit(userId, input.amount);
      if (!creditCheck.passed) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDIT',
            message: creditCheck.reason || getErrorMessage('INSUFFICIENT_CREDIT', lang),
          },
        };
      }

      // 4. 创建申请
      const id = 'app_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
      const now = new Date().toISOString();

      await this.db.execute(`
        INSERT INTO loan_applications (
          id, user_id, product_id, amount, term_days, purpose,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        userId,
        input.productId,
        input.amount,
        input.termDays,
        input.purpose || null,
        'pending',
        now,
        now,
      ]);

      // 5. 计算借款详情
      const calculation = this.calculateLoanDetails(
        input.amount,
        product.interestRate,
        input.termDays
      );

      const application: LoanApplication & { loanDetails?: LoanCalculation } = {
        id,
        userId,
        productId: input.productId,
        amount: input.amount,
        termDays: input.termDays,
        purpose: input.purpose,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        loanDetails: calculation,
      };

      return {
        success: true,
        application,
      };
    } catch (error) {
      console.error('Create application error:', error);
      throw error;
    }
  }

  /**
   * 信用检查
   */
  async checkCredit(userId: string, amount: number): Promise<CreditCheckResult> {
    // 查询用户信用额度
    const creditResult = await this.db.execute(
      `SELECT * FROM credit_limits WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    if (!creditResult.results || creditResult.results.length === 0) {
      return {
        passed: false,
        reason: 'No active credit limit found',
      };
    }

    const credit = creditResult.results[0] as any;

    // 检查可用额度
    if (credit.available_limit < amount) {
      return {
        passed: false,
        creditScore: credit.credit_score,
        availableLimit: credit.available_limit,
        totalLimit: credit.total_limit,
        reason: `Available limit (${credit.available_limit}) is less than requested amount (${amount})`,
      };
    }

    // 检查信用评分
    if (credit.credit_score < 300) {
      return {
        passed: false,
        creditScore: credit.credit_score,
        reason: 'Credit score too low',
      };
    }

    return {
      passed: true,
      creditScore: credit.credit_score,
      availableLimit: credit.available_limit,
      totalLimit: credit.total_limit,
    };
  }

  /**
   * 审批申请
   */
  async approveApplication(
    applicationId: string,
    reviewerId?: string,
    lang: 'en' | 'th' = 'en'
  ): Promise<{
    success: boolean;
    decision?: ApprovalDecision;
    loan?: Loan;
    error?: { code: string; message: string };
  }> {
    try {
      const now = new Date().toISOString();

      // 1. 获取申请
      const appResult = await this.db.execute(
        'SELECT * FROM loan_applications WHERE id = ?',
        [applicationId]
      );

      if (!appResult.results || appResult.results.length === 0) {
        return {
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: getErrorMessage('APPLICATION_NOT_FOUND', lang),
          },
        };
      }

      const app = appResult.results[0] as any;

      if (app.status !== 'pending') {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: getErrorMessage('INVALID_STATUS', lang),
          },
        };
      }

      // 2. 获取产品
      const product = await this.productService.getById(app.product_id, lang);
      if (!product) {
        return {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: getErrorMessage('PRODUCT_NOT_FOUND', lang),
          },
        };
      }

      // 3. 审批决策
      const decision = await this.makeApprovalDecision(app, product);

      if (!decision.approved) {
        // 拒绝申请
        await this.db.execute(`
          UPDATE loan_applications SET
            status = 'rejected',
            rejection_reason = ?,
            reviewed_by = ?,
            reviewed_at = ?,
            updated_at = ?
          WHERE id = ?
        `, [decision.reason, reviewerId || 'system', now, now, applicationId]);

        return {
          success: true,
          decision,
        };
      }

      // 4. 更新申请状态
      await this.db.execute(`
        UPDATE loan_applications SET
          status = 'approved',
          approved_amount = ?,
          approved_term_days = ?,
          interest_rate = ?,
          reviewed_by = ?,
          reviewed_at = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        decision.approvedAmount || app.amount,
        decision.approvedTermDays || app.term_days,
        decision.interestRate || product.interestRate.rate,
        reviewerId || 'system',
        now,
        now,
        applicationId,
      ]);

      // 5. 创建借款记录
      const loan = await this.createLoan(
        app.user_id,
        applicationId,
        app.product_id,
        decision.approvedAmount || app.amount,
        decision.approvedTermDays || app.term_days,
        decision.interestRate || product.interestRate.rate
      );

      return {
        success: true,
        decision,
        loan,
      };
    } catch (error) {
      console.error('Approve application error:', error);
      throw error;
    }
  }

  /**
   * 做出审批决策
   */
  private async makeApprovalDecision(
    application: any,
    product: LoanProduct
  ): Promise<ApprovalDecision> {
    const { amount, term_days: termDays } = application;

    // 获取用户信用评分
    const creditResult = await this.db.execute(
      'SELECT credit_score FROM credit_limits WHERE user_id = ? AND status = \'active\'',
      [application.user_id]
    );

    const creditScore = creditResult.results?.[0]?.credit_score || 0;

    // 自动审批条件
    const isAutoApproval =
      creditScore >= AUTO_APPROVAL_THRESHOLDS.MIN_CREDIT_SCORE &&
      amount <= AUTO_APPROVAL_THRESHOLDS.MAX_AMOUNT &&
      product.interestRate.rate <= AUTO_APPROVAL_THRESHOLDS.MAX_DAILY_RATE;

    if (isAutoApproval) {
      return {
        approved: true,
        type: 'auto',
        approvedAmount: amount,
        approvedTermDays: termDays,
        interestRate: product.interestRate.rate,
      };
    }

    // 需要人工审批
    return {
      approved: true, // 默认通过，实际应由人工决定
      type: 'manual',
      reason: 'Requires manual review',
      approvedAmount: amount,
      approvedTermDays: termDays,
      interestRate: product.interestRate.rate,
    };
  }

  /**
   * 创建借款记录
   */
  private async createLoan(
    userId: string,
    applicationId: string,
    productId: string,
    principal: number,
    termDays: number,
    interestRate: number
  ): Promise<Loan> {
    const id = 'loan_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    const now = new Date().toISOString();
    const dueDate = new Date(Date.now() + termDays * 24 * 60 * 60 * 1000).toISOString();

    // 计算利息和总还款额
    const calculation = this.calculateLoanDetails(principal, {
      type: 'daily',
      rate: interestRate,
      calculationMethod: 'flat',
    }, termDays);

    await this.db.execute(`
      INSERT INTO loans (
        id, user_id, application_id, product_id,
        principal, interest_rate, term_days,
        total_interest, total_repayment, paid_amount, remaining_amount,
        status, due_date, is_overdue, overdue_days, penalty_amount,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      userId,
      applicationId,
      productId,
      principal,
      interestRate,
      termDays,
      calculation.interest,
      calculation.totalRepayment,
      0,
      calculation.totalRepayment,
      'approved',
      dueDate,
      0,
      0,
      0,
      now,
      now,
    ]);

    // 更新用户可用额度
    await this.db.execute(
      'UPDATE credit_limits SET available_limit = available_limit - ?, used_limit = used_limit + ? WHERE user_id = ?',
      [principal, principal, userId]
    );

    return {
      id,
      userId,
      applicationId,
      productId,
      principal,
      interestRate,
      termDays,
      totalInterest: calculation.interest,
      totalRepayment: calculation.totalRepayment,
      paidAmount: 0,
      remainingAmount: calculation.totalRepayment,
      status: 'approved',
      dueDate,
      isOverdue: false,
      overdueDays: 0,
      penaltyAmount: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 计算借款详情
   */
  calculateLoanDetails(
    principal: number,
    rate: InterestRate,
    termDays: number
  ): LoanCalculation {
    const interest = this.productService.calculateInterest(principal, rate, termDays);
    const totalRepayment = principal + interest;

    const calculation: LoanCalculation = {
      principal,
      interest,
      totalRepayment,
    };

    // 如果是分期还款，计算每期还款额
    if (termDays > 30) {
      const months = Math.ceil(termDays / 30);
      calculation.monthlyPayment = totalRepayment / months;
    } else {
      calculation.dailyPayment = totalRepayment / termDays;
    }

    return calculation;
  }

  /**
   * 获取申请详情
   */
  async getApplication(applicationId: string): Promise<LoanApplication | null> {
    const result = await this.db.execute(
      'SELECT * FROM loan_applications WHERE id = ?',
      [applicationId]
    );

    if (!result.results || result.results.length === 0) {
      return null;
    }

    const row = result.results[0] as any;
    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      amount: row.amount,
      termDays: row.term_days,
      purpose: row.purpose,
      status: row.status,
      approvedAmount: row.approved_amount,
      approvedTermDays: row.approved_term_days,
      interestRate: row.interest_rate,
      rejectionReason: row.rejection_reason,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 获取借款详情
   */
  async getLoan(loanId: string): Promise<Loan | null> {
    const result = await this.db.execute(
      'SELECT * FROM loans WHERE id = ?',
      [loanId]
    );

    if (!result.results || result.results.length === 0) {
      return null;
    }

    const row = result.results[0] as any;
    return {
      id: row.id,
      userId: row.user_id,
      applicationId: row.application_id,
      productId: row.product_id,
      principal: row.principal,
      interestRate: row.interest_rate,
      termDays: row.term_days,
      totalInterest: row.total_interest,
      totalRepayment: row.total_repayment,
      paidAmount: row.paid_amount,
      remainingAmount: row.remaining_amount,
      status: row.status,
      disbursedAt: row.disbursed_at,
      dueDate: row.due_date,
      completedAt: row.completed_at,
      isOverdue: !!row.is_overdue,
      overdueDays: row.overdue_days,
      penaltyAmount: row.penalty_amount,
      contractUrl: row.contract_url,
      signedAt: row.signed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 取消申请
   */
  async cancelApplication(
    applicationId: string,
    lang: 'en' | 'th' = 'en'
  ): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    const application = await this.getApplication(applicationId);

    if (!application) {
      return {
        success: false,
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: getErrorMessage('APPLICATION_NOT_FOUND', lang),
        },
      };
    }

    if (application.status !== 'pending') {
      return {
        success: false,
        error: {
          code: 'CANCEL_NOT_ALLOWED',
          message: getErrorMessage('CANCEL_NOT_ALLOWED', lang),
        },
      };
    }

    await this.db.execute(
      'UPDATE loan_applications SET status = ?, updated_at = ? WHERE id = ?',
      ['cancelled', new Date().toISOString(), applicationId]
    );

    return { success: true };
  }

  /**
   * 更新逾期状态
   */
  async updateOverdueStatus(): Promise<void> {
    const now = new Date().toISOString();

    // 更新逾期借款
    await this.db.execute(`
      UPDATE loans SET
        is_overdue = 1,
        overdue_days = CAST(julianday(?) - julianday(due_date) AS INTEGER),
        status = 'overdue',
        updated_at = ?
      WHERE due_date < ? AND status = 'active'
    `, [now, now, now]);
  }

  /**
   * 计算罚息
   */
  calculatePenalty(principal: number, overdueDays: number, penaltyRate: number): number {
    // 罚息 = 逾期本金 × 罚息率 × 逾期天数
    return principal * penaltyRate * overdueDays;
  }
}

/**
 * 获取错误消息 (多语言)
 */
export function getApplicationErrorMessage(code: string, lang: 'en' | 'th'): string {
  const error = ERROR_MESSAGES[code];
  if (!error) {
    return lang === 'en' ? 'Unknown error' : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }
  return lang === 'en' ? error.en : error.th;
}
