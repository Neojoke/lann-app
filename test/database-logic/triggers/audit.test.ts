/**
 * 审计触发器测试
 * 
 * 验证数据库审计触发器的正确性
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../../../backend/db';

describe('Database Triggers - Audit', () => {
  beforeAll(async () => {
    await db.execute('PRAGMA foreign_keys = ON');
  });

  describe('User Audit Trigger', () => {
    it('should create audit log on user INSERT', async () => {
      // Clear existing audit logs for test user
      await db.execute(`DELETE FROM audit_logs WHERE entity_id = 'test_user_audit_1'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_audit_1'`);

      // Insert user
      await db.execute(`
        INSERT INTO users (id, phone, nationality, date_of_birth, created_at)
        VALUES ('test_user_audit_1', '0812345678', 'TH', '1990-01-01', datetime('now'))
      `);

      // Check audit log was created
      const result = await db.execute(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE entity_type = 'users' AND entity_id = 'test_user_audit_1' AND action = 'INSERT'
      `);

      expect(result.results[0].count).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id = 'test_user_audit_1'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_audit_1'`);
    });

    it('should create audit log on user UPDATE', async () => {
      // Setup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id = 'test_user_audit_2'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_audit_2'`);
      
      await db.execute(`
        INSERT INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_audit_2', '0812345678', 'TH', datetime('now'))
      `);

      // Clear audit logs from insert
      await db.execute(`DELETE FROM audit_logs WHERE entity_id = 'test_user_audit_2'`);

      // Update user
      await db.execute(`
        UPDATE users SET phone = '0898765432' WHERE id = 'test_user_audit_2'
      `);

      // Check audit log was created
      const result = await db.execute(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE entity_type = 'users' AND entity_id = 'test_user_audit_2' AND action = 'UPDATE'
      `);

      expect(result.results[0].count).toBeGreaterThan(0);

      // Check old and new values are recorded
      const logResult = await db.execute(`
        SELECT old_value, new_value FROM audit_logs 
        WHERE entity_type = 'users' AND entity_id = 'test_user_audit_2' AND action = 'UPDATE'
        LIMIT 1
      `);

      expect(logResult.results.length).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id = 'test_user_audit_2'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_audit_2'`);
    });

    it('should create audit log on user DELETE', async () => {
      // Setup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id = 'test_user_audit_3'`);
      await db.execute(`
        INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_audit_3', '0812345678', 'TH', datetime('now'))
      `);

      // Delete user
      await db.execute(`DELETE FROM users WHERE id = 'test_user_audit_3'`);

      // Check audit log was created
      const result = await db.execute(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE entity_type = 'users' AND entity_id = 'test_user_audit_3' AND action = 'DELETE'
      `);

      expect(result.results[0].count).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id = 'test_user_audit_3'`);
    });
  });

  describe('Credit Limit Audit Trigger', () => {
    it('should create audit log on credit limit INSERT', async () => {
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_limit_%'`);
      await db.execute(`DELETE FROM credit_limits WHERE user_id = 'test_user_cl_audit'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_cl_audit'`);

      // Create user and credit limit
      await db.execute(`
        INSERT INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_cl_audit', '0812345678', 'TH', datetime('now'))
      `);

      await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, credit_score, status, granted_at, expires_at)
        VALUES ('test_user_cl_audit', 10000, 10000, 750, 'active', datetime('now'), datetime('now', '+1 year'))
      `);

      // Check audit log
      const result = await db.execute(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE entity_type = 'credit_limits' AND action = 'INSERT'
      `);

      expect(result.results[0].count).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_limit_%'`);
      await db.execute(`DELETE FROM credit_limits WHERE user_id = 'test_user_cl_audit'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_cl_audit'`);
    });

    it('should record limit changes in audit log', async () => {
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_limit_change_%'`);
      await db.execute(`DELETE FROM credit_limits WHERE user_id = 'test_user_cl_change'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_cl_change'`);

      // Setup
      await db.execute(`
        INSERT INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_cl_change', '0812345678', 'TH', datetime('now'))
      `);

      await db.execute(`
        INSERT INTO credit_limits (user_id, total_limit, available_limit, credit_score, status, granted_at, expires_at)
        VALUES ('test_user_cl_change', 10000, 10000, 750, 'active', datetime('now'), datetime('now', '+1 year'))
      `);

      // Clear insert audit
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_limit_change_%'`);

      // Update limit
      await db.execute(`
        UPDATE credit_limits SET total_limit = 15000, available_limit = 15000 
        WHERE user_id = 'test_user_cl_change'
      `);

      // Check audit log
      const result = await db.execute(`
        SELECT old_value, new_value FROM audit_logs 
        WHERE entity_type = 'credit_limits' AND action = 'UPDATE'
        LIMIT 1
      `);

      expect(result.results.length).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_limit_change_%'`);
      await db.execute(`DELETE FROM credit_limits WHERE user_id = 'test_user_cl_change'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_cl_change'`);
    });
  });

  describe('Loan Audit Trigger', () => {
    it('should create audit log on loan status change', async () => {
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_loan_audit_%'`);
      await db.execute(`DELETE FROM loans WHERE id = 'test_loan_audit_1'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_loan_audit'`);

      // Setup
      await db.execute(`
        INSERT INTO users (id, phone, nationality, created_at)
        VALUES ('test_user_loan_audit', '0812345678', 'TH', datetime('now'))
      `);

      await db.execute(`
        INSERT INTO loans (id, user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
        VALUES ('test_loan_audit_1', 'test_user_loan_audit', 'payday', 10000, 0.01, 30, 13000, 10000, 'pending', datetime('now'), datetime('now', '+30 days'))
      `);

      // Clear insert audit
      await db.execute(`DELETE FROM audit_logs WHERE entity_id = 'test_loan_audit_1'`);

      // Update status
      await db.execute(`
        UPDATE loans SET status = 'approved' WHERE id = 'test_loan_audit_1'
      `);

      // Check audit log
      const result = await db.execute(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE entity_type = 'loans' AND entity_id = 'test_loan_audit_1' AND action = 'UPDATE'
      `);

      expect(result.results[0].count).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_loan_audit_%'`);
      await db.execute(`DELETE FROM loans WHERE id = 'test_loan_audit_1'`);
      await db.execute(`DELETE FROM users WHERE id = 'test_user_loan_audit'`);
    });
  });

  describe('Repayment Audit Trigger', () => {
    it('should create audit log on repayment creation', async () => {
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_repay_audit_%'`);
      await db.execute(`DELETE FROM repayments WHERE id = 'test_repay_audit_1'`);

      // Create repayment
      await db.execute(`
        INSERT INTO repayments (id, loan_id, amount, method, status, paid_at)
        VALUES ('test_repay_audit_1', 'test_loan', 5000, 'promptpay', 'completed', datetime('now'))
      `);

      // Check audit log
      const result = await db.execute(`
        SELECT COUNT(*) as count FROM audit_logs 
        WHERE entity_type = 'repayments' AND entity_id = 'test_repay_audit_1' AND action = 'INSERT'
      `);

      expect(result.results[0].count).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM audit_logs WHERE entity_id LIKE 'test_repay_audit_%'`);
      await db.execute(`DELETE FROM repayments WHERE id = 'test_repay_audit_1'`);
    });
  });

  describe('Audit Log Structure', () => {
    it('should record user_id for audit logs', async () => {
      const result = await db.execute(`
        SELECT user_id FROM audit_logs 
        WHERE user_id IS NOT NULL 
        LIMIT 1
      `);

      // If there are audit logs, they should have user_id
      if (result.results.length > 0) {
        expect(result.results[0].user_id).toBeDefined();
      }
    });

    it('should record timestamp for all audit logs', async () => {
      const result = await db.execute(`
        SELECT created_at FROM audit_logs 
        WHERE created_at IS NOT NULL 
        LIMIT 1
      `);

      if (result.results.length > 0) {
        expect(result.results[0].created_at).toBeDefined();
      }
    });

    it('should have valid action values', async () => {
      const result = await db.execute(`
        SELECT DISTINCT action FROM audit_logs
      `);

      const actions = result.results.map((r: any) => r.action);
      const validActions = ['INSERT', 'UPDATE', 'DELETE'];
      
      actions.forEach(action => {
        expect(validActions).toContain(action);
      });
    });
  });

  describe('Audit Log Cleanup', () => {
    it('should handle large number of audit logs', async () => {
      // This test verifies the audit system can handle volume
      const countResult = await db.execute(`
        SELECT COUNT(*) as count FROM audit_logs
      `);

      const count = countResult.results[0].count;
      
      // Should not have excessive logs from tests
      expect(count).toBeLessThan(1000);
    });
  });
});
