/**
 * 额度管理服务
 * 
 * 实现信用额度的授予、调整、有效期管理和复审逻辑
 * 
 * 核心功能:
 * - 额度授予 (基于信用评分)
 * - 额度有效期管理 (365 天)
 * - 额度调整 (提升/降低/冻结)
 * - 临时额度逻辑
 * - 额度复审触发
 */

import type { UserProfile } from './credit-score.service';
import { calculateCreditScore, getCreditGrade, getRecommendedLimit, getInterestRate } from './credit-score.service';

// ==================== 类型定义 ====================

export type CreditLimitStatus = 'active' | 'expired' | 'suspended' | 'revoked';

export interface CreditLimit {
  id: string;
  userId: string;
  
  // 额度信息
  totalLimit: number;
  availableLimit: number;
  usedLimit: number;
  frozenLimit: number;
  
  // 评分信息
  creditScore: number;
  creditGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  scoreDetails?: any;
  
  // 有效期
  grantedAt: Date;
  expiresAt: Date;
  validityDays: number;
  
  // 状态
  status: CreditLimitStatus;
  
  // 利率
  interestRate: number;
  
  // 调整历史
  adjustmentHistory: LimitAdjustment[];
  
  // 复审信息
  reviewAt?: Date;
  lastReviewScore?: number;
  
  // 临时额度
  temporaryLimit?: TemporaryLimit;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}

export interface LimitAdjustment {
  id: string;
  type: 'increase' | 'decrease' | 'freeze' | 'unfreeze' | 'temporary' | 'review';
  amount: number;
  reason: string;
  reasonCode: string;
  previousLimit: number;
  newLimit: number;
  adjustedBy: string; // 'system' | 'admin' | 'user_request'
  adjustedAt: Date;
  expiresAt?: Date; // 临时额度过期时间
}

export interface TemporaryLimit {
  amount: number;
  grantedAt: Date;
  expiresAt: Date;
  reason: string;
  minScore: number;
  repaymentCount: number;
}

export interface LimitReviewResult {
  shouldReview: boolean;
  reason: string;
  recommendedAction: 'maintain' | 'increase' | 'decrease' | 'freeze' | 'revoke';
  newScore?: number;
  newGrade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  recommendedLimit?: number;
}

export interface GrantLimitResult {
  success: boolean;
  limit?: CreditLimit;
  error?: {
    code: string;
    message: string;
    messageEn: string;
    messageTh: string;
  };
}

export interface AdjustLimitParams {
  userId: string;
  currentLimit: CreditLimit;
  adjustmentType: 'increase' | 'decrease' | 'freeze' | 'unfreeze';
  amount?: number; // 调整金额 (增加或减少的绝对值)
  percentage?: number; // 调整百分比
  reason: string;
  reasonCode: string;
  adjustedBy: 'system' | 'admin' | 'user_request';
  temporaryDays?: number; // 如果是临时调整，指定天数
}

export interface AdjustLimitResult {
  success: boolean;
  limit?: CreditLimit;
  adjustment?: LimitAdjustment;
  error?: {
    code: string;
    message: string;
    messageEn: string;
    messageTh: string;
  };
}

// ==================== 常量定义 ====================

const VALIDITY_DAYS = 365; // 额度有效期天数
const REVIEW_BEFORE_EXPIRY_DAYS = 30; // 到期前多少天触发复审
const INACTIVE_DAYS_THRESHOLD = 90; // 长期未用阈值 (天)
const GOOD_REPAYMENT_COUNT = 3; // 按时还款多少次可提额
const INCREASE_PERCENTAGE = 0.2; // 提额比例 (20%)
const DECREASE_PERCENTAGE = 0.5; // 降额比例 (50%)

