/**
 * 用户服务 API
 * 
 * 实现用户详情、资料更新、KYC 状态查询和提交
 * 
 * API 端点:
 * - GET    /api/users/:id          # 用户详情
 * - PUT    /api/users/:id/profile  # 更新资料
 * - GET    /api/users/:id/kyc      # KYC 状态
 * - POST   /api/users/:id/kyc      # 提交 KYC
 * 
 * 功能:
 * - 用户信息管理
 * - KYC 认证流程
 * - 多语言支持 (EN/TH)
 * - 输入验证
 * - 错误处理
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../db';
import logger from '../services/logger.service';
import { cache, CacheNamespace } from '../services/cache.service';
import { dbPool } from '../services/db-pool.service';

// ==================== 类型定义 ====================

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  nationality?: string;
  id_card_number?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface KycStatus {
  user_id: string;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_id?: string;
  rejection_reason?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  selfie_url?: string;
  additional_documents?: string[];
}

interface KycSubmission {
  id_card_front: string;
  id_card_back: string;
  selfie: string;
  additional_documents?: string[];
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
}

// ==================== 多语言消息 ====================

const MESSAGES = {
  USER_NOT_FOUND: {
    en: 'User not found',
    th: 'ไม่พบผู้ใช้'
  },
  PROFILE_UPDATED: {
    en: 'Profile updated successfully',
    th: 'อัปเดตโปรไฟล์สำเร็จ'
  },
  KYC_SUBMITTED: {
    en: 'KYC information submitted successfully',
    th: 'ส่งข้อมูล KYC สำเร็จ'
  },
  KYC_ALREADY_SUBMITTED: {
    en: 'KYC already submitted',
    th: 'KYC ถูกส่งแล้ว'
  },
  KYC_APPROVED: {
    en: 'KYC approved',
    th: 'KYC อนุมัติแล้ว'
  },
  KYC_REJECTED: {
    en: 'KYC rejected',
    th: 'KYC ถูกปฏิเสธ'
  },
  KYC_UNDER_REVIEW: {
    en: 'KYC under review',
    th: 'KYC กำลังตรวจสอบ'
  },
  INVALID_INPUT: {
    en: 'Invalid input',
    th: 'ข้อมูลไม่ถูกต้อง'
  },
  MISSING_REQUIRED_FIELD: {
    en: 'Missing required field: ',
    th: 'ขาดข้อมูลที่จำเป็น: '
  },
  INTERNAL_ERROR: {
    en: 'Internal server error',
    th: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์'
  }
};

// ==================== 辅助函数 ====================

function getLanguage(headers: Headers): 'en' | 'th' {
  const acceptLang = headers.get('accept-language') || '';
  return acceptLang.toLowerCase().includes('th') ? 'th' : 'en';
}

function getMessage(key: keyof typeof MESSAGES, lang: 'en' | 'th'): string {
  return MESSAGES[key][lang];
}

function createError(
  code: string,
  key: keyof typeof MESSAGES,
  lang: 'en' | 'th',
  extra?: string
): ApiResponse['error'] {
  const message = getMessage(key, lang);
  return {
    code,
    message: extra ? message + extra : message,
    message_en: getMessage(key, 'en'),
    message_th: getMessage(key, 'th')
  };
}

function validateProfile(data: any): string | null {
  if (!data.email && !data.phone) {
    return '至少需要一个联系方式';
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return 'Invalid email format';
  }
  if (data.phone && !/^\+?[\d\s-]{8,}$/.test(data.phone)) {
    return 'Invalid phone format';
  }
  return null;
}

function validateKyc(data: any): string | null {
  if (!data.id_card_front) {
    return 'ID card front is required';
  }
  if (!data.id_card_back) {
    return 'ID card back is required';
  }
  if (!data.selfie) {
    return 'Selfie is required';
  }
  return null;
}

// ==================== 创建 API 路由 ====================

const app = new Hono();

// 启用 CORS
app.use('/api/users/*', cors());

/**
 * GET /api/users/:id
 * 获取用户详情
 */
