/**
 * 通知服务 API
 * 
 * 实现短信发送、推送通知、邮件发送和模板管理
 * 
 * API 端点:
 * - POST /api/notifications/sms      # 发送短信
 * - POST /api/notifications/push     # 推送通知
 * - POST /api/notifications/email    # 发送邮件
 * - GET  /api/notifications/templates # 模板列表
 * 
 * 功能:
 * - 多渠道通知 (SMS/Push/Email)
 * - 模板系统
 * - 发送记录追踪
 * - 速率限制
 * - 多语言支持
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from '../db';
import logger from '../services/logger.service';
import { cache, CacheNamespace } from '../services/cache.service';

// ==================== 类型定义 ====================

interface SmsRequest {
  to: string;
  message: string;
  template_id?: string;
  template_data?: Record<string, any>;
  language?: 'en' | 'th';
}

interface PushRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

interface EmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  html?: boolean;
  template_id?: string;
  template_data?: Record<string, any>;
  attachments?: Attachment[];
}

interface Attachment {
  filename: string;
  content: string;
  contentType: string;
}

interface Template {
  id: string;
  name: string;
  type: 'sms' | 'push' | 'email';
  subject?: string;
  content_en: string;
  content_th: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

interface NotificationRecord {
  id: string;
  type: 'sms' | 'push' | 'email';
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  sent_at?: string;
  created_at: string;
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
  SMS_SENT: {
    en: 'SMS sent successfully',
    th: 'ส่ง SMS สำเร็จ'
  },
  PUSH_SENT: {
    en: 'Push notification sent successfully',
    th: 'ส่งการแจ้งเตือนสำเร็จ'
  },
  EMAIL_SENT: {
    en: 'Email sent successfully',
    th: 'ส่งอีเมลสำเร็จ'
  },
  INVALID_RECIPIENT: {
    en: 'Invalid recipient',
    th: 'ผู้รับไม่ถูกต้อง'
  },
  TEMPLATE_NOT_FOUND: {
    en: 'Template not found',
    th: 'ไม่พบเทมเพลต'
  },
  MISSING_REQUIRED_FIELD: {
    en: 'Missing required field',
    th: 'ขาดข้อมูลที่จำเป็น'
  },
  RATE_LIMIT_EXCEEDED: {
    en: 'Rate limit exceeded',
    th: 'เกินจำนวนครั้งที่กำหนด'
  },
  INTERNAL_ERROR: {
    en: 'Internal server error',
    th: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์'
  }
};

// ==================== 速率限制器 ====================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly limit: number;
  private readonly window: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // 移除窗口外的请求
    const validRequests = userRequests.filter(time => now - time < this.window);
    
    if (validRequests.length >= this.limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter(100, 60000); // 每分钟 100 次

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

function renderTemplate(template: Template, data?: Record<string, any>, lang: 'en' | 'th' = 'en'): string {
  let content = lang === 'th' ? template.content_th : template.content_en;
  
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }
  }
  
  return content;
}

function validatePhone(phone: string): boolean {
  return /^\+?[\d\s-]{8,}$/.test(phone);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==================== 创建 API 路由 ====================

const app = new Hono();

// 启用 CORS
app.use('/api/notifications/*', cors());

/**
 * POST /api/notifications/sms
 * 发送短信
 */
