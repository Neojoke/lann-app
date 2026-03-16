/**
 * 信用服务 API 端点
 * 
 * 实现完整的信用评估和额度管理 API
 * 
 * API 端点:
 * - POST /api/credit/apply - 申请信用
 * - GET /api/credit/status - 查询状态
 * - GET /api/credit/limit - 查询额度
 * - POST /api/credit/review - 额度复审
 * 
 * 多语言支持:
 * - 从 Accept-Language 头检测语言 (en/th)
 * - 错误消息支持双语
 * - 响应数据包含双语标签
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  calculateCreditScore, 
  getCreditGrade, 
  getAllCreditGrades,
  type UserProfile 
} from '../services/credit-score.service';
import {
  grantCreditLimit,
  adjustCreditLimit,
  checkLimitReview,
  reviewCreditLimit,
  useCreditLimit,
  restoreCreditLimit,
  grantTemporaryLimit,
  checkTemporaryLimitEligibility,
  serializeLimit,
  deserializeLimit,
  type CreditLimit
} from '../services/credit-limit.service';

// ==================== 类型定义 ====================

interface CreditApplyRequest {
  profile?: UserProfile;
  consent: {
    credit_check: boolean;
    data_processing: boolean;
    terms_accepted: boolean;
  };
  language?: 'en' | 'th';
}

interface CreditLimitResponse {
  total_limit: number;
  available_limit: number;
  used_limit: number;
  frozen_limit: number;
  status: string;
  expires_at: string;
  days_until_expiry: number;
  credit_score?: number;
  credit_grade?: string;
  interest_rate?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    message_en?: string;
    message_th?: string;
  };
  language?: 'en' | 'th';
}

// ==================== 多语言消息 ====================

const MESSAGES = {
  APPLY_SUCCESS: {
    en: 'Credit application submitted successfully',
    th: 'ส่งคำขอเครดิตสำเร็จ'
  },
  APPLY_PENDING: {
    en: 'Your application is being reviewed',
    th: 'คำขอของคุณกำลังอยู่ระหว่างการตรวจสอบ'
  },
  STATUS_APPROVED: {
    en: 'Approved',
    th: 'อนุมัติแล้ว'
  },
  STATUS_PENDING: {
    en: 'Pending review',
    th: 'รอการตรวจสอบ'
  },
  STATUS_REJECTED: {
    en: 'Rejected',
    th: 'ถูกปฏิเสธ'
  },
  LIMIT_ACTIVE: {
    en: 'Active',
    th: 'ใช้งานได้แล้ว'
  },
  LIMIT_EXPIRED: {
    en: 'Expired',
    th: 'หมดอายุแล้ว'
  },
  LIMIT_SUSPENDED: {
    en: 'Suspended',
    th: 'ถูกระงับ'
  },
  REVIEW_SUCCESS: {
    en: 'Credit review completed successfully',
    th: 'การตรวจสอบเครดิตเสร็จสมบูรณ์'
  },
  ERROR_CONSENT_REQUIRED: {
    en: 'All consent items are required',
    th: 'ต้องยินยอมทุกข้อ'
  },
  ERROR_PROFILE_REQUIRED: {
    en: 'User profile is required',
    th: 'ต้องมีข้อมูลโปรไฟล์ผู้ใช้'
  },
  ERROR_LIMIT_NOT_FOUND: {
    en: 'Credit limit not found',
    th: 'ไม่พบวงเงินเครดิต'
  },
  ERROR_INVALID_LANGUAGE: {
    en: 'Invalid language parameter',
    th: 'พารามิเตอร์ภาษาไม่ถูกต้อง'
  }
};

// ==================== 模拟数据存储 (实际应使用数据库) ====================

// 内存存储 (开发环境使用)
const creditLimitsStore = new Map<string, CreditLimit>();
const applicationsStore = new Map<string, any>();

// ==================== API 路由 ====================

const creditApi = new Hono();

// 启用 CORS
creditApi.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
}));

// 多语言中间件
creditApi.use('*', async (c, next) => {
  const acceptLanguage = c.req.header('Accept-Language') || 'en';
  const language = acceptLanguage.startsWith('th') ? 'th' : 'en';
  c.set('language', language);
  await next();
});

/**
 * POST /api/credit/apply
 * 申请信用额度
 */
