/**
 * 外键约束验证测试
 * 
 * 验证数据库外键约束的正确性和级联行为
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../../../backend/db';

describe('Database Constraints - Foreign Keys', () => {
  describe('credit_limits -> users', () => {
    it('should enforce foreign key constraint on insert', async () => {
      // Enable foreign keys
      await db.execute('PRAGMA foreign_keys = ON');

      // Try to insert credit_limit with non-existent user_id
      const result = await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, status, granted_at, expires_at)
        VALUES ('non_existent_user', 10000, 10000, 'active', datetime('now'), datetime('now', '+1 year'))
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });

    it('should allow insert with valid user_id', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      // First create a test user
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_fk_1', '0812345678', 'TH', datetime('now'))
      `);

      // Then insert credit limit
      const result = await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, status, granted_at, expires_at)
        VALUES ('test_user_fk_1', 10000, 10000, 'active', datetime('now'), datetime('now', '+1 year'))
      `);

      expect(result.success).toBe(true);

      // Cleanup
      await db.execute(`DELETE FROM credit_limits WHERE user_id = 'test_user_fk_1'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_fk_1'`);
    });
  });

  describe('loans -> users', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      const result = await db.execute(`
        INSERT INTO loans (user_id, product_id, principal, interest_rate, term_days, total_repayment, status, disbursed_at, due_date)
        VALUES ('non_existent_user', 'payday', 10000, 0.01, 30, 13000, 'active', datetime('now'), datetime('now', '+30 days'))
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('loans -> loan_products', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      const result = await db.execute(`
        INSERT INTO loans (user_id, product_id, principal, interest_rate, term_days, total_repayment, status, disbursed_at, due_date)
        VALUES ('test_user', 'non_existent_product', 10000, 0.01, 30, 13000, 'active', datetime('now'), datetime('now', '+30 days'))
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('repayment_schedules -> loans', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      const result = await db.execute(`
        INSERT INTO repayment_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount, status)
        VALUES ('non_existent_loan', 1, datetime('now'), 10000, 1000, 11000, 'pending')
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('repayments -> loans', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      const result = await db.execute(`
        INSERT INTO repayments (loan_id, amount, method, status, paid_at)
        VALUES ('non_existent_loan', 5000, 'promptpay', 'completed', datetime('now'))
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('penalties -> loans', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      const result = await db.execute(`
        INSERT INTO penalties (loan_id, overdue_days, penalty_amount, daily_rate, status)
        VALUES ('non_existent_loan', 5, 250, 0.005, 'active')
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('credit_applications -> users', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      const result = await db.execute(`
        INSERT INTO credit_applications (user_id, status, submitted_at)
        VALUES ('non_existent_user', 'pending', datetime('now'))
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('loan_applications -> users', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      const result = await db.execute(`
        INSERT INTO loan_applications (user_id, product_id, amount, term_days, status, submitted_at)
        VALUES ('non_existent_user', 'payday', 10000, 30, 'pending', datetime('now'))
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('loan_applications -> loan_products', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      // First create a test user
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_fk_2', '0812345678', 'TH', datetime('now'))
      `);

      const result = await db.execute(`
        INSERT INTO loan_applications (user_id, product_id, amount, term_days, status, submitted_at)
        VALUES ('test_user_fk_2', 'non_existent_product', 10000, 30, 'pending', datetime('now'))
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);

      // Cleanup
      await db.execute(`DELETE FROM users WHERE id = 'test_user_fk_2'`);
    });
  });

  describe('audit_logs -> users', () => {
    it('should enforce foreign key constraint on insert', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      const result = await db.execute(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
        VALUES ('non_existent_user', 'CREATE', 'loan', 'loan_123', datetime('now'))
      `).catch(e => e);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('Cascade Behavior', () => {
    it('should handle cascade delete for credit_limits', async () => {
      await db.execute('PRAGMA foreign_keys = ON');

      // Create test user and credit limit
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_cascade', '0812345678', 'TH', datetime('now'))
      `);

      await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, status, granted_at, expires_at)
        VALUES ('test_user_cascade', 10000, 10000, 'active', datetime('now'), datetime('now', '+1 year'))
      `);

      // Delete user
      await db.execute(`DELETE FROM users WHERE id = 'test_user_cascade'`);

      // Verify credit limit is also deleted (if CASCADE is set)
      const result = await db.execute(`
        SELECT COUNT(*) as count FROM credit_limits WHERE user_id = 'test_user_cascade'
      `);

      expect(result.results[0].count).toBe(0);
    });
  });
});
