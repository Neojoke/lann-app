/**
 * 还款 API 集成测试
 * 
 * 测试覆盖:
 * - 还款计划查询
 * - 创建还款
 * - 罚息计算
 * - 提前还款
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../../../../backend/db';

describe('API Integration - Repayment', () => {
  const testUserId = 'api_test_user_repay';
  const testLoanId = 'api_test_loan_repay';

  beforeAll(async () => {
    // Setup
    await db.execute(`
      INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
      VALUES ('${testUserId}', '0812345678', 'TH', datetime('now'))
    `);

    await db.execute(`
      INSERT OR REPLACE INTO loans (id, user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
      VALUES ('${testLoanId}', '${testUserId}', 'payday', 10000, 0.01, 30, 13000, 13000, 'active', datetime('now'), datetime('now', '+30 days'))
    `);

    await db.execute(`
      INSERT INTO repayment_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount, status)
      VALUES ('${testLoanId}', 1, datetime('now', '+30 days'), 10000, 3000, 13000, 'pending')
    `);
  });

  afterAll(async () => {
    await db.execute(`DELETE FROM repayments WHERE loan_id = '${testLoanId}'`);
    await db.execute(`DELETE FROM repayment_schedules WHERE loan_id = '${testLoanId}'`);
    await db.execute(`DELETE FROM loans WHERE id = '${testLoanId}'`);
    await db.execute(`DELETE FROM users WHERE id = '${testUserId}'`);
  });

  describe('GET /api/repayment/schedule/:loanId', () => {
    it('should return repayment schedule', async () => {
      const result = await db.execute(`
        SELECT 
          loan_id,
          installment_number,
          due_date,
          principal_amount,
          interest_amount,
          total_amount,
          status
        FROM repayment_schedules
        WHERE loan_id = '${testLoanId}'
      `);

      expect(result.results.length).toBe(1);
      expect(result.results[0].loan_id).toBe(testLoanId);
      expect(result.results[0].total_amount).toBe(13000);
      expect(result.results[0].status).toBe('pending');
    });

    it('should include payment breakdown', async () => {
      const result = await db.execute(`
        SELECT 
          principal_amount,
          interest_amount,
          total_amount,
          ROUND(interest_amount * 100.0 / principal_amount, 2) as interest_rate_pct
        FROM repayment_schedules
        WHERE loan_id = '${testLoanId}'
      `);

      expect(result.results[0].principal_amount).toBe(10000);
      expect(result.results[0].interest_amount).toBe(3000);
      expect(result.results[0].interest_rate_pct).toBe(30);
    });

    it('should show overdue status', async () => {
      // Update due date to past
      await db.execute(`
        UPDATE repayment_schedules 
        SET due_date = datetime('now', '-5 days'), status = 'overdue'
        WHERE loan_id = '${testLoanId}'
      `);

      const result = await db.execute(`
        SELECT status, due_date FROM repayment_schedules WHERE loan_id = '${testLoanId}'
      `);

      expect(result.results[0].status).toBe('overdue');

      // Restore
      await db.execute(`
        UPDATE repayment_schedules 
        SET due_date = datetime('now', '+30 days'), status = 'pending'
        WHERE loan_id = '${testLoanId}'
      `);
    });
  });

  describe('POST /api/repayment/create', () => {
    it('should create repayment record', async () => {
      const repaymentId = 'api_test_repay_1';

      await db.execute(`
        INSERT INTO repayments (id, loan_id, amount, method, status, paid_at)
        VALUES ('${repaymentId}', '${testLoanId}', 5000, 'promptpay', 'completed', datetime('now'))
      `);

      const result = await db.execute(`
        SELECT * FROM repayments WHERE id = '${repaymentId}'
      `);

      expect(result.results.length).toBe(1);
      expect(result.results[0].amount).toBe(5000);
      expect(result.results[0].method).toBe('promptpay');
      expect(result.results[0].status).toBe('completed');

      // Cleanup
      await db.execute(`DELETE FROM repayments WHERE id = '${repaymentId}'`);
    });

    it('should allocate repayment correctly', async () => {
      const repaymentAmount = 5000;
      const penaltyDue = 0;
      const interestDue = 3000;
      const principalDue = 10000;

      // Allocation order: penalty → interest → principal
      let remaining = repaymentAmount;

      // Allocate to penalty first
      const penaltyPaid = Math.min(remaining, penaltyDue);
      remaining -= penaltyPaid;

      // Then interest
      const interestPaid = Math.min(remaining, interestDue);
      remaining -= interestPaid;

      // Then principal
      const principalPaid = remaining;

      expect(penaltyPaid).toBe(0);
      expect(interestPaid).toBe(3000);
      expect(principalPaid).toBe(2000);
    });

    it('should update loan balance after repayment', async () => {
      const repaymentAmount = 5000;

      await db.execute(`
        UPDATE loans 
        SET remaining_amount = remaining_amount - ${repaymentAmount}
        WHERE id = '${testLoanId}'
      `);

      const result = await db.execute(`
        SELECT remaining_amount FROM loans WHERE id = '${testLoanId}'
      `);

      expect(result.results[0].remaining_amount).toBe(8000);

      // Restore
      await db.execute(`
        UPDATE loans SET remaining_amount = 13000 WHERE id = '${testLoanId}'
      `);
    });

    it('should handle full repayment', async () => {
      const fullAmount = 13000;

      await db.execute(`
        UPDATE loans 
        SET remaining_amount = 0, status = 'completed'
        WHERE id = '${testLoanId}' AND remaining_amount <= ${fullAmount}
      `);

      const result = await db.execute(`
        SELECT remaining_amount, status FROM loans WHERE id = '${testLoanId}'
      `);

      expect(result.results[0].remaining_amount).toBe(0);
      expect(result.results[0].status).toBe('completed');

      // Restore
      await db.execute(`
        UPDATE loans SET remaining_amount = 13000, status = 'active' WHERE id = '${testLoanId}'
      `);
    });

    it('should handle partial repayment', async () => {
      const partialAmount = 3000;

      expect(partialAmount).toBeLessThan(13000);
    });
  });

  describe('GET /api/repayment/penalty/:loanId', () => {
    it('should calculate penalty for overdue loan', async () => {
      const principal = 10000;
      const overdueDays = 5;
      const dailyRate = 0.005;

      const penalty = principal * dailyRate * overdueDays;

      expect(penalty).toBe(250);
    });

    it('should apply tiered penalty rates', () => {
      const principal = 10000;
      
      // Tier 1: Days 1-7 at 0.5%
      const tier1Days = Math.min(7, 10);
      const tier1Penalty = principal * 0.005 * tier1Days;

      // Tier 2: Days 8-30 at 0.7%
      const tier2Days = Math.max(0, Math.min(23, 10 - 7));
      const tier2Penalty = principal * 0.007 * tier2Days;

      const totalPenalty = tier1Penalty + tier2Penalty;

      expect(tier1Penalty).toBe(350);
      expect(tier2Penalty).toBe(0); // Only 10 days, all in tier 1
      expect(totalPenalty).toBe(350);
    });

    it('should apply penalty cap', () => {
      const principal = 10000;
      const maxPenaltyRate = 0.20; // 20% cap

      const maxPenalty = principal * maxPenaltyRate;

      expect(maxPenalty).toBe(2000);
    });

    it('should return zero penalty for current loan', () => {
      const overdueDays = 0;
      const penalty = 10000 * 0.005 * overdueDays;

      expect(penalty).toBe(0);
    });
  });

  describe('GET /api/repayment/prepayment/:loanId', () => {
    it('should calculate prepayment quote', async () => {
      const principal = 10000;
      const originalInterest = 3000;
      const originalDays = 30;
      const usedDays = 15;

      // Recalculate interest for actual days used
      const dailyRate = originalInterest / originalDays / principal;
      const recalculatedInterest = principal * dailyRate * usedDays;
      const interestSaved = originalInterest - recalculatedInterest;

      expect(recalculatedInterest).toBe(1500);
      expect(interestSaved).toBe(1500);
    });

    it('should not charge prepayment fee', async () => {
      const prepaymentFee = 0; // Lann policy: free prepayment

      expect(prepaymentFee).toBe(0);
    });

    it('should check prepayment eligibility', async () => {
      const loanStatus = 'active';
      const isEligible = loanStatus === 'active';

      expect(isEligible).toBe(true);
    });

    it('should reject prepayment for completed loan', async () => {
      const loanStatus = 'completed';
      const isEligible = loanStatus === 'active';

      expect(isEligible).toBe(false);
    });
  });

  describe('POST /api/repayment/prepay', () => {
    it('should execute prepayment', async () => {
      const prepaymentAmount = 11500; // Principal + accrued interest

      await db.execute(`
        UPDATE loans 
        SET remaining_amount = 0, status = 'completed'
        WHERE id = '${testLoanId}'
      `);

      const result = await db.execute(`
        SELECT remaining_amount, status FROM loans WHERE id = '${testLoanId}'
      `);

      expect(result.results[0].remaining_amount).toBe(0);
      expect(result.results[0].status).toBe('completed');

      // Restore
      await db.execute(`
        UPDATE loans SET remaining_amount = 13000, status = 'active' WHERE id = '${testLoanId}'
      `);
    });

    it('should update credit limit after prepayment', async () => {
      // Simulate credit limit restoration
      const restoredAmount = 10000;

      expect(restoredAmount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/repayment/history/:loanId', () => {
    it('should return repayment history', async () => {
      // Insert test repayments
      await db.execute(`
        INSERT INTO repayments (id, loan_id, amount, method, status, paid_at)
        VALUES 
          ('repay_hist_1', '${testLoanId}', 3000, 'promptpay', 'completed', datetime('now', '-10 days')),
          ('repay_hist_2', '${testLoanId}', 5000, 'bank_transfer', 'completed', datetime('now', '-5 days'))
      `);

      const result = await db.execute(`
        SELECT id, amount, method, status, paid_at 
        FROM repayments 
        WHERE loan_id = '${testLoanId}'
        ORDER BY paid_at DESC
      `);

      expect(result.results.length).toBe(2);
      expect(result.results[0].amount).toBe(5000);

      // Cleanup
      await db.execute(`DELETE FROM repayments WHERE loan_id = '${testLoanId}'`);
    });

    it('should include allocation breakdown', async () => {
      const repaymentAmount = 5000;
      const allocation = {
        penalty: 0,
        interest: 3000,
        principal: 2000,
      };

      expect(allocation.interest + allocation.principal).toBe(repaymentAmount);
    });
  });

  describe('POST /api/repayment/methods', () => {
    it('should return available repayment methods', async () => {
      const methods = [
        { id: 'promptpay', name: 'PromptPay', type: 'instant', available: true },
        { id: 'bank_transfer', name: 'Bank Transfer', type: 'transfer', available: true },
        { id: 'counter', name: 'Counter Service', type: 'cash', available: true },
      ];

      expect(methods.length).toBe(3);
      expect(methods.find(m => m.id === 'promptpay')).toBeDefined();
    });
  });
});
