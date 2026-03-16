/**
 * 信用服务类型定义
 * Credit Service Type Definitions
 */

// ==================== 枚举类型 ====================

/**
 * 信用申请状态
 */
export type CreditApplicationStatus = 
  | 'pending'      // 待审批
  | 'approved'     // 已批准
  | 'rejected'     // 已拒绝
  | 'reviewing';   // 复审中

/**
 * 信用额度状态
 */
export type CreditLimitStatus = 
  | 'active'       // 有效
  | 'expired'      // 已过期
  | 'suspended'    // 已冻结
  | 'revoked';     // 已撤销

/**
 * 信用等级
 */
export type CreditGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

// ==================== 请求类型 ====================

/**
 * 申请信用额度请求
 */
export interface ApplyCreditRequest {
  /** 用户资料（如果未填写） */
  profile?: UserProfile;
  /** 同意书 */
  consent: {
    /** 同意信用检查 */
    credit_check: boolean;
    /** 同意数据处理 */
    data_processing: boolean;
    /** 接受条款 */
    terms_accepted: boolean;
  };
  /** 语言 */
  language: 'en' | 'th';
}

/**
 * 用户资料
 */
export interface UserProfile {
  /** 全名（泰文） */
  full_name_th?: string;
  /** 全名（英文） */
  full_name_en?: string;
  /** 身份证号 */
  national_id?: string;
  /** 出生日期 */
  date_of_birth?: string;
  /** 性别 */
  gender?: 'male' | 'female' | 'other';
  /** 邮箱 */
  email?: string;
  /** 地址 */
  address?: string;
  /** 省份 */
  province?: string;
  /** 区域 */
  district?: string;
  /** 街道 */
  subdistrict?: string;
  /** 邮编 */
  postal_code?: string;
  /** 公司名称 */
  company_name?: string;
  /** 职位 */
  position?: string;
  /** 月收入 */
  monthly_income?: number;
  /** 工作地址 */
  work_address?: string;
  /** 就业类型 */
  employment_type?: 'employee' | 'self_employed' | 'business_owner';
  /** 紧急联系人姓名 */
  emergency_contact_name?: string;
  /** 紧急联系人关系 */
  emergency_contact_relationship?: string;
  /** 紧急联系人电话 */
  emergency_contact_phone?: string;
}

/**
 * 申请复审请求
 */
export interface RequestReviewRequest {
  /** 语言 */
  language: 'en' | 'th';
  /** 复审原因 */
  reason?: string;
}

// ==================== 响应类型 ====================

/**
 * API 响应基础结构
 */
export interface ApiResponse<T> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: {
    /** 错误码 */
    code: string;
    /** 错误消息（英文） */
    message: string;
    /** 错误消息（泰文） */
    message_th?: string;
  };
}

/**
 * 申请信用额度响应
 */
export interface ApplyCreditResponse {
  /** 申请 ID */
  application_id: string;
  /** 状态 */
  status: CreditApplicationStatus;
  /** 预计审批时间（分钟） */
  estimated_time: number;
}

/**
 * 信用状态响应
 */
export interface CreditStatusResponse {
  /** 申请状态 */
  application_status: CreditApplicationStatus;
  /** 信用评分 */
  credit_score?: number;
  /** 信用额度 */
  credit_limit?: {
    /** 总额度 */
    total: number;
    /** 可用额度 */
    available: number;
    /** 已用额度 */
    used: number;
  };
  /** 过期时间 */
  expires_at?: string;
  /** 复审时间 */
  review_at?: string;
}

/**
 * 信用额度响应
 */
export interface CreditLimitResponse {
  /** 总额度 */
  total_limit: number;
  /** 可用额度 */
  available_limit: number;
  /** 已用额度 */
  used_limit: number;
  /** 冻结额度 */
  frozen_limit: number;
  /** 状态 */
  status: CreditLimitStatus;
  /** 过期时间 */
  expires_at: string;
  /** 距离过期天数 */
  days_until_expiry: number;
}

// ==================== 业务模型 ====================

/**
 * 信用额度详情
 */
export interface CreditLimit {
  /** 用户 ID */
  userId: string;
  /** 总额度 */
  totalLimit: number;
  /** 可用额度 */
  availableLimit: number;
  /** 已用额度 */
  usedLimit: number;
  /** 冻结额度 */
  frozenLimit: number;
  /** 授予时间 */
  grantedAt: Date;
  /** 过期时间 */
  expiresAt: Date;
  /** 有效期天数 */
  validityDays: number;
  /** 状态 */
  status: CreditLimitStatus;
  /** 调整历史 */
  adjustmentHistory: LimitAdjustment[];
  /** 下次复审时间 */
  reviewAt?: Date;
  /** 复审评分 */
  reviewScore?: number;
}

/**
 * 额度调整记录
 */
export interface LimitAdjustment {
  /** 调整时间 */
  adjustedAt: Date;
  /** 调整前额度 */
  previousLimit: number;
  /** 调整后额度 */
  newLimit: number;
  /** 调整原因 */
  reason: string;
  /** 调整类型 */
  type: 'increase' | 'decrease' | 'freeze' | 'unfreeze';
}

/**
 * 信用评分详情
 */
export interface CreditScore {
  /** 总分 */
  totalScore: number;
  /** 等级 */
  grade: CreditGrade;
  /** 评分详情 */
  breakdown: {
    /** 基本信息得分 */
    basicScore: number;
    /** 工作信息得分 */
    employmentScore: number;
    /** 联系方式得分 */
    contactScore: number;
    /** 社交关系得分 */
    socialScore: number;
    /** 行为数据得分 */
    behaviorScore: number;
  };
}