creditApi.post('/apply', async (c) => {
  const language = (c.get('language') as 'en' | 'th') || 'en';
  
  try {
    const body: CreditApplyRequest = await c.req.json();
    
    // 验证同意书
    if (!body.consent || !body.consent.credit_check || !body.consent.data_processing || !body.consent.terms_accepted) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: MESSAGES.ERROR_CONSENT_REQUIRED[language],
          message_en: MESSAGES.ERROR_CONSENT_REQUIRED.en,
          message_th: MESSAGES.ERROR_CONSENT_REQUIRED.th
        },
        language
      }, 400);
    }
    
    // 验证用户资料
    if (!body.profile) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'PROFILE_REQUIRED',
          message: MESSAGES.ERROR_PROFILE_REQUIRED[language],
          message_en: MESSAGES.ERROR_PROFILE_REQUIRED.en,
          message_th: MESSAGES.ERROR_PROFILE_REQUIRED.th
        },
        language
      }, 400);
    }
    
    // 生成申请 ID
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 计算信用评分
    const scoreResult = calculateCreditScore(body.profile);
    
    // 授予额度
    const grantResult = grantCreditLimit(applicationId, body.profile);
    
    if (grantResult.success && grantResult.limit) {
      // 存储额度信息
      creditLimitsStore.set(applicationId, grantResult.limit);
      
      // 存储申请记录
      applicationsStore.set(applicationId, {
        id: applicationId,
        userId: applicationId, // 实际应使用真实用户 ID
        profile: body.profile,
        creditScore: scoreResult.totalScore,
        creditGrade: scoreResult.grade,
        status: 'approved',
        appliedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      });
      
      return c.json<ApiResponse<{
        application_id: string;
        status: 'pending' | 'approved' | 'rejected';
        credit_score: number;
        credit_grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
        estimated_time: number;
        message: string;
        message_en: string;
        message_th: string;
      }>>({
        success: true,
        data: {
          application_id: applicationId,
          status: 'approved',
          credit_score: scoreResult.totalScore,
          credit_grade: scoreResult.grade,
          estimated_time: 0,
          message: MESSAGES.APPLY_SUCCESS[language],
          message_en: MESSAGES.APPLY_SUCCESS.en,
          message_th: MESSAGES.APPLY_SUCCESS.th
        },
        language
      });
    } else {
      // 申请被拒绝 (分数太低)
      applicationsStore.set(applicationId, {
        id: applicationId,
        status: 'rejected',
        appliedAt: new Date().toISOString(),
        rejectionReason: grantResult.error?.message
      });
      
      return c.json<ApiResponse>({
        success: false,
        error: grantResult.error,
        language
      }, 400);
    }
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process application',
        message_en: 'Failed to process application',
        message_th: 'ไม่สามารถประมวลผลคำขอได้'
      },
      language
    }, 500);
  }
});

/**
 * GET /api/credit/status
 * 查询信用状态
 */
creditApi.get('/status', async (c) => {
  const language = (c.get('language') as 'en' | 'th') || 'en';
  const userId = c.req.query('user_id');
  
  if (!userId) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'User ID is required',
        message_en: 'User ID is required',
        message_th: 'ต้องระบุรหัสผู้ใช้'
      },
      language
    }, 400);
  }
  
  try {
    // 查找用户的额度信息
    let userLimit: CreditLimit | undefined;
    let userApplication: any | undefined;
    
    // 在实际应用中，应该通过数据库查询
    // 这里简化处理，遍历查找
    for (const [key, limit] of creditLimitsStore.entries()) {
      if (limit.userId === userId) {
        userLimit = limit;
        break;
      }
    }
    
    for (const [key, app] of applicationsStore.entries()) {
      if (app.userId === userId) {
        userApplication = app;
        break;
      }
    }
    
    if (!userLimit && !userApplication) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'NO_APPLICATION',
          message: 'No credit application found',
          message_en: 'No credit application found',
          message_th: 'ไม่พบคำขอเครดิต'
        },
        language
      }, 404);
    }
    
    const response: any = {
      application_status: userApplication?.status || 'pending',
      message: userApplication?.status === 'approved' ? MESSAGES.STATUS_APPROVED[language] : 
               userApplication?.status === 'rejected' ? MESSAGES.STATUS_REJECTED[language] : 
               MESSAGES.STATUS_PENDING[language],
      message_en: userApplication?.status === 'approved' ? MESSAGES.STATUS_APPROVED.en : 
                  userApplication?.status === 'rejected' ? MESSAGES.STATUS_REJECTED.en : 
                  MESSAGES.STATUS_PENDING.en,
      message_th: userApplication?.status === 'approved' ? MESSAGES.STATUS_APPROVED.th : 
                  userApplication?.status === 'rejected' ? MESSAGES.STATUS_REJECTED.th : 
                  MESSAGES.STATUS_PENDING.th
    };
    
    if (userLimit) {
      response.credit_score = userLimit.creditScore;
      response.credit_limit = {
        total: userLimit.totalLimit,
        available: userLimit.availableLimit,
        used: userLimit.usedLimit
      };
      response.expires_at = userLimit.expiresAt.toISOString();
      response.review_at = userLimit.reviewAt?.toISOString();
    }
    
    return c.json<ApiResponse<typeof response>>({
      success: true,
      data: response,
      language
    });
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch status',
        message_en: 'Failed to fetch status',
        message_th: 'ไม่สามารถดึงสถานะได้'
      },
      language
    }, 500);
  }
});

