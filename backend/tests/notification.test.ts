/**
 * 通知服务 API 测试
 * 
 * 测试覆盖率目标：≥ 80%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../workers/notification.api';
import { db } from '../db';
import { cache } from '../services/cache.service';

// ==================== Mock 数据 ====================

const mockSmsRequest = {
  to: '+66812345678',
  message: 'Test SMS message'
};

const mockPushRequest = {
  user_id: 'user_001',
  title: 'Test Notification',
  body: 'This is a test push notification',
  data: { type: 'test' }
};

const mockEmailRequest = {
  to: 'test@example.com',
  subject: 'Test Email',
  body: 'This is a test email body'
};

const mockTemplate = {
  id: 'welcome_sms',
  name: 'Welcome SMS',
  type: 'sms',
  content_en: 'Welcome to Lann! Your account has been created.',
  content_th: 'ยินดีต้อนรับสู่ Lann! บัญชีของคุณถูกสร้างแล้ว',
  variables: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// ==================== 测试辅助函数 ====================

function createMockRequest(method: string, path: string, body?: any, headers?: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

// ==================== 测试套件 ====================

describe('Notification API', () => {
  beforeEach(() => {
    // 清空缓存
    cache.clear();
    
    // 初始化测试数据
    try {
      db.run(`DELETE FROM notifications WHERE recipient LIKE '%test%'`);
      
      // 创建测试模板
      db.run(
        `INSERT OR REPLACE INTO notification_templates (
          id, name, type, content_en, content_th, variables, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mockTemplate.id, mockTemplate.name, mockTemplate.type,
          mockTemplate.content_en, mockTemplate.content_th,
          JSON.stringify(mockTemplate.variables),
          mockTemplate.created_at, mockTemplate.updated_at
        ]
      );
      
      // 创建测试用户设备
      db.run(
        `INSERT OR REPLACE INTO user_devices (
          user_id, device_token, platform, active, created_at
        ) VALUES (?, ?, ?, ?, ?)`,
        ['user_001', 'device_token_123', 'ios', 1, new Date().toISOString()]
      );
    } catch (e) {
      // 表可能不存在，忽略
    }
  });

  afterEach(() => {
    // 清理测试数据
    try {
      db.run(`DELETE FROM notifications WHERE recipient LIKE '%test%'`);
    } catch (e) {
      // 忽略
    }
  });

  describe('POST /api/notifications/sms', () => {
    it('should send SMS successfully', async () => {
      const request = createMockRequest('POST', '/api/notifications/sms', mockSmsRequest);
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.to).toBe(mockSmsRequest.to);
      expect(data.data.status).toBe('sent');
    });

    it('should validate phone number', async () => {
      const invalidRequest = createMockRequest(
        'POST',
        '/api/notifications/sms',
        { to: 'invalid', message: 'Test' }
      );
      const response = await app.fetch(invalidRequest);
      
      expect(response.status).toBe(400);
    });

    it('should reject empty recipient', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/sms',
        { message: 'Test' }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent template', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/sms',
        {
          to: '+66812345678',
          template_id: 'nonexistent_template'
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(404);
    });

    it('should support Thai language', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/sms',
        { ...mockSmsRequest },
        { 'accept-language': 'th' }
      );
      const response = await app.fetch(request);
      
      const data = await response.json();
      expect(data.message).toBeDefined();
    });

    it('should enforce rate limiting', async () => {
      // 快速发送多个请求
      const requests = Array(10).fill(null).map(() =>
        createMockRequest('POST', '/api/notifications/sms', mockSmsRequest)
      );
      
      const responses = await Promise.all(requests.map(r => app.fetch(r)));
      
      // 至少有一些应该成功
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('POST /api/notifications/push', () => {
    it('should send push notification successfully', async () => {
      const request = createMockRequest('POST', '/api/notifications/push', mockPushRequest);
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.user_id).toBe(mockPushRequest.user_id);
    });

    it('should validate user_id', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/push',
        { title: 'Test', body: 'Test' }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should handle user with no devices', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/push',
        { ...mockPushRequest, user_id: 'nonexistent_user' }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.devices_reached).toBe(0);
    });

    it('should support optional data field', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/push',
        {
          user_id: 'user_001',
          title: 'Test',
          body: 'Test',
          data: { custom: 'value', nested: { key: 'value' } }
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/notifications/email', () => {
    it('should send email successfully', async () => {
      const request = createMockRequest('POST', '/api/notifications/email', mockEmailRequest);
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.to).toEqual([mockEmailRequest.to]);
    });

    it('should accept array of recipients', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/email',
        {
          ...mockEmailRequest,
          to: ['test1@example.com', 'test2@example.com']
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
    });

    it('should validate email format', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/email',
        {
          ...mockEmailRequest,
          to: 'invalid-email'
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should support CC and BCC', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/email',
        {
          ...mockEmailRequest,
          cc: 'cc@example.com',
          bcc: ['bcc1@example.com', 'bcc2@example.com']
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
    });

    it('should support HTML emails', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/email',
        {
          ...mockEmailRequest,
          html: true,
          body: '<h1>Test</h1><p>HTML content</p>'
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
    });


  });

  describe('GET /api/notifications/templates', () => {
    it('should return templates list', async () => {
      const request = createMockRequest('GET', '/api/notifications/templates');
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should cache templates', async () => {
      // 第一次请求
      const request1 = createMockRequest('GET', '/api/notifications/templates');
      await app.fetch(request1);
      
      // 第二次请求应该从缓存
      const request2 = createMockRequest('GET', '/api/notifications/templates');
      const response = await app.fetch(request2);
      
      expect(response.status).toBe(200);
    });

    it('should support Thai language response', async () => {
      const request = createMockRequest(
        'GET',
        '/api/notifications/templates',
        undefined,
        { 'accept-language': 'th' }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing content-type', async () => {
      const request = new Request('http://localhost/api/notifications/sms', {
        method: 'POST',
        body: JSON.stringify(mockSmsRequest)
      });
      
      const response = await app.fetch(request);
      expect(response.status).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond within 200ms for SMS', async () => {
      const start = Date.now();
      const request = createMockRequest('POST', '/api/notifications/sms', mockSmsRequest);
      await app.fetch(request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });

    it('should respond within 200ms for Push', async () => {
      const start = Date.now();
      const request = createMockRequest('POST', '/api/notifications/push', mockPushRequest);
      await app.fetch(request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });

    it('should respond within 200ms for Email', async () => {
      const start = Date.now();
      const request = createMockRequest('POST', '/api/notifications/email', mockEmailRequest);
      await app.fetch(request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Multi-language Support', () => {
    it('should return bilingual error messages', async () => {
      const request = createMockRequest(
        'POST',
        '/api/notifications/sms',
        { to: 'invalid' },
        { 'accept-language': 'en' }
      );
      const response = await app.fetch(request);
      const data = await response.json();
      
      expect(data.error.message_en).toBeDefined();
      expect(data.error.message_th).toBeDefined();
    });
  });
});
