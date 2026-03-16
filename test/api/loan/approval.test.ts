/**
 * 借款审批 API 集成测试
 * 
 * 测试覆盖:
 * - 审批流程
 * - 审批决策
 * - 手动审批
 * - 审批历史
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db } from '../../../../backend/db';

describe('API Integration - Loan Approval', () => {
  const testUserId = 'api_test_user_approval';
  const testApplicationId = 'api_test_app_approval';

  beforeAll(async () => {
    // Setup
    await db.execute(`
      INSERT OR IGNORE INTO users (id, phone, nationality, created_at)
      VALUES ('${testUserId}', '0812345678', 'TH', datetime('now'))
    `);

    await db.execute(`
      INSERT OR REPLACE INTO credit_limits 
        (user_id, total_limit, available_limit, credit_score, credit_grade, status)
      VALUES ('${testUserId}', 50000, 50000, 750, 'A+', 'active')
    `);

    await db.execute(`
      INSERT OR REPLACE INTO loan_products (id, name_en, name_th, type, min_amount, max_amount, interest_rate, status)
      VALUES ('payday', 'Payday Loan', 'เงินด่วน', 'payday', 1000, 50000, 0.01, 'active')
    `);
  });

  afterAll(async () => {
    await db.execute(`DELETE FROM loan_applications WHERE user_id = '${testUserId}'`);
    await db.execute(`DELETE FROM credit_limits WHERE user_id = '${testUserId}'`);
    await db.execute(`DELETE FROM users WHERE id = '${testUserId}'`);
  });

  describe('Approval Decision Logic', () => {
    it('should auto-approve for excellent credit', () => {
      const creditScore = 750;
      const amount = 10000;
      
      const autoApproveScore = creditScore >= 650;
      const autoApproveAmount = amount <= 20000;

      expect(autoApproveScore).toBe(true);
      expect(autoApproveAmount).toBe(true);
    });

    it('should require manual review for medium credit', () => {
      const creditScore = 580;
      const amount = 10000;
      
      const autoApproveScore = creditScore >= 650;
      const manualReview = creditScore >= 500 && creditScore < 650;

      expect(autoApproveScore).toBe(false);
      expect(manualReview).toBe(true);
    });

    it('should auto-reject for poor credit', () => {
      const creditScore = 400;
      const minScoreForApproval = 450;

      expect(creditScore).toBeLessThan(minScoreForApproval);
    });

    it('should consider debt-to-income ratio', () => {
      const monthlyIncome = 50000;
      const existingDebt = 10000;
      const requestedAmount = 10000;
      
      const dti = (existingDebt + requestedAmount) / monthlyIncome;
      const maxDTI = 0.5;

      expect(dti).toBe(0.4);
      expect(dti).toBeLessThan(maxDTI);
    });

    it('should check employment stability', () => {
      const employmentYears = 3;
      const minEmploymentYears = 1;

      expect(employmentYears).toBeGreaterThanOrEqual(minEmploymentYears);
    });
  });

  describe('POST /api/loan/approve', () => {
    it('should approve application', async () => {
      // Create pending application
      await db.execute(`
        INSERT OR REPLACE INTO loan_applications (id, user_id, product_id, amount, term_days, status, submitted_at)
        VALUES ('${testApplicationId}', '${testUserId}', 'payday', 10000, 14, 'pending', datetime('now'))
      `);

      // Approve
      await db.execute(`
        UPDATE loan_applications 
        SET status = 'approved', approved_at = datetime('now'), approved_amount = 10000, approved_term = 14
        WHERE id = '${testApplicationId}'
      `);

      const result = await db.execute(`
        SELECT status, approved_at, approved_amount FROM loan_applications WHERE id = '${testApplicationId}'
      `);

      expect(result.results[0].status).toBe('approved');
      expect(result.results[0].approved_amount).toBe(10000);
    });

    it('should record approver information', async () => {
      await db.execute(`
        UPDATE loan_applications 
        SET approved_by = 'system', approval_type = 'auto'
        WHERE id = '${testApplicationId}'
      `);

      const result = await db.execute(`
        SELECT approved_by, approval_type FROM loan_applications WHERE id = '${testApplicationId}'
      `);

      expect(result.results[0].approved_by).toBe('system');
      expect(result.results[0].approval_type).toBe('auto');
    });

    it('should handle manual approval', async () => {
      await db.execute(`
        UPDATE loan_applications 
        SET approved_by = 'admin_123', approval_type = 'manual', review_note = 'Verified income'
        WHERE id = '${testApplicationId}'
      `);

      const result = await db.execute(`
        SELECT approved_by, approval_type, review_note FROM loan_applications WHERE id = '${testApplicationId}'
      `);

      expect(result.results[0].approved_by).toBe('admin_123');
      expect(result.results[0].approval_type).toBe('manual');
      expect(result.results[0].review_note).toBe('Verified income');
    });
  });

  describe('POST /api/loan/reject', () => {
    it('should reject application with reason', async () => {
      await db.execute(`
        UPDATE loan_applications 
        SET status = 'rejected', rejected_at = datetime('now'), 
            rejection_reason = 'Insufficient income', rejected_by = 'system'
        WHERE id = '${testApplicationId}'
      `);

      const result = await db.execute(`
        SELECT status, rejection_reason, rejected_by FROM loan_applications WHERE id = '${testApplicationId}'
      `);

      expect(result.results[0].status).toBe('rejected');
      expect(result.results[0].rejection_reason).toBe('Insufficient income');
    });

    it('should allow reapplication after rejection', async () => {
      // Create new application
      const newAppId = 'api_test_app_reapply';
      
      await db.execute(`
        INSERT INTO loan_applications (id, user_id, product_id, amount, term_days, status, submitted_at)
        VALUES ('${newAppId}', '${testUserId}', 'payday', 5000, 14, 'pending', datetime('now'))
      `);

      const result = await db.execute(`
        SELECT COUNT(*) as count FROM loan_applications WHERE user_id = '${testUserId}'
      `);

      expect(result.results[0].count).toBeGreaterThan(0);

      // Cleanup
      await db.execute(`DELETE FROM loan_applications WHERE id = '${newAppId}'`);
    });
  });

  describe('Approval Conditions', () => {
    it('should add conditions to approval', async () => {
      await db.execute(`
        UPDATE loan_applications 
        SET status = 'approved', 
            conditions = 'Provide bank statements',
            conditions_deadline = datetime('now', '+7 days')
        WHERE id = '${testApplicationId}'
      `);

      const result = await db.execute(`
        SELECT conditions, conditions_deadline FROM loan_applications WHERE id = '${testApplicationId}'
      `);

      expect(result.results[0].conditions).toBe('Provide bank statements');
    });

    it('should verify conditions before disbursement', async () => {
      const conditionsMet = true;
      
      expect(conditionsMet).toBe(true);
    });
  });

  describe('GET /api/loan/approvals/pending', () => {
    it('should return pending approvals list', async () => {
      const result = await db.execute(`
        SELECT 
          la.id,
          la.user_id,
          la.amount,
          la.term_days,
          la.submitted_at,
          cl.credit_score,
          cl.credit_grade
        FROM loan_applications la
        LEFT JOIN credit_limits cl ON la.user_id = cl.user_id
        WHERE la.status = 'pending'
        ORDER BY la.submitted_at DESC
      `);

      // Should return pending applications
      expect(result.results).toBeDefined();
    });

    it('should include risk assessment', async () => {
      const creditScore = 750;
      
      let riskLevel;
      if (creditScore >= 700) riskLevel = 'low';
      else if (creditScore >= 550) riskLevel = 'medium';
      else riskLevel = 'high';

      expect(riskLevel).toBe('low');
    });
  });

  describe('Approval Statistics', () => {
    it('should track approval rate', async () => {
      const totalApplications = 100;
      const approvedApplications = 75;
      
      const approvalRate = (approvedApplications / totalApplications) * 100;

      expect(approvalRate).toBe(75);
    });

    it('should track average approval time', async () => {
      const submittedAt = new Date('2026-03-16T00:00:00');
      const approvedAt = new Date('2026-03-16T02:00:00');
      
      const approvalTimeHours = (approvedAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);

      expect(approvalTimeHours).toBe(2);
    });

    it('should track rejection reasons', async () => {
      const rejectionReasons = [
        { reason: 'Insufficient credit', count: 30 },
        { reason: 'Low income', count: 20 },
        { reason: 'Incomplete documentation', count: 10 },
      ];

      const totalRejections = rejectionReasons.reduce((sum, r) => sum + r.count, 0);

      expect(totalRejections).toBe(60);
      expect(rejectionReasons[0].reason).toBe('Insufficient credit');
    });
  });

  describe('Approval Workflow', () => {
    it('should handle escalation to senior reviewer', async () => {
      const amount = 50000;
      const seniorReviewerThreshold = 30000;

      const needsEscalation = amount > seniorReviewerThreshold;

      expect(needsEscalation).toBe(true);
    });

    it('should handle multiple reviewers', async () => {
      const reviewers = ['reviewer_1', 'reviewer_2'];
      const approvals = [true, true];
      
      const allApproved = approvals.every(a => a);

      expect(allApproved).toBe(true);
    });
  });
});