/**
 * GET /api/credit/limit
 * 查询可用额度
 */
creditApi.get('/limit', async (c) => {
  const language = (c.get('language') as 'en' | 'th') || 'en';
  const userId = c.req.query('user_id');
  
  if (!userId) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'User ID is required',
        message_en: 'User ID is required',
        message_th: 'ต้องระบุรหัสผู้ใช้'
      },
      language
    }, 400);
  }
  
  try {
    // 查找用户的额度信息
    let userLimit: CreditLimit | undefined;
    
    for (const [key, limit] of creditLimitsStore.entries()) {
      if (limit.userId === userId) {
        userLimit = limit;
        break;
      }
    }
    
    if (!userLimit) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'LIMIT_NOT_FOUND',
          message: MESSAGES.ERROR_LIMIT_NOT_FOUND[language],
          message_en: MESSAGES.ERROR_LIMIT_NOT_FOUND.en,
          message_th: MESSAGES.ERROR_LIMIT_NOT_FOUND.th
        },
        language
      }, 404);
    }
    
    const now = new Date();
    const daysUntilExpiry = Math.floor((userLimit.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const responseData: CreditLimitResponse = {
      total_limit: userLimit.totalLimit,
      available_limit: userLimit.availableLimit,
      used_limit: userLimit.usedLimit,
      frozen_limit: userLimit.frozenLimit,
      status: userLimit.status,
      expires_at: userLimit.expiresAt.toISOString(),
      days_until_expiry: daysUntilExpiry,
      credit_score: userLimit.creditScore,
      credit_grade: userLimit.creditGrade,
      interest_rate: userLimit.interestRate
    };
    
    return c.json<ApiResponse<CreditLimitResponse>>({
      success: true,
      data: responseData,
      language
    });
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch limit',
        message_en: 'Failed to fetch limit',
        message_th: 'ไม่สามารถดึงวงเงินได้'
      },
      language
    }, 500);
  }
});

/**
 * POST /api/credit/review
 * 额度复审
 */
creditApi.post('/review', async (c) => {
  const language = (c.get('language') as 'en' | 'th') || 'en';
  
  try {
    const body = await c.req.json();
    const userId = body.user_id;
    const profile = body.profile;
    
    if (!userId) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'User ID is required',
          message_en: 'User ID is required',
          message_th: 'ต้องระบุรหัสผู้ใช้'
        },
        language
      }, 400);
    }
    
    // 查找用户的额度信息
    let userLimit: CreditLimit | undefined;
    
    for (const [key, limit] of creditLimitsStore.entries()) {
      if (limit.userId === userId) {
        userLimit = limit;
        break;
      }
    }
    
    if (!userLimit) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'LIMIT_NOT_FOUND',
          message: MESSAGES.ERROR_LIMIT_NOT_FOUND[language],
          message_en: MESSAGES.ERROR_LIMIT_NOT_FOUND.en,
          message_th: MESSAGES.ERROR_LIMIT_NOT_FOUND.th
        },
        language
      }, 404);
    }
    
    // 如果没有提供 profile，使用存储的资料
    let userProfile = profile;
    if (!userProfile) {
      // 在实际应用中，应该从数据库获取用户资料
      // 这里简化处理
      userProfile = {} as UserProfile;
    }
    
    // 执行复审
    const reviewResult = reviewCreditLimit(userLimit, userProfile);
    
    if (reviewResult.success && reviewResult.limit) {
      // 更新存储
      creditLimitsStore.set(userId, reviewResult.limit);
      
      return c.json<ApiResponse<{
        action: string;
        new_limit?: CreditLimitResponse;
        message: string;
        message_en: string;
        message_th: string;
      }>>({
        success: true,
        data: {
          action: reviewResult.action,
          new_limit: reviewResult.limit ? {
            total_limit: reviewResult.limit.totalLimit,
            available_limit: reviewResult.limit.availableLimit,
            used_limit: reviewResult.limit.usedLimit,
            frozen_limit: reviewResult.limit.frozenLimit,
            status: reviewResult.limit.status,
            expires_at: reviewResult.limit.expiresAt.toISOString(),
            days_until_expiry: Math.floor((reviewResult.limit.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            credit_score: reviewResult.limit.creditScore,
            credit_grade: reviewResult.limit.creditGrade,
            interest_rate: reviewResult.limit.interestRate
          } : undefined,
          message: MESSAGES.REVIEW_SUCCESS[language],
          message_en: MESSAGES.REVIEW_SUCCESS.en,
          message_th: MESSAGES.REVIEW_SUCCESS.th
        },
        language
      });
    } else {
      return c.json<ApiResponse>({
        success: false,
        error: reviewResult.error,
        language
      }, 500);
    }
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process review',
        message_en: 'Failed to process review',
        message_th: 'ไม่สามารถประมวลผลการตรวจสอบได้'
      },
      language
    }, 500);
  }
});

