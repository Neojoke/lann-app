/**
 * 借款服务类型定义
 * Loan Service Type Definitions
 */

// ==================== 枚举类型 ====================

/**
 * 借款产品类型
 */
export type LoanProductType = 'payday' | 'installment' | 'revolving';

/**
 * 借款状态
 */
export type LoanStatus = 
  | 'pending'       // 待审批
  | 'approved'      // 已批准
  | 'rejected'      // 已拒绝
  | 'signing'       // 签约中
  | 'disbursing'    // 放款中
  | 'active'        // 还款中
  | 'overdue'       // 逾期
  | 'completed'     // 已结清
  | 'written_off';  // 已核销

/**
 * 还款方式
 */
export type RepaymentType = 'bullet' | 'installment';

/**
 * 利率类型
 */
export type InterestRateType = 'daily' | 'monthly' | 'annual';

/**
 * 利率计算方式
 */
export type InterestCalculationMethod = 'flat' | 'reducing';

// ==================== 请求类型 ====================

/**
 * 借款申请请求
 */
export interface ApplyLoanRequest {
  /** 产品 ID */
  product_id: string;
  /** 借款金额 */
  amount: number;
  /** 借款期限（天） */
  term_days: number;
  /** 语言 */
  language: 'en' | 'th';
  /** 借款用途（可选） */
  purpose?: string;
}

/**
 * 确认借款请求（电子签约）
 */
export interface ConfirmLoanRequest {
  /** 申请 ID */
  application_id: string;
  /** 电子签名 */
  signature: string;
  /** 语言 */
  language: 'en' | 'th';
}

/**
 * 取消借款申请请求
 */
export interface CancelLoanRequest {
  /** 语言 */
  language: 'en' | 'th';
}

// ==================== 响应类型 ====================

/**
 * 借款申请响应
 */
export interface ApplyLoanResponse {
  /** 申请 ID */
  application_id: string;
  /** 借款详情 */
  loan_details: {
    /** 本金 */
    principal: number;
    /** 利息 */
    interest: number;
    /** 总还款额 */
    total_repayment: number;
    /** 到期日期 */
    due_date: string;
  };
  /** 合同 URL（如有） */
  contract_url?: string;
}

/**
 * 借款状态响应
 */
export interface LoanStatusResponse {
  /** 状态 */
  status: LoanStatus;
  /** 审批进度（可选） */
  progress?: {
    /** 当前步骤 */
    current_step: string;
    /** 总步骤数 */
    total_steps: number;
    /** 预计完成时间 */
    estimated_completion?: string;
  };
}

/**
 * 借款详情响应
 */
export interface LoanDetailsResponse {
  /** 借款 ID */
  id: string;
  /** 用户 ID */
  user_id: string;
  /** 产品 ID */
  product_id: string;
  /** 本金 */
  principal: number;
  /** 利率 */
  interest_rate: number;
  /** 期限（天） */
  term_days: number;
  /** 总利息 */
  total_interest: number;
  /** 总还款额 */
  total_repayment: number;
  /** 已还金额 */
  paid_amount: number;
  /** 剩余金额 */
  remaining_amount: number;
  /** 放款时间 */
  disbursed_at?: string;
  /** 到期日期 */
  due_date: string;
  /** 结清时间 */
  completed_at?: string;
  /** 状态 */
  status: LoanStatus;
  /** 是否逾期 */
  is_overdue: boolean;
  /** 逾期天数 */
  overdue_days: number;
  /** 罚息金额 */
  penalty_amount: number;
  /** 合同 URL */
  contract_url?: string;
  /** 签约时间 */
  signed_at?: string;
}

/**
 * 借款产品列表响应
 */
export interface GetProductsResponse {
  /** 产品列表 */
  products: LoanProduct[];
}

// ==================== 业务模型 ====================

/**
 * 借款产品
 */
export interface LoanProduct {
  /** 产品 ID */
  id: string;
  /** 产品名称（双语） */
  name: {
    en: string;
    th: string;
  };
  /** 产品类型 */
  type: LoanProductType;
  /** 最低借款金额 */
  minAmount: number;
  /** 最高借款金额 */
  maxAmount: number;
  /** 支持的期限选项 */
  terms: LoanTerm[];
  /** 费率配置 */
  interestRate: InterestRate;
  /** 费用列表 */
  fees: Fee[];
  /** 还款方式 */
  repaymentMethods: string[];
  /** 资格要求 */
  requirements: Requirement[];
  /** 状态 */
  status: 'active' | 'inactive' | 'deprecated';
  /** 适用用户群 */
  targetSegment: 'new' | 'regular' | 'premium';
}

/**
 * 借款期限选项
 */
export interface LoanTerm {
  /** 期限天数 */
  days: number;
  /** 标签（双语） */
  label: {
    en: string;
    th: string;
  };
  /** 该期限最低金额 */
  minAmount: number;
  /** 该期限最高金额 */
  maxAmount: number;
  /** 还款类型 */
  repaymentType: RepaymentType;
}

/**
 * 利率配置
 */
export interface InterestRate {
  /** 利率类型 */
  type: InterestRateType;
  /** 利率值 */
  rate: number;
  /** 计算方式 */
  calculationMethod: InterestCalculationMethod;
}

/**
 * 费用配置
 */
export interface Fee {
  /** 费用类型 */
  type: 'processing' | 'late' | 'prepayment' | 'service';
  /** 固定金额 */
  amount?: number;
  /** 百分比 */
  percentage?: number;
  /** 最低收费 */
  minAmount?: number;
  /** 最高收费 */
  maxAmount?: number;
}

/**
 * 资格要求
 */
export interface Requirement {
  /** 要求类型 */
  type: string;
  /** 要求描述（双语） */
  description: {
    en: string;
    th: string;
  };
  /** 是否必须 */
  required: boolean;
}

/**
 * 借款申请记录
 */
export interface LoanApplication {
  /** 申请 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 产品 ID */
  productId: string;
  /** 借款金额 */
  amount: number;
  /** 期限（天） */
  termDays: number;
  /** 借款用途 */
  purpose?: string;
  /** 状态 */
  status: LoanStatus;
  /** 批准金额 */
  approvedAmount?: number;
  /** 批准期限 */
  approvedTermDays?: number;
  /** 利率 */
  interestRate?: number;
  /** 拒绝原因 */
  rejectionReason?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}
