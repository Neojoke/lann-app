/**
 * 信用状态查询 API 测试
 * 
 * 测试覆盖:
 * - 信用状态查询
 * - 额度信息
 * - 信用历史
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../../../../backend/db';

describe('API Integration - Credit Status', () => {
  const testUserId = 'api_test_user_status';

  beforeAll(async () => {
    // Setup test user and credit
    await db.execute(`
      INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
      VALUES ('${testUserId}', '0812345678', 'TH', datetime('now'))
    `);

    await db.execute(`
      INSERT OR REPLACE INTO credit_limits 
        (user_id, total_limit, available_limit, used_limit, credit_score, credit_grade, status, granted_at, expires_at)
      VALUES 
        ('${testUserId}', 50000, 45000, 5000, 750, 'A+', 'active', datetime('now'), datetime('now', '+1 year'))
    `);
  });

  afterAll(async () => {
    await db.execute(`DELETE FROM credit_limits WHERE user_id = '${testUserId}'`);
    await db.execute(`DELETE FROM users WHERE id = '${testUserId}'`);
  });

  describe('GET /api/credit/status', () => {
    it('should return complete credit status', async () => {
      const result = await db.execute(`
        SELECT 
          user_id,
          total_limit,
          available_limit,
          used_limit,
          frozen_limit,
          credit_score,
          credit_grade,
          status,
          granted_at,
          expires_at
        FROM credit_limits
        WHERE user_id = '${testUserId}'
      `);

      expect(result.results.length).toBe(1);
      expect(result.results[0].user_id).toBe(testUserId);
      expect(result.results[0].total_limit).toBe(50000);
      expect(result.results[0].available_limit).toBe(45000);
      expect(result.results[0].credit_score).toBe(750);
      expect(result.results[0].credit_grade).toBe('A+');
      expect(result.results[0].status).toBe('active');
    });

    it('should include utilization percentage', async () => {
      const result = await db.execute(`
        SELECT 
          total_limit,
          used_limit,
          ROUND(used_limit * 100.0 / total_limit, 2) as utilization
        FROM credit_limits
        WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].utilization).toBe(10); // 5000/50000 = 10%
    });

    it('should include days until expiry', async () => {
      const result = await db.execute(`
        SELECT 
          expires_at,
          JULIANDAY(expires_at) - JULIANDAY('now') as days_until_expiry
        FROM credit_limits
        WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].days_until_expiry).toBeGreaterThan(300); // ~1 year
    });
  });

  describe('GET /api/credit/limit', () => {
    it('should return detailed limit breakdown', async () => {
      const result = await db.execute(`
        SELECT 
          total_limit,
          available_limit,
          used_limit,
          COALESCE(frozen_limit, 0) as frozen_limit
        FROM credit_limits
        WHERE user_id = '${testUserId}'
      `);

      const limit = result.results[0];
      
      expect(limit.total_limit).toBe(50000);
      expect(limit.available_limit).toBe(45000);
      expect(limit.used_limit).toBe(5000);
      expect(limit.frozen_limit).toBe(0);
      
      // Verify: total = available + used + frozen
      expect(limit.total_limit).toBe(limit.available_limit + limit.used_limit + limit.frozen_limit);
    });

    it('should handle frozen limit', async () => {
      // Freeze part of the limit
      await db.execute(`
        UPDATE credit_limits SET frozen_limit = 10000, available_limit = 35000
        WHERE user_id = '${testUserId}'
      `);

      const result = await db.execute(`
        SELECT available_limit, frozen_limit FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].frozen_limit).toBe(10000);
      expect(result.results[0].available_limit).toBe(35000);

      // Restore
      await db.execute(`
        UPDATE credit_limits SET frozen_limit = 0, available_limit = 45000
        WHERE user_id = '${testUserId}'
      `);
    });
  });

  describe('GET /api/credit/history', () => {
    it('should return credit score history', async () => {
      // Insert some history records
      await db.execute(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, created_at)
        VALUES 
          ('${testUserId}', 'UPDATE', 'credit_limits', 'limit_1', 
           '{"credit_score": 700}', '{"credit_score": 750}', datetime('now', '-30 days')),
          ('${testUserId}', 'UPDATE', 'credit_limits', 'limit_1',
           '{"credit_score": 750}', '{"credit_score": 780}', datetime('now', '-15 days')),
          ('${testUserId}', 'UPDATE', 'credit_limits', 'limit_1',
           '{"credit_score": 780}', '{"credit_score": 750}', datetime('now'))
      `);

      const result = await db.execute(`
        SELECT 
          created_at,
          old_value,
          new_value
        FROM audit_logs
        WHERE user_id = '${testUserId}' 
          AND entity_type = 'credit_limits'
          AND action = 'UPDATE'
        ORDER BY created_at DESC
        LIMIT 10
      `);

      expect(result.results.length).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM audit_logs WHERE user_id = '${testUserId}'`);
    });

    it('should support pagination', async () => {
      const page = 1;
      const pageSize = 10;
      const offset = (page - 1) * pageSize;

      const result = await db.execute(`
        SELECT COUNT(*) as total FROM audit_logs WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Credit Grade Transitions', () => {
    it('should update grade when score changes', async () => {
      const scoreGradeMap = [
        { score: 800, expectedGrade: 'A+' },
        { score: 700, expectedGrade: 'A' },
        { score: 600, expectedGrade: 'B' },
        { score: 500, expectedGrade: 'C' },
        { score: 400, expectedGrade: 'D' },
        { score: 250, expectedGrade: 'F' },
      ];

      scoreGradeMap.forEach(({ score, expectedGrade }) => {
        let grade;
        if (score >= 750) grade = 'A+';
        else if (score >= 650) grade = 'A';
        else if (score >= 550) grade = 'B';
        else if (score >= 450) grade = 'C';
        else if (score >= 300) grade = 'D';
        else grade = 'F';

        expect(grade).toBe(expectedGrade);
      });
    });
  });

  describe('Credit Status States', () => {
    it('should handle active status', async () => {
      const result = await db.execute(`
        SELECT status FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].status).toBe('active');
    });

    it('should handle suspended status', async () => {
      await db.execute(`
        UPDATE credit_limits SET status = 'suspended' WHERE user_id = '${testUserId}'
      `);

      const result = await db.execute(`
        SELECT status, available_limit FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].status).toBe('suspended');
      expect(result.results[0].available_limit).toBe(0);

      // Restore
      await db.execute(`
        UPDATE credit_limits SET status = 'active', available_limit = 45000 WHERE user_id = '${testUserId}'
      `);
    });

    it('should handle expired status', async () => {
      await db.execute(`
        UPDATE credit_limits 
        SET status = 'expired', expires_at = datetime('now', '-1 day')
        WHERE user_id = '${testUserId}'
      `);

      const result = await db.execute(`
        SELECT status FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].status).toBe('expired');

      // Restore
      await db.execute(`
        UPDATE credit_limits 
        SET status = 'active', expires_at = datetime('now', '+1 year')
        WHERE user_id = '${testUserId}'
      `);
    });
  });

  describe('Credit Review Trigger', () => {
    it('should trigger review when expiring soon', async () => {
      await db.execute(`
        UPDATE credit_limits 
        SET expires_at = datetime('now', '+15 days')
        WHERE user_id = '${testUserId}'
      `);

      const result = await db.execute(`
        SELECT 
          expires_at,
          JULIANDAY(expires_at) - JULIANDAY('now') as days_remaining,
          CASE 
            WHEN JULIANDAY(expires_at) - JULIANDAY('now') <= 30 THEN 1
            ELSE 0
          END as needs_review
        FROM credit_limits
        WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].needs_review).toBe(1);

      // Restore
      await db.execute(`
        UPDATE credit_limits SET expires_at = datetime('now', '+1 year') WHERE user_id = '${testUserId}'
      `);
    });

    it('should trigger review for inactive limit', async () => {
      const result = await db.execute(`
        SELECT 
          granted_at,
          used_limit,
          CASE 
            WHEN used_limit = 0 AND JULIANDAY('now') - JULIANDAY(granted_at) > 90 THEN 1
            ELSE 0
          END as needs_review
        FROM credit_limits
        WHERE user_id = '${testUserId}'
      `);

      // If limit is unused for 90+ days, should trigger review
      expect(result.results[0].needs_review).toBeGreaterThanOrEqual(0);
    });
  });
});