// 错误消息 (多语言)
const ERROR_MESSAGES = {
  INSUFFICIENT_SCORE: {
    code: 'INSUFFICIENT_SCORE',
    message: 'Credit score too low',
    messageEn: 'Credit score too low',
    messageTh: 'คะแนนเครดิตต่ำเกินไป'
  },
  LIMIT_ALREADY_GRANTED: {
    code: 'LIMIT_ALREADY_GRANTED',
    message: 'Credit limit already granted',
    messageEn: 'Credit limit already granted',
    messageTh: 'มีการอนุมัติวงเงินแล้ว'
  },
  INVALID_ADJUSTMENT: {
    code: 'INVALID_ADJUSTMENT',
    message: 'Invalid adjustment amount',
    messageEn: 'Invalid adjustment amount',
    messageTh: 'จำนวนการปรับไม่ถูกต้อง'
  },
  LIMIT_FROZEN: {
    code: 'LIMIT_FROZEN',
    message: 'Credit limit is frozen',
    messageEn: 'Credit limit is frozen',
    messageTh: 'วงเงินถูกแช่แข็ง'
  },
  LIMIT_EXPIRED: {
    code: 'LIMIT_EXPIRED',
    message: 'Credit limit has expired',
    messageEn: 'Credit limit has expired',
    messageTh: 'วงเงินหมดอายุแล้ว'
  },
  TEMPORARY_LIMIT_NOT_AVAILABLE: {
    code: 'TEMPORARY_LIMIT_NOT_AVAILABLE',
    message: 'Temporary limit not available',
    messageEn: 'Temporary limit not available',
    messageTh: 'วงเงินชั่วคราวไม่พร้อมใช้งาน'
  }
};

