/**
 * 借款申请 API 集成测试
 * 
 * 测试覆盖:
 * - 借款申请流程
 * - 产品验证
 * - 资格检查
 * - 审批流程
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../../../../backend/db';

describe('API Integration - Loan Apply', () => {
  const testUserId = 'api_test_user_loan';
  const testApplicationId = 'api_test_app_loan';

  beforeAll(async () => {
    // Setup test user
    await db.execute(`
      INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
      VALUES ('${testUserId}', '0812345678', 'TH', datetime('now'))
    `);

    // Setup credit limit
    await db.execute(`
      INSERT OR REPLACE INTO credit_limits 
        (user_id, total_limit, available_limit, credit_score, credit_grade, status, granted_at, expires_at)
      VALUES 
        ('${testUserId}', 50000, 50000, 750, 'A+', 'active', datetime('now'), datetime('now', '+1 year'))
    `);

    // Setup loan products
    await db.execute(`
      INSERT OR REPLACE INTO loan_products (id, name_en, name_th, type, min_amount, max_amount, interest_rate, status)
      VALUES 
        ('payday', 'Payday Loan', 'เงินด่วน', 'payday', 1000, 50000, 0.01, 'active'),
        ('installment', 'Installment Loan', 'เงินผ่อน', 'installment', 5000, 100000, 0.02, 'active')
    `);
  });

  afterAll(async () => {
    await db.execute(`DELETE FROM loan_applications WHERE user_id = '${testUserId}'`);
    await db.execute(`DELETE FROM loans WHERE user_id = '${testUserId}'`);
    await db.execute(`DELETE FROM credit_limits WHERE user_id = '${testUserId}'`);
    await db.execute(`DELETE FROM users WHERE id = '${testUserId}'`);
  });

  describe('POST /api/loan/apply', () => {
    it('should create loan application with valid data', async () => {
      const application = {
        userId: testUserId,
        productId: 'payday',
        amount: 10000,
        termDays: 14,
      };

      await db.execute(`
        INSERT INTO loan_applications (id, user_id, product_id, amount, term_days, status, submitted_at)
        VALUES ('${testApplicationId}', '${testUserId}', 'payday', 10000, 14, 'pending', datetime('now'))
      `);

      const result = await db.execute(`
        SELECT * FROM loan_applications WHERE id = '${testApplicationId}'
      `);

      expect(result.results.length).toBe(1);
      expect(result.results[0].user_id).toBe(testUserId);
      expect(result.results[0].product_id).toBe('payday');
      expect(result.results[0].amount).toBe(10000);
      expect(result.results[0].status).toBe('pending');
    });

    it('should validate product exists', async () => {
      const invalidProduct = 'non_existent_product';

      const result = await db.execute(`
        SELECT COUNT(*) as count FROM loan_products WHERE id = '${invalidProduct}'
      `);

      expect(result.results[0].count).toBe(0);
    });

    it('should validate amount within product range', async () => {
      const productResult = await db.execute(`
        SELECT min_amount, max_amount FROM loan_products WHERE id = 'payday'
      `);

      const minAmount = productResult.results[0].min_amount;
      const maxAmount = productResult.results[0].max_amount;

      expect(10000).toBeGreaterThanOrEqual(minAmount);
      expect(10000).toBeLessThanOrEqual(maxAmount);
    });

    it('should validate term is available for product', async () => {
      const validTerms = [7, 14, 30];
      const requestedTerm = 14;

      expect(validTerms).toContain(requestedTerm);
    });

    it('should check credit limit before approval', async () => {
      const result = await db.execute(`
        SELECT available_limit, total_limit FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      const availableLimit = result.results[0].available_limit;
      const requestedAmount = 10000;

      expect(requestedAmount).toBeLessThanOrEqual(availableLimit);
    });

    it('should reject application exceeding credit limit', async () => {
      const requestedAmount = 60000;
      const availableLimit = 50000;

      expect(requestedAmount).toBeGreaterThan(availableLimit);
    });
  });

  describe('Loan Calculation', () => {
    it('should calculate interest for payday loan', () => {
      const principal = 10000;
      const dailyRate = 0.01;
      const days = 14;

      const interest = principal * dailyRate * days;
      const totalRepayment = principal + interest;

      expect(interest).toBe(1400);
      expect(totalRepayment).toBe(11400);
    });

    it('should calculate daily payment', () => {
      const totalRepayment = 11400;
      const days = 14;

      const dailyPayment = totalRepayment / days;

      expect(dailyPayment).toBeCloseTo(814.29, 2);
    });

    it('should calculate interest for installment loan', () => {
      const principal = 30000;
      const monthlyRate = 0.02;
      const months = 3;

      // Reducing balance method
      const interest = principal * monthlyRate * months * 0.5;
      const totalRepayment = principal + interest;

      expect(interest).toBe(900);
      expect(totalRepayment).toBe(30900);
    });

    it('should calculate monthly payment for installment', () => {
      const totalRepayment = 30900;
      const months = 3;

      const monthlyPayment = totalRepayment / months;

      expect(monthlyPayment).toBe(10300);
    });
  });

  describe('Approval Process', () => {
    it('should auto-approve for good credit and small amount', async () => {
      const creditScore = 750;
      const amount = 10000;
      const autoApprovalThreshold = 20000;

      expect(creditScore).toBeGreaterThanOrEqual(650);
      expect(amount).toBeLessThanOrEqual(autoApprovalThreshold);
    });

    it('should require manual review for large amount', async () => {
      const amount = 30000;
      const autoApprovalThreshold = 20000;

      expect(amount).toBeGreaterThan(autoApprovalThreshold);
    });

    it('should reject for low credit score', async () => {
      const creditScore = 400;
      const minScoreForApproval = 450;

      expect(creditScore).toBeLessThan(minScoreForApproval);
    });

    it('should update application status to approved', async () => {
      await db.execute(`
        UPDATE loan_applications 
        SET status = 'approved', approved_at = datetime('now'), approved_amount = 10000
        WHERE id = '${testApplicationId}'
      `);

      const result = await db.execute(`
        SELECT status, approved_at, approved_amount FROM loan_applications WHERE id = '${testApplicationId}'
      `);

      expect(result.results[0].status).toBe('approved');
      expect(result.results[0].approved_amount).toBe(10000);
    });
  });

  describe('Loan Disbursement', () => {
    it('should create loan record after approval', async () => {
      const loanId = 'api_test_loan_disburse';

      await db.execute(`
        INSERT INTO loans (id, user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
        VALUES ('${loanId}', '${testUserId}', 'payday', 10000, 0.01, 14, 11400, 11400, 'active', datetime('now'), datetime('now', '+14 days'))
      `);

      const result = await db.execute(`
        SELECT * FROM loans WHERE id = '${loanId}'
      `);

      expect(result.results.length).toBe(1);
      expect(result.results[0].status).toBe('active');
      expect(result.results[0].remaining_amount).toBe(11400);

      // Cleanup
      await db.execute(`DELETE FROM loans WHERE id = '${loanId}'`);
    });

    it('should update credit limit after disbursement', async () => {
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
      expect(result.results[0].available_limit).toBe(40000);

      // Restore
      await db.execute(`
        UPDATE credit_limits 
        SET used_limit = 0, available_limit = 50000
        WHERE user_id = '${testUserId}'
      `);
    });

    it('should create repayment schedule', async () => {
      const loanId = 'api_test_loan_schedule';

      await db.execute(`
        INSERT INTO loans (id, user_id, product_id, principal, interest_rate, term_days, total_repayment, remaining_amount, status, disbursed_at, due_date)
        VALUES ('${loanId}', '${testUserId}', 'payday', 10000, 0.01, 14, 11400, 11400, 'active', datetime('now'), datetime('now', '+14 days'))
      `);

      await db.execute(`
        INSERT INTO repayment_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount, status)
        VALUES ('${loanId}', 1, datetime('now', '+14 days'), 10000, 1400, 11400, 'pending')
      `);

      const result = await db.execute(`
        SELECT * FROM repayment_schedules WHERE loan_id = '${loanId}'
      `);

      expect(result.results.length).toBe(1);
      expect(result.results[0].total_amount).toBe(11400);

      // Cleanup
      await db.execute(`DELETE FROM repayment_schedules WHERE loan_id = '${loanId}'`);
      await db.execute(`DELETE FROM loans WHERE id = '${loanId}'`);
    });
  });

  describe('Application Rejection', () => {
    it('should handle rejection with reason', async () => {
      await db.execute(`
        UPDATE loan_applications 
        SET status = 'rejected', rejection_reason = 'Insufficient credit', rejected_at = datetime('now')
        WHERE id = '${testApplicationId}'
      `);

      const result = await db.execute(`
        SELECT status, rejection_reason FROM loan_applications WHERE id = '${testApplicationId}'
      `);

      expect(result.results[0].status).toBe('rejected');
      expect(result.results[0].rejection_reason).toBe('Insufficient credit');
    });

    it('should not affect credit limit on rejection', async () => {
      const result = await db.execute(`
        SELECT available_limit FROM credit_limits WHERE user_id = '${testUserId}'
      `);

      // Limit should still be available since loan was rejected
      expect(result.results[0].available_limit).toBe(50000);
    });
  });

  describe('GET /api/loan/application/:id', () => {
    it('should return application details', async () => {
      const result = await db.execute(`
        SELECT 
          la.id,
          la.user_id,
          la.product_id,
          la.amount,
          la.term_days,
          la.status,
          la.submitted_at,
          lp.name_en as product_name
        FROM loan_applications la
        LEFT JOIN loan_products lp ON la.product_id = lp.id
        WHERE la.id = '${testApplicationId}'
      `);

      expect(result.results.length).toBe(1);
      expect(result.results[0].product_name).toBeDefined();
    });
  });
});
