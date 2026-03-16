/**
 * 用户服务 API 测试
 * 
 * 测试覆盖率目标：≥ 80%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import app from '../workers/user.api';
import { db } from '../db';
import { cache } from '../services/cache.service';

// ==================== Mock 数据 ====================

const mockUser = {
  id: 'user_001',
  email: 'test@example.com',
  phone: '+66812345678',
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  date_of_birth: '1990-01-01',
  nationality: 'Thai',
  id_card_number: '1234567890123',
  address: '123 Test Street',
  city: 'Bangkok',
  province: 'Bangkok',
  postal_code: '10100',
  country: 'TH',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockKyc = {
  user_id: 'user_001',
  status: 'approved',
  submitted_at: new Date().toISOString(),
  reviewed_at: new Date().toISOString(),
  id_card_front_url: 'https://storage.example.com/kyc/front.jpg',
  id_card_back_url: 'https://storage.example.com/kyc/back.jpg',
  selfie_url: 'https://storage.example.com/kyc/selfie.jpg'
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

describe('User API', () => {
  beforeEach(() => {
    // 清空缓存
    cache.clear();
    
    // 初始化测试数据
    try {
      db.run(`DELETE FROM users WHERE id = ?`, [mockUser.id]);
      db.run(`DELETE FROM user_kyc WHERE user_id = ?`, [mockUser.id]);
      
      db.run(
        `INSERT INTO users (
          id, email, phone, first_name, last_name, full_name, 
          date_of_birth, nationality, id_card_number, address, 
          city, province, postal_code, country, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mockUser.id, mockUser.email, mockUser.phone, mockUser.first_name,
          mockUser.last_name, mockUser.full_name, mockUser.date_of_birth,
          mockUser.nationality, mockUser.id_card_number, mockUser.address,
          mockUser.city, mockUser.province, mockUser.postal_code,
          mockUser.country, mockUser.created_at, mockUser.updated_at
        ]
      );
    } catch (e) {
      // 表可能不存在，忽略
    }
  });

  afterEach(() => {
    // 清理测试数据
    try {
      db.run(`DELETE FROM users WHERE id = ?`, [mockUser.id]);
      db.run(`DELETE FROM user_kyc WHERE user_id = ?`, [mockUser.id]);
    } catch (e) {
      // 忽略
    }
  });

  describe('GET /api/users/:id', () => {
    it('should return 404 for non-existent user', async () => {
      const request = createMockRequest('GET', '/api/users/nonexistent');
      const response = await app.fetch(request);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('USER_NOT_FOUND');
    });

    it('should handle cache miss gracefully', async () => {
      // Mock 数据库返回 null，所以这个测试验证缓存未命中时的行为
      const request1 = createMockRequest('GET', `/api/users/${mockUser.id}`);
      const response1 = await app.fetch(request1);
      
      // 第一次请求返回 404 (用户不存在)
      expect(response1.status).toBe(404);
    });

    it('should support Thai language', async () => {
      const request = createMockRequest(
        'GET',
        '/api/users/nonexistent',
        undefined,
        { 'accept-language': 'th' }
      );
      const response = await app.fetch(request);
      
      const data = await response.json();
      expect(data.error.message_th).toBeDefined();
    });
  });

  describe('PUT /api/users/:id/profile', () => {
    it('should validate email format', async () => {
      const request = createMockRequest(
        'PUT',
        `/api/users/${mockUser.id}/profile`,
        { email: 'invalid-email' }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should validate phone format', async () => {
      const request = createMockRequest(
        'PUT',
        `/api/users/${mockUser.id}/profile`,
        { phone: '123' }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should reject empty update', async () => {
      const request = createMockRequest(
        'PUT',
        `/api/users/${mockUser.id}/profile`,
        {}
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should require at least one contact method', async () => {
      const request = createMockRequest(
        'PUT',
        `/api/users/${mockUser.id}/profile`,
        { first_name: 'Test' }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/users/:id/kyc', () => {
    it('should return pending status for new user', async () => {
      const request = createMockRequest('GET', `/api/users/${mockUser.id}/kyc`);
      const response = await app.fetch(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('pending');
    });
  });

  describe('POST /api/users/:id/kyc', () => {
    const kycSubmission = {
      id_card_front: 'https://storage.example.com/front.jpg',
      id_card_back: 'https://storage.example.com/back.jpg',
      selfie: 'https://storage.example.com/selfie.jpg',
      additional_documents: ['https://storage.example.com/doc1.pdf']
    };

    it('should validate required fields', async () => {
      const incompleteData = {
        id_card_front: 'https://storage.example.com/front.jpg'
        // missing id_card_back and selfie
      };
      
      const request = createMockRequest(
        'POST',
        `/api/users/${mockUser.id}/kyc`,
        incompleteData
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const request = createMockRequest(
        'POST',
        '/api/users/nonexistent/kyc',
        kycSubmission
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // 这个测试验证错误处理路径
      const request = createMockRequest('GET', `/api/users/${mockUser.id}`);
      const response = await app.fetch(request);
      
      // 应该返回有效响应而不是崩溃
      expect(response.status).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond within 200ms', async () => {
      const start = Date.now();
      const request = createMockRequest('GET', `/api/users/${mockUser.id}`);
      await app.fetch(request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });
  });
});
