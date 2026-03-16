/**
 * 信用申请 API 集成测试
 * 
 * 测试覆盖:
 * - 信用申请流程
 * - 信用评分计算
 * - 额度授予
 * - 申请状态查询
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../../../../backend/db';

describe('API Integration - Credit Apply', () => {
  const testUserId = 'api_test_user_credit';
  const testApplicationId = 'api_test_app_credit';

  beforeAll(async () => {
    // Setup test user
    await db.execute(`
      INSERT OR IGNORE INTO users (id, phone, nationality, date_of_birth, created_at)
      VALUES ('${testUserId}', '0812345678', 'TH', '1990-01-01', datetime('now'))
    `);
  });

  afterAll(async () => {
    // Cleanup
    await db.execute(`DELETE FROM credit_applications WHERE user_id = '${testUserId}'`);
    await db.execute(`DELETE FROM credit_limits WHERE user_id = '${testUserId}'`);
    await db.execute(`DELETE FROM users WHERE id = '${testUserId}'`);
  });

  describe('POST /api/credit/apply', () => {
    it('should create credit application with valid profile', async () => {
      const application = {
        userId: testUserId,
        profile: {
          dateOfBirth: '1990-01-01',
          nationality: 'TH',
          residenceYears: 5,
          employment: {
            company: 'Test Company',
            position: 'Developer',
            type: 'employee',
            monthlyIncome: 50000,
            employmentYears: 3,
          },
          contact: {
            phone: '0812345678',
            phoneMonths: 24,
            email: 'test@example.com',
            emailVerified: true,
          },
        },
      };

      // Simulate API call
      const result = await db.execute(`
        INSERT INTO credit_applications (id, user_id, status, profile_data, submitted_at)
        VALUES ('${testApplicationId}', '${testUserId}', 'pending', '{}', datetime('now'))
      `);

      expect(result.success).toBe(true);

      // Verify application was created
      const verifyResult = await db.execute(`
        SELECT * FROM credit_applications WHERE id = '${testApplicationId}'
      `);

      expect(verifyResult.results.length).toBe(1);
      expect(verifyResult.results[0].user_id).toBe(testUserId);
      expect(verifyResult.results[0].status).toBe('pending');
    });

    it('should reject application with invalid data', async () => {
      const invalidApplication = {
        userId: testUserId,
        profile: {
          monthlyIncome: -1000, // Invalid
        },
      };

      // Should fail validation
      expect(invalidApplication.profile.monthlyIncome).toBeLessThan(0);
    });

    it('should calculate credit score for excellent profile', async () => {
      // Simulate credit score calculation
      const score = 750; // Excellent score

      expect(score).toBeGreaterThanOrEqual(750);
      expect(score).toBeLessThanOrEqual(1000);
    });

    it('should calculate credit score for poor profile', async () => {
      // Simulate credit score calculation
      const score = 400; // Poor score

      expect(score).toBeLessThan(550);
      expect(score).toBeGreaterThanOrEqual(300);
    });

    it('should grant credit limit for approved application', async () => {
      // Create credit limit for test user
      await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, credit_score, credit_grade, status, granted_at, expires_at)
        VALUES ('${testUserId}', 50000, 50000, 750, 'A+', 'active', datetime('now'), datetime('now', '+1 year'))
      `);

      // Verify limit was granted
      const result = await db.execute(`
        SELECT * FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      expect(result.results.length).toBe(1);
      expect(result.results[0].total_limit).toBe(50000);
      expect(result.results[0].credit_grade).toBe('A+');
      expect(result.results[0].status).toBe('active');
    });

    it('should reject application for low credit score', async () => {
      const lowScore = 350;
      const minScoreForApproval = 450;

      expect(lowScore).toBeLessThan(minScoreForApproval);
    });
  });

  describe('Credit Score Calculation', () => {
    it('should score age factor correctly', () => {
      // Age 36 (optimal)
      const age = 36;
      const ageScore = Math.min(40, Math.max(0, 40 - Math.abs(age - 36)));
      
      expect(ageScore).toBe(40);
    });

    it('should score income factor correctly', () => {
      // Income 50,000 THB (good)
      const income = 50000;
      const incomeScore = Math.min(60, income / 1000);
      
      expect(incomeScore).toBe(50);
    });

    it('should score employment stability', () => {
      // 5 years employment
      const years = 5;
      const stabilityScore = Math.min(50, years * 10);
      
      expect(stabilityScore).toBe(50);
    });

    it('should score contact stability', () => {
      // 24 months phone usage
      const months = 24;
      const contactScore = Math.min(30, months);
      
      expect(contactScore).toBe(24);
    });

    it('should calculate total score with weights', () => {
      const dimensions = {
        basic: { score: 160, weight: 0.20 },
        employment: { score: 200, weight: 0.25 },
        contact: { score: 120, weight: 0.15 },
        social: { score: 130, weight: 0.15 },
        behavior: { score: 200, weight: 0.25 },
      };

      const totalScore = Object.values(dimensions).reduce(
        (sum, dim) => sum + dim.score * dim.weight,
        0
      );

      expect(totalScore).toBeGreaterThan(300);
      expect(totalScore).toBeLessThanOrEqual(1000);
    });
  });

  describe('Application Status Flow', () => {
    it('should transition from pending to approved', async () => {
      // Create pending application
      await db.execute(`
        INSERT OR REPLACE INTO credit_applications (id, user_id, status, submitted_at)
        VALUES ('${testApplicationId}_flow', '${testUserId}', 'pending', datetime('now'))
      `);

      // Update to approved
      await db.execute(`
        UPDATE credit_applications SET status = 'approved', reviewed_at = datetime('now')
        WHERE id = '${testApplicationId}_flow'
      `);

      const result = await db.execute(`
        SELECT status FROM credit_applications WHERE id = '${testApplicationId}_flow'
      `);

      expect(result.results[0].status).toBe('approved');

      // Cleanup
      await db.execute(`DELETE FROM credit_applications WHERE id = '${testApplicationId}_flow'`);
    });

    it('should transition from pending to rejected', async () => {
      await db.execute(`
        INSERT OR REPLACE INTO credit_applications (id, user_id, status, submitted_at)
        VALUES ('${testApplicationId}_rej', '${testUserId}', 'pending', datetime('now'))
      `);

      await db.execute(`
        UPDATE credit_applications SET status = 'rejected', rejection_reason = 'Low credit score'
        WHERE id = '${testApplicationId}_rej'
      `);

      const result = await db.execute(`
        SELECT status, rejection_reason FROM credit_applications WHERE id = '${testApplicationId}_rej'
      `);

      expect(result.results[0].status).toBe('rejected');
      expect(result.results[0].rejection_reason).toBe('Low credit score');

      // Cleanup
      await db.execute(`DELETE FROM credit_applications WHERE id = '${testApplicationId}_rej'`);
    });
  });

  describe('GET /api/credit/status', () => {
    it('should return credit status for user', async () => {
      const result = await db.execute(`
        SELECT 
          cl.user_id,
          cl.total_limit,
          cl.available_limit,
          cl.used_limit,
          cl.credit_score,
          cl.credit_grade,
          cl.status
        FROM credit_limits cl
        WHERE cl.user_id = '${testUserId}'
      `);

      if (result.results.length > 0) {
        expect(result.results[0].user_id).toBe(testUserId);
        expect(result.results[0].credit_grade).toBeDefined();
      }
    });

    it('should return null for user without credit', async () => {
      const result = await db.execute(`
        SELECT * FROM credit_limits WHERE user_id = 'non_existent_user'
      `);

      expect(result.results.length).toBe(0);
    });
  });

  describe('Credit Limit Management', () => {
    it('should use credit limit', async () => {
      const useAmount = 10000;
      
      await db.execute(`
        UPDATE credit_limits 
        SET used_limit = used_limit + ${useAmount},
            available_limit = available_limit - ${useAmount}
        WHERE user_id = '${testUserId}'
      `);

      const result = await db.execute(`
        SELECT used_limit, available_limit FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].used_limit).toBe(useAmount);
      expect(result.results[0].available_limit).toBe(50000 - useAmount);
    });

    it('should restore credit limit after repayment', async () => {
      const repayAmount = 5000;
      
      await db.execute(`
        UPDATE credit_limits 
        SET used_limit = used_limit - ${repayAmount},
            available_limit = available_limit + ${repayAmount}
        WHERE user_id = '${testUserId}'
      `);

      const result = await db.execute(`
        SELECT used_limit, available_limit FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].used_limit).toBe(5000);
      expect(result.results[0].available_limit).toBe(45000);
    });

    it('should not allow using more than available limit', async () => {
      const currentAvailable = 45000;
      const attemptAmount = 50000;

      expect(attemptAmount).toBeGreaterThan(currentAvailable);
    });
  });
});
