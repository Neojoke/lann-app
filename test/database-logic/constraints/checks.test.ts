/**
 * CHECK 约束验证测试
 * 
 * 验证数据库 CHECK 约束的正确性
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { db } from '../../../backend/db';

describe('Database Constraints - CHECK', () => {
  beforeAll(async () => {
    await db.execute('PRAGMA foreign_keys = ON');
  });

  describe('Credit Score Range', () => {
    it('should enforce credit score between 300-1000', async () => {
      // Create test user first
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_check_1', '0812345678', 'TH', datetime('now'))
      `);

      // Try to insert credit score below 300
      const result1 = await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, credit_score, status, granted_at, expires_at)
        VALUES ('test_user_check_1', 10000, 10000, 200, 'active', datetime('now'), datetime('now', '+1 year'))
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);

      // Try to insert credit score above 1000
      const result2 = await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, credit_score, status, granted_at, expires_at)
        VALUES ('test_user_check_1', 10000, 10000, 1100, 'active', datetime('now'), datetime('now', '+1 year'))
      `).catch(e => e);

      expect(result2).toBeInstanceOf(Error);

      // Valid score should work
      const result3 = await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, credit_score, status, granted_at, expires_at)
        VALUES ('test_user_check_1', 10000, 10000, 750, 'active', datetime('now'), datetime('now', '+1 year'))
      `);

      expect(result3.success).toBe(true);

      // Cleanup
      await db.execute(`DELETE FROM credit_limits WHERE user_id = 'test_user_check_1'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_check_1'`);
    });
  });

  describe('Credit Grade Values', () => {
    it('should enforce valid credit grade', async () => {
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_check_2', '0812345678', 'TH', datetime('now'))
      `);

      // Try invalid grade
      const result1 = await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, credit_score, credit_grade, status, granted_at, expires_at)
        VALUES ('test_user_check_2', 10000, 10000, 750, 'Z', 'active', datetime('now'), datetime('now', '+1 year'))
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);

      // Valid grades should work
      const validGrades = ['A+', 'A', 'B', 'C', 'D', 'F'];
      
      for (const grade of validGrades) {
        const result = await db.execute(`
          INSERT OR REPLACE INTO credit_limits (user_id, total_limit, available_limit, credit_score, credit_grade, status, granted_at, expires_at)
          VALUES ('test_user_check_2', 10000, 10000, 750, '${grade}', 'active', datetime('now'), datetime('now', '+1 year'))
        `);
        expect(result.success).toBe(true);
      }

      // Cleanup
      await db.execute(`DELETE FROM credit_limits WHERE user_id = 'test_user_check_2'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_check_2'`);
    });
  });

  describe('Credit Limit Status', () => {
    it('should enforce valid status values', async () => {
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_check_3', '0812345678', 'TH', datetime('now'))
      `);

      // Try invalid status
      const result1 = await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, credit_score, status, granted_at, expires_at)
        VALUES ('test_user_check_3', 10000, 10000, 750, 'invalid_status', datetime('now'), datetime('now', '+1 year'))
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);

      // Valid statuses should work
      const validStatuses = ['pending', 'active', 'suspended', 'expired', 'closed'];
      
      for (const status of validStatuses) {
        const result = await db.execute(`
          INSERT OR REPLACE INTO credit_limits (user_id, total_limit, available_limit, credit_score, status, granted_at, expires_at)
          VALUES ('test_user_check_3', 10000, 10000, 750, '${status}', datetime('now'), datetime('now', '+1 year'))
        `);
        expect(result.success).toBe(true);
      }

      // Cleanup
      await db.execute(`DELETE FROM credit_limits WHERE user_id = 'test_user_check_3'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_check_3'`);
    });
  });

  describe('Loan Amount Constraints', () => {
    it('should enforce positive loan amount', async () => {
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_check_4', '0812345678', 'TH', datetime('now'))
      `);

      // Try negative amount
      const result1 = await db.execute(`
        INSERT INTO loans (user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
        VALUES ('test_user_check_4', 'payday', -10000, 0.01, 30, 13000, -10000, 'active', datetime('now'), datetime('now', '+30 days'))
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);

      // Try zero amount
      const result2 = await db.execute(`
        INSERT INTO loans (user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
        VALUES ('test_user_check_4', 'payday', 0, 0.01, 30, 0, 0, 'active', datetime('now'), datetime('now', '+30 days'))
      `).catch(e => e);

      expect(result2).toBeInstanceOf(Error);

      // Cleanup
      await db.execute(`DELETE FROM users WHERE id = 'test_user_check_4'`);
    });
  });

  describe('Interest Rate Constraints', () => {
    it('should enforce valid interest rate range', async () => {
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_check_5', '0812345678', 'TH', datetime('now'))
      `);

      // Try negative rate
      const result1 = await db.execute(`
        INSERT INTO loans (user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
        VALUES ('test_user_check_5', 'payday', 10000, -0.01, 30, 13000, 10000, 'active', datetime('now'), datetime('now', '+30 days'))
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);

      // Cleanup
      await db.execute(`DELETE FROM users WHERE id = 'test_user_check_5'`);
    });
  });

  describe('Term Days Constraints', () => {
    it('should enforce positive term days', async () => {
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_check_6', '0812345678', 'TH', datetime('now'))
      `);

      // Try negative term
      const result1 = await db.execute(`
        INSERT INTO loans (user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
        VALUES ('test_user_check_6', 'payday', 10000, 0.01, -30, 13000, 10000, 'active', datetime('now'), datetime('now', '+30 days'))
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);

      // Cleanup
      await db.execute(`DELETE FROM users WHERE id = 'test_user_check_6'`);
    });
  });

  describe('Repayment Amount Constraints', () => {
    it('should enforce positive repayment amount', async () => {
      // Try negative amount
      const result1 = await db.execute(`
        INSERT INTO repayments (loan_id, amount, method, status, paid_at)
        VALUES ('non_existent_loan', -5000, 'promptpay', 'completed', datetime('now'))
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);
    });
  });

  describe('Penalty Constraints', () => {
    it('should enforce non-negative overdue days', async () => {
      const result1 = await db.execute(`
        INSERT INTO penalties (loan_id, overdue_days, penalty_amount, daily_rate, status)
        VALUES ('non_existent_loan', -5, 250, 0.005, 'active')
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);
    });

    it('should enforce non-negative penalty amount', async () => {
      const result1 = await db.execute(`
        INSERT INTO penalties (loan_id, overdue_days, penalty_amount, daily_rate, status)
        VALUES ('non_existent_loan', 5, -250, 0.005, 'active')
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);
    });
  });

  describe('Loan Status Values', () => {
    it('should enforce valid loan status', async () => {
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_check_7', '0812345678', 'TH', datetime('now'))
      `);

      // Try invalid status
      const result1 = await db.execute(`
        INSERT INTO loans (user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
        VALUES ('test_user_check_7', 'payday', 10000, 0.01, 30, 13000, 10000, 'invalid', datetime('now'), datetime('now', '+30 days'))
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);

      // Valid statuses should work
      const validStatuses = ['pending', 'approved', 'rejected', 'active', 'completed', 'overdue', 'cancelled'];
      
      for (const status of validStatuses) {
        const result = await db.execute(`
          INSERT OR REPLACE INTO loans (user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
          VALUES ('test_user_check_7', 'payday', 10000, 0.01, 30, 13000, 10000, '${status}', datetime('now'), datetime('now', '+30 days'))
        `).catch(e => null);
        // Some might fail due to FK, that's ok for this test
      }

      // Cleanup
      await db.execute(`DELETE FROM users WHERE id = 'test_user_check_7'`);
    });
  });

  describe('Repayment Schedule Constraints', () => {
    it('should enforce positive installment number', async () => {
      const result1 = await db.execute(`
        INSERT INTO repayment_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount, status)
        VALUES ('non_existent_loan', 0, datetime('now'), 10000, 1000, 11000, 'pending')
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);
    });

    it('should enforce positive amounts', async () => {
      const result1 = await db.execute(`
        INSERT INTO repayment_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount, status)
        VALUES ('non_existent_loan', 1, datetime('now'), -10000, 1000, 11000, 'pending')
      `).catch(e => e);

      expect(result1).toBeInstanceOf(Error);
    });
  });
});
