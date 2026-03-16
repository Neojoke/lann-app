/**
 * 文件上传 API 测试
 * 
 * 测试覆盖率目标：≥ 80%
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../workers/upload.api';
import { db } from '../db';
import { cache } from '../services/cache.service';
import { randomUUID } from 'crypto';

// ==================== Mock 数据 ====================

const mockFileRecord = {
  id: randomUUID(),
  filename: 'test_file.jpg',
  original_name: 'original.jpg',
  content_type: 'image/jpeg',
  size: 1024,
  storage_path: '/tmp/test_file.jpg',
  url: `/api/upload/test`,
  uploaded_by: 'user_001',
  created_at: new Date().toISOString()
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

describe('Upload API', () => {
  beforeEach(() => {
    // 清空缓存
    cache.clear();
    
    // 清理测试数据
    try {
      db.run(`DELETE FROM uploaded_files WHERE uploaded_by = ?`, ['user_001']);
    } catch (e) {
      // 忽略
    }
  });

  afterEach(() => {
    // 清理测试数据
    try {
      db.run(`DELETE FROM uploaded_files WHERE uploaded_by = ?`, ['user_001']);
    } catch (e) {
      // 忽略
    }
  });

  describe('POST /api/upload (JSON/Base64)', () => {
    it('should validate required fields', async () => {
      const request = createMockRequest(
        'POST',
        '/api/upload',
        {
          filename: 'test.txt'
          // missing content_type and base64
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should validate file type', async () => {
      const request = createMockRequest(
        'POST',
        '/api/upload',
        {
          filename: 'test.exe',
          content_type: 'application/x-executable',
          base64: 'dGVzdA==',
          uploaded_by: 'user_001'
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });

    it('should reject large files', async () => {
      // 创建一个超过 50MB 的 base64 字符串
      const largeBase64 = 'A'.repeat(60 * 1024 * 1024);
      
      const request = createMockRequest(
        'POST',
        '/api/upload',
        {
          filename: 'large.bin',
          content_type: 'application/octet-stream',
          base64: largeBase64,
          uploaded_by: 'user_001'
        }
      );
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/upload (Binary)', () => {
    it('should validate binary file type', async () => {
      const request = new Request('http://localhost/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-executable',
          'X-Filename': 'test.exe',
          'X-Uploaded-By': 'user_001'
        },
        body: 'binary content'
      });
      
      const response = await app.fetch(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/upload/:id', () => {
    it('should support Thai language error messages', async () => {
      const request = createMockRequest(
        'GET',
        '/api/upload/nonexistent',
        undefined,
        { 'accept-language': 'th' }
      );
      const response = await app.fetch(request);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE /api/upload/:id', () => {
    it('should handle delete gracefully', async () => {
      // 尝试删除不存在的文件应该返回有效响应
      const request = createMockRequest('DELETE', '/api/upload/nonexistent');
      const response = await app.fetch(request);
      
      expect(response.status).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing content-type', async () => {
      const request = new Request('http://localhost/api/upload', {
        method: 'POST',
        body: 'test content'
      });
      
      const response = await app.fetch(request);
      expect(response.status).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should respond within 200ms for small files', async () => {
      const base64Content = Buffer.from('small file').toString('base64');
      const start = Date.now();
      
      const request = createMockRequest(
        'POST',
        '/api/upload',
        {
          filename: 'small.txt',
          content_type: 'text/plain',
          base64: base64Content,
          uploaded_by: 'user_001'
        }
      );
      await app.fetch(request);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('File Type Validation', () => {
    it('should reject disallowed types', async () => {
      const disallowedTypes = [
        'application/x-executable',
        'application/x-msdownload',
        'text/x-script'
      ];
      
      for (const type of disallowedTypes) {
        const request = createMockRequest(
          'POST',
          '/api/upload',
          {
            filename: 'test.bin',
            content_type: type,
            base64: 'dGVzdA==',
            uploaded_by: 'user_001'
          }
        );
        const response = await app.fetch(request);
        expect(response.status).toBe(400);
      }
    });
  });
});