/**
 * GET /api/credit/grades
 * 获取所有信用等级信息 (辅助端点)
 */
creditApi.get('/grades', async (c) => {
  const language = (c.get('language') as 'en' | 'th') || 'en';
  
  const grades = getAllCreditGrades().map(grade => ({
    grade: grade.grade,
    min_score: grade.minScore,
    max_score: grade.maxScore,
    limit_range: grade.limitRange,
    interest_rate: grade.interestRate,
    description: language === 'th' ? grade.description.th : grade.description.en
  }));
  
  return c.json<ApiResponse<typeof grades>>({
    success: true,
    data: grades,
    language
  });
});

/**
 * POST /api/credit/temporary
 * 申请临时额度 (辅助端点)
 */
creditApi.post('/temporary', async (c) => {
  const language = (c.get('language') as 'en' | 'th') || 'en';
  
  try {
    const body = await c.req.json();
    const userId = body.user_id;
    const days = body.days || 30;
    
    if (!userId) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'USER_ID_REQUIRED',
          message: 'User ID is required',
          message_en: 'User ID is required',
          message_th: 'ต้องระบุรหัสผู้ใช้'
        },
        language
      }, 400);
    }
    
    // 查找用户的额度信息
    let userLimit: CreditLimit | undefined;
    
    for (const [key, limit] of creditLimitsStore.entries()) {
      if (limit.userId === userId) {
        userLimit = limit;
        break;
      }
    }
    
    if (!userLimit) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'LIMIT_NOT_FOUND',
          message: MESSAGES.ERROR_LIMIT_NOT_FOUND[language],
          message_en: MESSAGES.ERROR_LIMIT_NOT_FOUND.en,
          message_th: MESSAGES.ERROR_LIMIT_NOT_FOUND.th
        },
        language
      }, 404);
    }
    
    // 检查临时额度资格
    const eligibility = checkTemporaryLimitEligibility(userLimit);
    
    if (!eligibility.eligible) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'NOT_ELIGIBLE',
          message: eligibility.reason || 'Not eligible',
          message_en: eligibility.reason || 'Not eligible',
          message_th: eligibility.reason || 'ไม่มีสิทธิ์'
        },
        language
      }, 400);
    }
    
    // 授予临时额度
    const result = grantTemporaryLimit(userLimit, {} as UserProfile, days);
    
    if (result.success && result.limit) {
      creditLimitsStore.set(userId, result.limit);
      
      return c.json<ApiResponse<{
        temporary_amount: number;
        new_total_limit: number;
        expires_at: string;
      }>>({
        success: true,
        data: {
          temporary_amount: eligibility.amount!,
          new_total_limit: result.limit.totalLimit,
          expires_at: result.limit.temporaryLimit?.expiresAt.toISOString() || ''
        },
        language
      });
    } else {
      return c.json<ApiResponse>({
        success: false,
        error: result.error,
        language
      }, 500);
    }
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process temporary limit request',
        message_en: 'Failed to process temporary limit request',
        message_th: 'ไม่สามารถประมวลผลคำขอวงเงินชั่วคราวได้'
      },
      language
    }, 500);
  }
});

// ==================== 导出 ====================

export { creditApi };
export default creditApi;