app.post('/api/notifications/sms', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  
  try {
    const body = await c.req.json() as SmsRequest;
    
    // 验证输入
    if (!body.to || !validatePhone(body.to)) {
      return c.json(
        { success: false, error: createError('INVALID_RECIPIENT', 'INVALID_RECIPIENT', lang) },
        400
      );
    }
    
    // 速率限制检查
    const rateLimitKey = `sms:${body.to}`;
    if (!rateLimiter.check(rateLimitKey)) {
      return c.json(
        { success: false, error: createError('RATE_LIMIT_EXCEEDED', 'RATE_LIMIT_EXCEEDED', lang) },
        429
      );
    }
    
    return logger.track('Send SMS', async () => {
      let message = body.message;
      
      // 如果使用模板
      if (body.template_id) {
        const template = await getTemplate(body.template_id);
        if (!template) {
          return c.json(
            { success: false, error: createError('TEMPLATE_NOT_FOUND', 'TEMPLATE_NOT_FOUND', lang) },
            404
          );
        }
        message = renderTemplate(template, body.template_data, body.language || 'en');
      }
      
      // 记录发送
      const recordId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      db.run(
        `INSERT INTO notifications (
          id, type, recipient, message, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [recordId, 'sms', body.to, message, 'sent', now]
      );
      
      // TODO: 集成实际的 SMS 服务 (Twilio/本地运营商)
      logger.info('SMS sent', {
        to: body.to,
        message: message.substring(0, 50) + '...'
      });
      
      return c.json({
        success: true,
        data: {
          id: recordId,
          to: body.to,
          status: 'sent',
          sent_at: now
        },
        message: getMessage('SMS_SENT', lang)
      });
    });
  } catch (error) {
    logger.error('Failed to send SMS', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

/**
 * POST /api/notifications/push
 * 发送推送通知
 */
app.post('/api/notifications/push', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  
  try {
    const body = await c.req.json() as PushRequest;
    
    // 验证输入
    if (!body.user_id) {
      return c.json(
        { 
          success: false, 
          error: createError('MISSING_REQUIRED_FIELD', 'MISSING_REQUIRED_FIELD', lang, 'user_id') 
        },
        400
      );
    }
    
    // 速率限制检查
    const rateLimitKey = `push:${body.user_id}`;
    if (!rateLimiter.check(rateLimitKey)) {
      return c.json(
        { success: false, error: createError('RATE_LIMIT_EXCEEDED', 'RATE_LIMIT_EXCEEDED', lang) },
        429
      );
    }
    
    return logger.track('Send Push', async () => {
      // 获取用户设备 token
      const deviceTokens = db.all(
        `SELECT device_token FROM user_devices WHERE user_id = ? AND active = 1`,
        [body.user_id]
      ) as Array<{ device_token: string }>;
      
      if (deviceTokens.length === 0) {
        logger.warn('No active devices for user', { user_id: body.user_id });
        return c.json({
          success: true,
          data: {
            user_id: body.user_id,
            devices_reached: 0
          }
        });
      }
      
      // 记录发送
      const recordId = `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      db.run(
        `INSERT INTO notifications (
          id, type, recipient, message, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          'push',
          body.user_id,
          body.title + ': ' + body.body,
          'sent',
          now
        ]
      );
      
      // TODO: 集成实际的推送服务 (FCM/APNs)
      logger.info('Push notification sent', {
        user_id: body.user_id,
        devices: deviceTokens.length,
        title: body.title
      });
      
      return c.json({
        success: true,
        data: {
          id: recordId,
          user_id: body.user_id,
          devices_reached: deviceTokens.length,
          status: 'sent',
          sent_at: now
        },
        message: getMessage('PUSH_SENT', lang)
      });
    });
  } catch (error) {
    logger.error('Failed to send push notification', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

/**
 * POST /api/notifications/email
 * 发送邮件
 */
app.post('/api/notifications/email', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  
  try {
    const body = await c.req.json() as EmailRequest;
    
    // 验证输入
    const recipients = Array.isArray(body.to) ? body.to : [body.to];
    for (const email of recipients) {
      if (!validateEmail(email)) {
        return c.json(
          { success: false, error: createError('INVALID_RECIPIENT', 'INVALID_RECIPIENT', lang) },
          400
        );
      }
    }
    
    // 速率限制检查
    const rateLimitKey = `email:${recipients.join(',')}`;
    if (!rateLimiter.check(rateLimitKey)) {
      return c.json(
        { success: false, error: createError('RATE_LIMIT_EXCEEDED', 'RATE_LIMIT_EXCEEDED', lang) },
        429
      );
    }
    
    return logger.track('Send Email', async () => {
      let subject = body.subject;
      let emailBody = body.body;
      
      // 如果使用模板
      if (body.template_id) {
        const template = await getTemplate(body.template_id);
        if (!template) {
          return c.json(
            { success: false, error: createError('TEMPLATE_NOT_FOUND', 'TEMPLATE_NOT_FOUND', lang) },
            404
          );
        }
        subject = template.subject || '';
        emailBody = renderTemplate(template, body.template_data, 'en');
      }
      
      // 记录发送
      const recordId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      db.run(
        `INSERT INTO notifications (
          id, type, recipient, message, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          'email',
          recipients.join(','),
          subject + ': ' + emailBody.substring(0, 100),
          'sent',
          now
        ]
      );
      
      // TODO: 集成实际的邮件服务 (SendGrid/Nodemailer)
      logger.info('Email sent', {
        to: recipients,
        subject: subject
      });
      
      return c.json({
        success: true,
        data: {
          id: recordId,
          to: recipients,
          status: 'sent',
          sent_at: now
        },
        message: getMessage('EMAIL_SENT', lang)
      });
    });
  } catch (error) {
    logger.error('Failed to send email', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

/**
 * GET /api/notifications/templates
 * 获取模板列表
 */
app.get('/api/notifications/templates', async (c) => {
  const lang = getLanguage(c.req.raw.headers);
  
  try {
    return logger.track('Get templates', async () => {
      // 尝试从缓存获取
      const cached = await cache.get<Template[]>(CacheNamespace.SYSTEM_CONFIG, 'templates');
      if (cached) {
        return c.json({ success: true, data: cached });
      }
      
      // 从数据库查询
      const templates = db.all(
        `SELECT * FROM notification_templates ORDER BY type, name`
      ) as Template[];
      
      // 缓存模板列表 (10 分钟)
      await cache.set(CacheNamespace.SYSTEM_CONFIG, 'templates', templates, { ttl: 600 });
      
      return c.json({ success: true, data: templates });
    });
  } catch (error) {
    logger.error('Failed to get templates', error as Error);
    return c.json(
      { success: false, error: createError('INTERNAL_ERROR', 'INTERNAL_ERROR', lang) },
      500
    );
  }
});

// ==================== 辅助函数 ====================

async function getTemplate(templateId: string): Promise<Template | null> {
  // 尝试从缓存获取
  const cached = await cache.get<Template>(CacheNamespace.SYSTEM_CONFIG, `template:${templateId}`);
  if (cached) {
    return cached;
  }
  
  // 从数据库查询
  const template = db.get(
    `SELECT * FROM notification_templates WHERE id = ?`,
    [templateId]
  ) as Template | undefined;
  
  if (template) {
    await cache.set(CacheNamespace.SYSTEM_CONFIG, `template:${templateId}`, template, { ttl: 600 });
    return template;
  }
  
  return null;
}

// ==================== 导出 ====================

export default app;