// ==================== 核心函数 ====================

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `cl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 授予信用额度
 * 
 * @param userId 用户 ID
 * @param profile 用户资料
 * @returns 授予结果
 */
export function grantCreditLimit(userId: string, profile: UserProfile): GrantLimitResult {
  try {
    // 计算信用评分
    const scoreResult = calculateCreditScore(profile);
    
    // 检查分数是否足够 (D 级及以上才授予额度)
    if (scoreResult.grade === 'D' || scoreResult.grade === 'F') {
      return {
        success: false,
        error: {
          ...ERROR_MESSAGES.INSUFFICIENT_SCORE,
          message: `Credit score ${scoreResult.totalScore} (${scoreResult.grade}) is insufficient`
        }
      };
    }
    
    // 获取推荐额度范围
    const limitRange = getRecommendedLimit(scoreResult.grade);
    const interestRate = getInterestRate(scoreResult.grade);
    
    // 根据评分在范围内确定具体额度 (线性插值)
    const gradeInfo = getCreditGrade(scoreResult.totalScore);
    const scoreInRange = (scoreResult.totalScore - gradeInfo.minScore) / (gradeInfo.maxScore - gradeInfo.minScore);
    const totalLimit = Math.round(limitRange.min + (limitRange.max - limitRange.min) * scoreInRange);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);
    
    const limit: CreditLimit = {
      id: generateId(),
      userId,
      totalLimit,
      availableLimit: totalLimit,
      usedLimit: 0,
      frozenLimit: 0,
      creditScore: scoreResult.totalScore,
      creditGrade: scoreResult.grade,
      scoreDetails: scoreResult,
      grantedAt: now,
      expiresAt,
      validityDays: VALIDITY_DAYS,
      status: 'active',
      interestRate,
      adjustmentHistory: [],
      reviewAt: new Date(expiresAt.getTime() - REVIEW_BEFORE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now
    };
    
    return {
      success: true,
      limit
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to grant credit limit',
        messageEn: 'Failed to grant credit limit',
        messageTh: 'ไม่สามารถอนุมัติวงเงินได้'
      }
    };
  }
}

/**
 * 调整信用额度
 * 
 * @param params 调整参数
 * @returns 调整结果
 */
export function adjustCreditLimit(params: AdjustLimitParams): AdjustLimitResult {
  try {
    const { currentLimit, adjustmentType, reason, reasonCode, adjustedBy } = params;
    
    // 检查额度状态
    if (currentLimit.status === 'expired') {
      return {
        success: false,
        error: ERROR_MESSAGES.LIMIT_EXPIRED
      };
    }
    
    if (currentLimit.status === 'revoked') {
      return {
        success: false,
        error: {
          code: 'LIMIT_REVOKED',
          message: 'Credit limit has been revoked',
          messageEn: 'Credit limit has been revoked',
          messageTh: 'วงเงินถูกเพิกถอนแล้ว'
        }
      };
    }
    
    const now = new Date();
    let newLimit = currentLimit.totalLimit;
    let newAvailableLimit = currentLimit.availableLimit;
    let newFrozenLimit = currentLimit.frozenLimit;
    
    // 计算新额度
    switch (adjustmentType) {
      case 'increase':
        if (params.percentage) {
          const increase = Math.round(currentLimit.totalLimit * params.percentage);
          newLimit = currentLimit.totalLimit + increase;
          newAvailableLimit = currentLimit.availableLimit + increase;
        } else if (params.amount) {
          newLimit = currentLimit.totalLimit + params.amount;
          newAvailableLimit = currentLimit.availableLimit + params.amount;
        } else {
          return {
            success: false,
            error: ERROR_MESSAGES.INVALID_ADJUSTMENT
          };
        }
        break;
        
      case 'decrease':
        if (params.percentage) {
          const decrease = Math.round(currentLimit.totalLimit * params.percentage);
          newLimit = Math.max(0, currentLimit.totalLimit - decrease);
          newAvailableLimit = Math.max(0, currentLimit.availableLimit - decrease);
        } else if (params.amount) {
          newLimit = Math.max(0, currentLimit.totalLimit - params.amount);
          newAvailableLimit = Math.max(0, currentLimit.availableLimit - params.amount);
        } else {
          return {
            success: false,
            error: ERROR_MESSAGES.INVALID_ADJUSTMENT
          };
        }
        break;
        
      case 'freeze':
        newFrozenLimit = currentLimit.totalLimit;
        newAvailableLimit = 0;
        break;
        
      case 'unfreeze':
        newFrozenLimit = 0;
        newAvailableLimit = currentLimit.totalLimit;
        break;
    }
    
    // 创建调整记录
    const adjustment: LimitAdjustment = {
      id: generateId(),
      type: adjustmentType,
      amount: Math.abs(newLimit - currentLimit.totalLimit),
      reason,
      reasonCode,
      previousLimit: currentLimit.totalLimit,
      newLimit,
      adjustedBy,
      adjustedAt: now,
      expiresAt: params.temporaryDays 
        ? new Date(now.getTime() + params.temporaryDays * 24 * 60 * 60 * 1000)
        : undefined
    };
    
    // 更新额度
    const updatedLimit: CreditLimit = {
      ...currentLimit,
      totalLimit: newLimit,
      availableLimit: newAvailableLimit,
      frozenLimit: newFrozenLimit,
      adjustmentHistory: [...currentLimit.adjustmentHistory, adjustment],
      status: adjustmentType === 'freeze' ? 'suspended' : 
              adjustmentType === 'unfreeze' ? 'active' : currentLimit.status,
      updatedAt: now
    };
    
    // 如果是临时额度调整，添加临时额度信息
    if (params.temporaryDays && adjustmentType === 'increase') {
      updatedLimit.temporaryLimit = {
        amount: newLimit - currentLimit.totalLimit,
        grantedAt: now,
        expiresAt: adjustment.expiresAt!,
        reason,
        minScore: currentLimit.creditScore,
        repaymentCount: 0
      };
    }
    
    return {
      success: true,
      limit: updatedLimit,
      adjustment
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to adjust credit limit',
        messageEn: 'Failed to adjust credit limit',
        messageTh: 'ไม่สามารถปรับวงเงินได้'
      }
    };
  }
}

/**
 * 检查是否需要复审
 * 
 * @param limit 当前额度
 * @param userProfile 用户资料 (用于重新评分)
 * @returns 复审结果
 */
export function checkLimitReview(limit: CreditLimit, userProfile?: UserProfile): LimitReviewResult {
  const now = new Date();
  const daysUntilExpiry = Math.floor((limit.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceGranted = Math.floor((now.getTime() - limit.grantedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // 1. 到期前复审
  if (daysUntilExpiry <= REVIEW_BEFORE_EXPIRY_DAYS && daysUntilExpiry >= 0) {
    return {
      shouldReview: true,
      reason: `Expiring in ${daysUntilExpiry} days`,
      recommendedAction: 'maintain'
    };
  }
  
  // 2. 已过期
  if (daysUntilExpiry < 0) {
    return {
      shouldReview: true,
      reason: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
      recommendedAction: limit.status === 'active' ? 'maintain' : 'revoke'
    };
  }
  
  // 3. 长期未使用 (90 天无借款)
  if (limit.usedLimit === 0 && daysSinceGranted >= INACTIVE_DAYS_THRESHOLD) {
    return {
      shouldReview: true,
      reason: `Inactive for ${daysSinceGranted} days`,
      recommendedAction: 'decrease'
    };
  }
  
  // 4. 如果有用户资料，检查信用评分变化
  if (userProfile) {
    const newScoreResult = calculateCreditScore(userProfile);
    
    // 信用提升 (按时还款 3 次+)
    if (newScoreResult.grade === 'A+' && limit.creditGrade !== 'A+') {
      return {
        shouldReview: true,
        reason: 'Credit score improved to A+',
        recommendedAction: 'increase',
        newScore: newScoreResult.totalScore,
        newGrade: newScoreResult.grade,
        recommendedLimit: getRecommendedLimit(newScoreResult.grade).max
      };
    }
    
    // 信用下降
    if (newScoreResult.grade === 'D' || newScoreResult.grade === 'F') {
      return {
        shouldReview: true,
        reason: `Credit score dropped to ${newScoreResult.grade}`,
        recommendedAction: 'freeze',
        newScore: newScoreResult.totalScore,
        newGrade: newScoreResult.grade
      };
    }
  }
  
  // 5. 临时额度到期检查
  if (limit.temporaryLimit && limit.temporaryLimit.expiresAt < now) {
    return {
      shouldReview: true,
      reason: 'Temporary limit expired',
      recommendedAction: 'decrease'
    };
  }
  
  return {
    shouldReview: false,
    reason: 'No review needed',
    recommendedAction: 'maintain'
  };
}

/**
 * 触发额度复审
 * 
 * @param limit 当前额度
 * @param userProfile 用户资料
 * @returns 复审后的新额度
 */
export function reviewCreditLimit(limit: CreditLimit, userProfile: UserProfile): { 
  success: boolean; 
  limit?: CreditLimit; 
  action: string;
  error?: any;
} {
  const reviewResult = checkLimitReview(limit, userProfile);
  
  if (!reviewResult.shouldReview) {
    return {
      success: true,
      limit,
      action: 'no_action_needed'
    };
  }
  
  const now = new Date();
  let updatedLimit = { ...limit };
  
  switch (reviewResult.recommendedAction) {
    case 'increase':
      if (reviewResult.newGrade && reviewResult.recommendedLimit) {
        const increase = reviewResult.recommendedLimit - limit.totalLimit;
        updatedLimit.totalLimit = reviewResult.recommendedLimit;
        updatedLimit.availableLimit = limit.availableLimit + increase;
        updatedLimit.creditScore = reviewResult.newScore!;
        updatedLimit.creditGrade = reviewResult.newGrade!;
        updatedLimit.interestRate = getInterestRate(reviewResult.newGrade!);
        
        updatedLimit.adjustmentHistory.push({
          id: generateId(),
          type: 'review',
          amount: increase,
          reason: 'Credit review - score improved',
          reasonCode: 'REVIEW_IMPROVE',
          previousLimit: limit.totalLimit,
          newLimit: reviewResult.recommendedLimit,
          adjustedBy: 'system',
          adjustedAt: now
        });
      }
      break;
      
    case 'decrease':
      const decrease = Math.round(limit.totalLimit * DECREASE_PERCENTAGE);
      updatedLimit.totalLimit = Math.max(1000, limit.totalLimit - decrease);
      updatedLimit.availableLimit = Math.min(updatedLimit.totalLimit, limit.availableLimit);
      
      updatedLimit.adjustmentHistory.push({
        id: generateId(),
        type: 'review',
        amount: decrease,
        reason: 'Credit review - inactive or score decreased',
        reasonCode: 'REVIEW_DECREASE',
        previousLimit: limit.totalLimit,
        newLimit: updatedLimit.totalLimit,
        adjustedBy: 'system',
        adjustedAt: now
      });
      break;
      
    case 'freeze':
      updatedLimit.frozenLimit = limit.totalLimit;
      updatedLimit.availableLimit = 0;
      updatedLimit.status = 'suspended';
      
      updatedLimit.adjustmentHistory.push({
        id: generateId(),
        type: 'review',
        amount: 0,
        reason: 'Credit review - score too low',
        reasonCode: 'REVIEW_FREEZE',
        previousLimit: limit.totalLimit,
        newLimit: limit.totalLimit,
        adjustedBy: 'system',
        adjustedAt: now
      });
      break;
      
    case 'revoke':
      updatedLimit.status = 'revoked';
      updatedLimit.availableLimit = 0;
      
      updatedLimit.adjustmentHistory.push({
        id: generateId(),
        type: 'review',
        amount: 0,
        reason: 'Credit review - limit expired or revoked',
        reasonCode: 'REVIEW_REVOKE',
        previousLimit: limit.totalLimit,
        newLimit: limit.totalLimit,
        adjustedBy: 'system',
        adjustedAt: now
      });
      break;
  }
  
  updatedLimit.updatedAt = now;
  updatedLimit.lastReviewScore = userProfile ? calculateCreditScore(userProfile).totalScore : limit.creditScore;
  updatedLimit.reviewAt = new Date(now.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  
  return {
    success: true,
    limit: updatedLimit,
    action: reviewResult.recommendedAction
  };
}

/**
 * 使用额度 (借款时调用)
 */
export function useCreditLimit(limit: CreditLimit, amount: number): { 
  success: boolean; 
  limit?: CreditLimit; 
  error?: any;
} {
  if (limit.status !== 'active') {
    return {
      success: false,
      error: {
        code: 'LIMIT_NOT_ACTIVE',
        message: 'Credit limit is not active',
        messageEn: 'Credit limit is not active',
        messageTh: 'วงเงินไม่พร้อมใช้งาน'
      }
    };
  }
  
  if (amount > limit.availableLimit) {
    return {
      success: false,
      error: {
        code: 'INSUFFICIENT_LIMIT',
        message: 'Insufficient available limit',
        messageEn: 'Insufficient available limit',
        messageTh: 'วงเงินไม่เพียงพอ'
      }
    };
  }
  
  const now = new Date();
  const updatedLimit: CreditLimit = {
    ...limit,
    usedLimit: limit.usedLimit + amount,
    availableLimit: limit.availableLimit - amount,
    updatedAt: now
  };
  
  return {
    success: true,
    limit: updatedLimit
  };
}

/**
 * 恢复额度 (还款时调用)
 */
export function restoreCreditLimit(limit: CreditLimit, amount: number): { 
  success: boolean; 
  limit?: CreditLimit;
} {
  const now = new Date();
  const restoreAmount = Math.min(amount, limit.usedLimit);
  
  const updatedLimit: CreditLimit = {
    ...limit,
    usedLimit: limit.usedLimit - restoreAmount,
    availableLimit: Math.min(limit.totalLimit, limit.availableLimit + restoreAmount),
    updatedAt: now
  };
  
  return {
    success: true,
    limit: updatedLimit
  };
}

/**
 * 获取临时额度资格
 */
export function checkTemporaryLimitEligibility(limit: CreditLimit): { 
  eligible: boolean; 
  amount?: number;
  reason?: string;
} {
  // 检查基本条件
  if (limit.status !== 'active') {
    return { eligible: false, reason: 'Limit not active' };
  }
  
  if (limit.creditGrade === 'D' || limit.creditGrade === 'F') {
    return { eligible: false, reason: 'Credit grade too low' };
  }
  
  if (limit.temporaryLimit && limit.temporaryLimit.expiresAt > new Date()) {
    return { eligible: false, reason: 'Already has active temporary limit' };
  }
  
  // 计算临时额度 (基础额度的 20-50%)
  const basePercentage = limit.creditGrade === 'A+' ? 0.5 :
                         limit.creditGrade === 'A' ? 0.4 :
                         limit.creditGrade === 'B' ? 0.3 : 0.2;
  
  const temporaryAmount = Math.round(limit.totalLimit * basePercentage);
  
  return {
    eligible: true,
    amount: temporaryAmount
  };
}

/**
 * 授予临时额度
 */
export function grantTemporaryLimit(
  limit: CreditLimit, 
  userProfile: UserProfile,
  days: number = 30
): { success: boolean; limit?: CreditLimit; error?: any } {
  const eligibility = checkTemporaryLimitEligibility(limit);
  
  if (!eligibility.eligible || !eligibility.amount) {
    return {
      success: false,
      error: {
        code: 'NOT_ELIGIBLE',
        message: eligibility.reason || 'Not eligible for temporary limit',
        messageEn: eligibility.reason || 'Not eligible for temporary limit',
        messageTh: 'ไม่มีสิทธิ์ได้รับวงเงินชั่วคราว'
      }
    };
  }
  
  const now = new Date();
  const temporaryAmount = eligibility.amount;
  
  const updatedLimit: CreditLimit = {
    ...limit,
    totalLimit: limit.totalLimit + temporaryAmount,
    availableLimit: limit.availableLimit + temporaryAmount,
    temporaryLimit: {
      amount: temporaryAmount,
      grantedAt: now,
      expiresAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
      reason: 'Temporary limit grant',
      minScore: limit.creditScore,
      repaymentCount: 0
    },
    adjustmentHistory: [
      ...limit.adjustmentHistory,
      {
        id: generateId(),
        type: 'temporary',
        amount: temporaryAmount,
        reason: 'Temporary limit granted',
        reasonCode: 'TEMP_GRANT',
        previousLimit: limit.totalLimit,
        newLimit: limit.totalLimit + temporaryAmount,
        adjustedBy: 'system',
        adjustedAt: now,
        expiresAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      }
    ],
    updatedAt: now
  };
  
  return {
    success: true,
    limit: updatedLimit
  };
}

/**
 * 序列化额度对象 (用于存储)
 */
export function serializeLimit(limit: CreditLimit): any {
  return {
    ...limit,
    grantedAt: limit.grantedAt.toISOString(),
    expiresAt: limit.expiresAt.toISOString(),
    reviewAt: limit.reviewAt?.toISOString(),
    createdAt: limit.createdAt.toISOString(),
    updatedAt: limit.updatedAt.toISOString(),
    adjustmentHistory: limit.adjustmentHistory.map(adj => ({
      ...adj,
      adjustedAt: adj.adjustedAt.toISOString(),
      expiresAt: adj.expiresAt?.toISOString()
    })),
    temporaryLimit: limit.temporaryLimit ? {
      ...limit.temporaryLimit,
      grantedAt: limit.temporaryLimit.grantedAt.toISOString(),
      expiresAt: limit.temporaryLimit.expiresAt.toISOString()
    } : undefined
  };
}

/**
 * 反序列化额度对象 (从存储加载)
 */
export function deserializeLimit(data: any): CreditLimit {
  return {
    ...data,
    grantedAt: new Date(data.grantedAt),
    expiresAt: new Date(data.expiresAt),
    reviewAt: data.reviewAt ? new Date(data.reviewAt) : undefined,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    adjustmentHistory: data.adjustmentHistory?.map((adj: any) => ({
      ...adj,
      adjustedAt: new Date(adj.adjustedAt),
      expiresAt: adj.expiresAt ? new Date(adj.expiresAt) : undefined
    })) || [],
    temporaryLimit: data.temporaryLimit ? {
      ...data.temporaryLimit,
      grantedAt: new Date(data.temporaryLimit.grantedAt),
      expiresAt: new Date(data.temporaryLimit.expiresAt)
    } : undefined
  };
}
