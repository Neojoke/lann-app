/**
 * 还款服务类型定义
 * Repayment Service Type Definitions
 */

// ==================== 枚举类型 ====================

/**
 * 还款渠道类型
 */
export type RepaymentChannelType = 
  | 'bank_transfer'     // 银行转账
  | 'promptpay'         // PromptPay
  | 'convenience_store' // 便利店
  | 'e_wallet'          // 电子钱包
  | 'atm';              // ATM

/**
 * 还款状态
 */
export type RepaymentStatus = 
  | 'pending'       // 待处理
  | 'processing'    // 处理中
  | 'completed'     // 已完成
  | 'failed';       // 失败

/**
 * 分期状态
 */
export type InstallmentStatus = 
  | 'pending'       // 待还款
  | 'partial'       // 部分还款
  | 'paid'          // 已还清
  | 'overdue';      // 逾期

/**
 * 提前还款类型
 */
export type PrepaymentType = 'full' | 'partial';

// ==================== 请求类型 ====================

/**
 * 创建还款请求
 */
export interface CreateRepaymentRequest {
  /** 借款 ID */
  loan_id: string;
  /** 还款金额 */
  amount: number;
  /** 支付方式 */
  payment_method: string;
  /** 语言 */
  language: 'en' | 'th';
}

/**
 * 提前还款试算请求
 */
export interface PrepaymentCalcRequest {
  /** 借款 ID */
  loan_id: string;
  /** 提前还款类型 */
  type?: PrepaymentType;
  /** 还款金额（部分提前还款时） */
  amount?: number;
}

// ==================== 响应类型 ====================

/**
 * 还款计划响应
 */
export interface RepaymentScheduleResponse {
  /** 借款 ID */
  loan_id: string;
  /** 总应还金额 */
  total_due: number;
  /** 下次还款日期 */
  next_due_date: string;
  /** 分期列表 */
  installments: Installment[];
}

/**
 * 创建还款响应
 */
export interface CreateRepaymentResponse {
  /** 还款 ID */
  id: string;
  /** 借款 ID */
  loan_id: string;
  /** 还款金额 */
  amount: number;
  /** 支付方式 */
  method: string;
  /** 状态 */
  status: RepaymentStatus;
  /** 创建时间 */
  created_at: string;
  /** 交易参考号 */
  transaction_ref?: string;
}

/**
 * 还款渠道列表响应
 */
export interface GetRepaymentChannelsResponse {
  /** 渠道列表 */
  channels: RepaymentChannel[];
}

/**
 * 提前还款试算响应
 */
export interface PrepaymentCalcResponse {
  /** 借款 ID */
  loan_id: string;
  /** 提前还款类型 */
  type: PrepaymentType;
  /** 本金 */
  principal: number;
  /** 已用天数 */
  used_days: number;
  /** 应还利息 */
  interest: number;
  /** 提前还款手续费 */
  fee: number;
  /** 总还款金额 */
  total_amount: number;
  /** 原计划总还款 */
  original_total: number;
  /** 节省金额 */
  savings: number;
}

// ==================== 业务模型 ====================

/**
 * 还款渠道
 */
export interface RepaymentChannel {
  /** 渠道 ID */
  id: string;
  /** 渠道名称（双语） */
  name: {
    en: string;
    th: string;
  };
  /** 渠道类型 */
  type: RepaymentChannelType;
  /** 渠道配置 */
  config: {
    /** 银行代码 */
    bankCode?: string;
    /** 账号 */
    accountNumber?: string;
    /** PromptPay ID */
    promptPayId?: string;
    /** 便利店代码 */
    storeCode?: string;
  };
  /** 费用配置 */
  fees: {
    /** 固定费用 */
    fixed?: number;
    /** 百分比 */
    percentage?: number;
    /** 承担方 */
    payer: 'user' | 'platform';
  };
  /** 限制 */
  limits: {
    /** 最低金额 */
    minAmount: number;
    /** 最高金额 */
    maxAmount: number;
    /** 每日限额 */
    dailyLimit?: number;
  };
  /** 到账时间 */
  settlementTime: 'instant' | 'within_2h' | 'next_day';
  /** 状态 */
  status: 'active' | 'inactive' | 'maintenance';
}

/**
 * 分期详情
 */
export interface Installment {
  /** 期数 */
  number: number;
  /** 还款日期 */
  due_date: string;
  /** 本金 */
  principal: number;
  /** 利息 */
  interest: number;
  /** 费用 */
  fee?: number;
  /** 总金额 */
  total: number;
  /** 已还本金 */
  paid_principal?: number;
  /** 已还利息 */
  paid_interest?: number;
  /** 已还费用 */
  paid_fee?: number;
  /** 已还总额 */
  paid_total?: number;
  /** 状态 */
  status: InstallmentStatus;
}

/**
 * 还款记录
 */
export interface RepaymentRecord {
  /** 还款 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 借款 ID */
  loanId: string;
  /** 分期 ID（可选） */
  scheduleId?: string;
  /** 还款金额 */
  amount: number;
  /** 分配明细 */
  allocation: {
    /** 已还本金 */
    principal: number;
    /** 已还利息 */
    interest: number;
    /** 已还罚息 */
    penalty: number;
    /** 已还费用 */
    fee: number;
  };
  /** 支付方式 */
  paymentMethod: string;
  /** 支付渠道 ID */
  paymentChannelId?: string;
  /** 交易参考号 */
  transactionRef?: string;
  /** 状态 */
  status: RepaymentStatus;
  /** 创建时间 */
  createdAt: Date;
  /** 完成时间 */
  completedAt?: Date;
}

/**
 * 逾期阶段
 */
export interface OverdueStage {
  /** 逾期天数 */
  days: number;
  /** 逾期阶段 */
  stage: number;
  /** 催收动作 */
  action: string;
  /** 罚息率 */
  penaltyRate: number;
}

/**
 * 提前还款配置
 */
export interface PrepaymentConfig {
  /** 是否允许提前还款 */
  allowed: boolean;
  /** 费用类型 */
  feeType: 'none' | 'fixed' | 'percentage';
  /** 固定费用 */
  feeAmount?: number;
  /** 百分比费用 */
  feePercentage?: number;
  /** 到期前最少天数 */
  minDaysBeforeDue?: number;
}