app.get('/api/users/:id', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  const userId = c.req.param('id');
  
  try {
    return logger.track('Get user profile', async () => {
      // 尝试从缓存获取
      const cached = await cache.get<UserProfile>(CacheNamespace.USER_PROFILE, userId);
      if (cached) {
        return c.json({ success: true, data: cached });
      }
      
      // 从数据库查询
      const user = db.get(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      ) as UserProfile | undefined;
      
      if (!user) {
        return c.json(
          { success: false, error: createError('USER_NOT_FOUND', 'USER_NOT_FOUND', lang) },
          404
        );
      }
      
      // 缓存用户信息 (5 分钟)
      await cache.set(CacheNamespace.USER_PROFILE, userId, user, { ttl: 300 });
      
      return c.json({ success: true, data: user });
    });
  } catch (error) {
    logger.error('Failed to get user', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

/**
 * PUT /api/users/:id/profile
 * 更新用户资料
 */
app.put('/api/users/:id/profile', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  const userId = c.req.param('id');
  
  try {
    const body = await c.req.json();
    
    // 验证输入
    const validationError = validateProfile(body);
    if (validationError) {
      return c.json(
        { 
          success: false, 
          error: createError('INVALID_INPUT', 'INVALID_INPUT', lang, validationError) 
        },
        400
      );
    }
    
    return logger.track('Update user profile', async () => {
      // 检查用户是否存在
      const existingUser = db.get(
        `SELECT id FROM users WHERE id = ?`,
        [userId]
      );
      
      if (!existingUser) {
        return c.json(
          { success: false, error: createError('USER_NOT_FOUND', 'USER_NOT_FOUND', lang) },
          404
        );
      }
      
      // 构建更新字段
      const allowedFields = [
        'email', 'phone', 'first_name', 'last_name', 'date_of_birth',
        'nationality', 'id_card_number', 'address', 'city', 'province',
        'postal_code', 'country', 'avatar_url'
      ];
      
      const updates: string[] = [];
      const values: any[] = [];
      
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(body[field]);
        }
      }
      
      if (updates.length === 0) {
        return c.json(
          { success: false, error: createError('INVALID_INPUT', 'INVALID_INPUT', lang, 'No fields to update') },
          400
        );
      }
      
      updates.push(`updated_at = ?`);
      values.push(new Date().toISOString());
      values.push(userId);
      
      // 执行更新
      db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      // 清除缓存
      await cache.delete(CacheNamespace.USER_PROFILE, userId);
      
      // 获取更新后的用户信息
      const updatedUser = db.get(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      ) as UserProfile;
      
      // 重新缓存
      await cache.set(CacheNamespace.USER_PROFILE, userId, updatedUser, { ttl: 300 });
      
      return c.json({
        success: true,
        data: updatedUser,
        message: getMessage('PROFILE_UPDATED', lang)
      });
    });
  } catch (error) {
    logger.error('Failed to update profile', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

/**
 * GET /api/users/:id/kyc
 * 获取 KYC 状态
 */
app.get('/api/users/:id/kyc', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  const userId = c.req.param('id');
  
  try {
    return logger.track('Get KYC status', async () => {
      // 尝试从缓存获取
      const cached = await cache.get<KycStatus>(CacheNamespace.KYC_STATUS, userId);
      if (cached) {
        return c.json({ success: true, data: cached });
      }
      
      // 从数据库查询
      const kyc = db.get(
        `SELECT * FROM user_kyc WHERE user_id = ?`,
        [userId]
      ) as KycStatus | undefined;
      
      if (!kyc) {
        // 返回空状态
        return c.json({
          success: true,
          data: {
            user_id: userId,
            status: 'pending'
          }
        });
      }
      
      // 缓存 KYC 状态 (2 分钟)
      await cache.set(CacheNamespace.KYC_STATUS, userId, kyc, { ttl: 120 });
      
      return c.json({ success: true, data: kyc });
    });
  } catch (error) {
    logger.error('Failed to get KYC status', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

/**
 * POST /api/users/:id/kyc
 * 提交 KYC 信息
 */
app.post('/api/users/:id/kyc', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  const userId = c.req.param('id');
  
  try {
    const body = await c.req.json() as KycSubmission;
    
    // 验证输入
    const validationError = validateKyc(body);
    if (validationError) {
      return c.json(
        { 
          success: false, 
          error: createError('INVALID_INPUT', 'INVALID_INPUT', lang, validationError) 
        },
        400
      );
    }
    
    return logger.track('Submit KYC', async () => {
      // 检查用户是否存在
      const existingUser = db.get(
        `SELECT id FROM users WHERE id = ?`,
        [userId]
      );
      
      if (!existingUser) {
        return c.json(
          { success: false, error: createError('USER_NOT_FOUND', 'USER_NOT_FOUND', lang) },
          404
        );
      }
      
      // 检查是否已提交
      const existingKyc = db.get(
        `SELECT status FROM user_kyc WHERE user_id = ?`,
        [userId]
      ) as { status: string } | undefined;
      
      if (existingKyc && existingKyc.status !== 'rejected') {
        return c.json(
          { 
            success: false, 
            error: createError('KYC_ALREADY_SUBMITTED', 'KYC_ALREADY_SUBMITTED', lang) 
          },
          400
        );
      }
      
      const now = new Date().toISOString();
      
      if (existingKyc) {
        // 更新现有记录
        db.run(
          `UPDATE user_kyc SET 
            status = ?,
            id_card_front_url = ?,
            id_card_back_url = ?,
            selfie_url = ?,
            additional_documents = ?,
            submitted_at = ?,
            updated_at = ?
          WHERE user_id = ?`,
          [
            'submitted',
            body.id_card_front,
            body.id_card_back,
            body.selfie,
            JSON.stringify(body.additional_documents || []),
            now,
            now,
            userId
          ]
        );
      } else {
        // 创建新记录
        db.run(
          `INSERT INTO user_kyc (
            user_id, status, id_card_front_url, id_card_back_url, 
            selfie_url, additional_documents, submitted_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            'submitted',
            body.id_card_front,
            body.id_card_back,
            body.selfie,
            JSON.stringify(body.additional_documents || []),
            now,
            now,
            now
          ]
        );
      }
      
      // 清除缓存
      await cache.delete(CacheNamespace.KYC_STATUS, userId);
      
      // 获取更新后的 KYC 状态
      const kyc = db.get(
        `SELECT * FROM user_kyc WHERE user_id = ?`,
        [userId]
      ) as KycStatus;
      
      // 重新缓存
      await cache.set(CacheNamespace.KYC_STATUS, userId, kyc, { ttl: 120 });
      
      return c.json({
        success: true,
        data: kyc,
        message: getMessage('KYC_SUBMITTED', lang)
      });
    });
  } catch (error) {
    logger.error('Failed to submit KYC', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

// ==================== 导出 ====================

export default app;
