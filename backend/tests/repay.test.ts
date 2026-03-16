/**
 * 还款服务单元测试
 * 
 * 测试覆盖:
 * - 还款计划生成
 * - 还款分配逻辑
 * - 罚息计算
 * - 提前还款计算
 */

import { describe, it, expect } from 'bun:test';
import {
  generateRepaymentPlan,
  calculateInstallmentAmount,
  calculateDueDates,
} from '../services/repayment-schedule.service';
import {
  allocateRepayment,
} from '../services/repayment.service';
import {
  calculatePenalty,
  calculateSimplePenalty,
  getCurrentPenaltyRate,
  getPenaltyBreakdown,
  predictFuturePenalty,
} from '../services/penalty.service';
import {
  calculatePrepayment,
  checkPrepaymentEligibility,
} from '../services/prepayment.service';

// ========== 还款计划服务测试 ==========

describe('Repayment Schedule Service', () => {
  describe('generateRepaymentPlan', () => {
    it('should generate bullet repayment plan correctly', () => {
      const plan = generateRepaymentPlan(
        'loan-1',
        10000,      // principal
        0.01,       // 1% daily rate
        30,         // 30 days
        'bullet',   // one-time repayment
        1,
        new Date('2026-03-01')
      );

      expect(plan.loan_id).toBe('loan-1');
      expect(plan.principal).toBe(10000);
      expect(plan.repayment_type).toBe('bullet');
      expect(plan.installments).toHaveLength(1);
      
      // Interest = 10000 * 0.01 * 30 = 3000
      expect(plan.total_interest).toBe(3000);
      expect(plan.total_repayment).toBe(13000);
      
      const installment = plan.installments[0];
      expect(installment.principal).toBe(10000);
      expect(installment.interest).toBe(3000);
      expect(installment.total).toBe(13000);
      expect(installment.due_date).toBe('2026-03-31');
    });

    it('should generate installment repayment plan correctly', () => {
      const plan = generateRepaymentPlan(
        'loan-2',
        12000,      // principal
        0.001,      // 0.1% daily rate (≈ 3% monthly)
        90,         // 90 days
        'installment',
        3,          // 3 installments
        new Date('2026-03-01')
      );

      expect(plan.installments).toHaveLength(3);
      expect(plan.repayment_type).toBe('installment');
      
      // Each installment should have decreasing interest
      plan.installments.forEach((inst, index) => {
        expect(inst.number).toBe(index + 1);
        expect(inst.principal).toBeGreaterThan(0);
        expect(inst.interest).toBeGreaterThan(0);
        expect(inst.total).toBeGreaterThan(0);
      });
    });

    it('should calculate correct due date for bullet repayment', () => {
      const plan = generateRepaymentPlan(
        'loan-3',
        5000,
        0.01,
        14,
        'bullet',
        1,
        new Date('2026-03-15')
      );

      expect(plan.installments[0].due_date).toBe('2026-03-29');
    });
  });

  describe('calculateInstallmentAmount', () => {
    it('should calculate equal installment amounts', () => {
      const result = calculateInstallmentAmount(10000, 0.001, 30, 3);
      
      expect(result.principal).toBeGreaterThan(0);
      expect(result.interest).toBeGreaterThan(0);
      // Allow small floating point difference
      expect(Math.abs(result.total - (result.principal + result.interest))).toBeLessThan(0.01);
    });
  });

  describe('calculateDueDates', () => {
    it('should calculate correct due dates', () => {
      const startDate = new Date('2026-03-01');
      const dates = calculateDueDates(startDate, 30, 3);
      
      expect(dates).toHaveLength(3);
      expect(dates[0]).toBe('2026-03-11');
      expect(dates[1]).toBe('2026-03-21');
      expect(dates[2]).toBe('2026-03-31');
    });

    it('should handle single installment', () => {
      const dates = calculateDueDates(new Date('2026-03-01'), 30, 1);
      expect(dates).toHaveLength(1);
      expect(dates[0]).toBe('2026-03-31');
    });
  });
});

// ========== 还款服务测试 ==========

describe('Repayment Service', () => {
  describe('allocateRepayment', () => {
    it('should allocate repayment in correct order (penalty → fee → interest → principal)', () => {
      const dueItems = [
        { type: 'penalty', amount: 100 },
        { type: 'fee', amount: 50 },
        { type: 'interest', amount: 200 },
        { type: 'principal', amount: 1000 },
      ];

      const allocations = allocateRepayment(500, dueItems);

      expect(allocations).toHaveLength(4);
      
      // First: penalty (full 100)
      expect(allocations[0].type).toBe('penalty');
      expect(allocations[0].amount).toBe(100);
      
      // Second: fee (full 50)
      expect(allocations[1].type).toBe('fee');
      expect(allocations[1].amount).toBe(50);
      
      // Third: interest (full 200)
      expect(allocations[2].type).toBe('interest');
      expect(allocations[2].amount).toBe(200);
      
      // Fourth: principal (remaining 150)
      expect(allocations[3].type).toBe('principal');
      expect(allocations[3].amount).toBe(150);
    });

    it('should handle partial repayment', () => {
      const dueItems = [
        { type: 'penalty', amount: 100 },
        { type: 'interest', amount: 200 },
        { type: 'principal', amount: 1000 },
      ];

      const allocations = allocateRepayment(150, dueItems);

      expect(allocations).toHaveLength(2);
      expect(allocations[0].type).toBe('penalty');
      expect(allocations[0].amount).toBe(100);
      expect(allocations[1].type).toBe('interest');
      expect(allocations[1].amount).toBe(50);
    });

    it('should handle overpayment', () => {
      const dueItems = [
        { type: 'penalty', amount: 100 },
        { type: 'interest', amount: 200 },
        { type: 'principal', amount: 1000 },
      ];

      const allocations = allocateRepayment(2000, dueItems);

      // Should only allocate up to total due
      const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
      expect(totalAllocated).toBe(1300);
    });
  });
});

// ========== 罚息计算服务测试 ==========

describe('Penalty Service', () => {
  describe('calculatePenalty', () => {
    it('should calculate penalty with base rate', () => {
      // 10000 THB, 5 days, 0.5%/day
      const penalty = calculatePenalty(10000, 5);
      
      // 10000 * 0.005 * 5 = 250
      expect(penalty).toBe(250);
    });

    it('should apply minimum penalty', () => {
      // 1000 THB, 1 day, 0.5%/day = 5 THB
      // But minimum is 50 THB
      const penalty = calculatePenalty(1000, 1);
      expect(penalty).toBe(50);
    });

    it('should apply penalty cap', () => {
      // 10000 THB, 100 days
      // Without cap: 10000 * 0.005 * 100 = 5000
      // With cap (20%): 10000 * 0.20 = 2000
      const penalty = calculatePenalty(10000, 100);
      expect(penalty).toBeLessThanOrEqual(2000);
    });

    it('should return 0 for non-overdue', () => {
      const penalty = calculatePenalty(10000, 0);
      expect(penalty).toBe(0);
    });

    it('should use tiered penalty rates', () => {
      // Test different tiers
      const rate1 = getCurrentPenaltyRate(5);   // Tier 1: 0.5%
      const rate2 = getCurrentPenaltyRate(10);  // Tier 2: 0.7%
      const rate3 = getCurrentPenaltyRate(50);  // Tier 3: 1%
      
      expect(rate1).toBe(0.005);
      expect(rate2).toBe(0.007);
      expect(rate3).toBe(0.01);
    });
  });

  describe('getPenaltyBreakdown', () => {
    it('should provide detailed penalty breakdown', () => {
      const breakdown = getPenaltyBreakdown(10000, 15);
      
      expect(breakdown.totalPenalty).toBeGreaterThan(0);
      expect(breakdown.byTier).toHaveLength(2); // Days 1-7 and 8-15
      expect(breakdown.maxPenaltyCap).toBe(2000); // 20% of 10000
    });

    it('should calculate multi-tier penalty correctly', () => {
      const breakdown = getPenaltyBreakdown(10000, 10);
      
      // Tier 1 (days 1-7): 10000 * 0.005 * 7 = 350
      // Tier 2 (days 8-10): 10000 * 0.007 * 3 = 210
      // Total: 560
      expect(breakdown.totalPenalty).toBe(560);
    });
  });

  describe('predictFuturePenalty', () => {
    it('should predict future penalty accrual', () => {
      // Current: 5 days overdue
      // Future: 5 more days (total 10 days)
      const futurePenalty = predictFuturePenalty(10000, 5, 5);
      
      // Days 1-7 at 0.5%: 10000 * 0.005 * 7 = 350
      // Days 8-10 at 0.7%: 10000 * 0.007 * 3 = 210
      // Total for 10 days: 560
      // Total for 5 days: 10000 * 0.005 * 5 = 250
      // Future penalty: 560 - 250 = 310
      expect(futurePenalty).toBe(310);
    });
  });

  describe('calculateSimplePenalty', () => {
    it('should calculate simple penalty', () => {
      const penalty = calculateSimplePenalty(10000, 10, 0.005);
      expect(penalty).toBe(500);
    });
  });
});

// ========== 提前还款服务测试 ==========

describe('Prepayment Service', () => {
  // Mock database for testing
  const mockDb = {
    get: async (sql: string, params: any[]) => {
      // Mock loan data
      if (sql.includes('SELECT * FROM loans')) {
        return {
          id: params[0],
          principal: 10000,
          remaining_amount: 10000,
          total_interest: 3000,
          interest_rate: 0.01,
          term_days: 30,
          disbursed_at: '2026-03-01',
          due_date: '2026-03-31',
          status: 'active',
          penalty_amount: 0,
        };
      }
      return null;
    },
    run: async () => {},
  };

  describe('calculatePrepayment', () => {
    it('should calculate prepayment amount correctly', async () => {
      // Mock the db import
      const originalDb = await import('../db');
      const originalGet = originalDb.db.get;
      originalDb.db.get = mockDb.get;

      try {
        const calculation = await calculatePrepayment('loan-1');
        
        expect(calculation.loan_id).toBe('loan-1');
        expect(calculation.remaining_principal).toBe(10000);
        expect(calculation.used_days).toBeGreaterThan(0);
        expect(calculation.recalculated_interest).toBeLessThan(calculation.original_interest);
        expect(calculation.interest_saved).toBeGreaterThan(0);
        expect(calculation.prepayment_fee).toBe(0); // Lann policy: free
      } finally {
        originalDb.db.get = originalGet;
      }
    });

    it('should show interest savings for early prepayment', async () => {
      const originalDb = await import('../db');
      const originalGet = originalDb.db.get;
      originalDb.db.get = mockDb.get;

      try {
        const calculation = await calculatePrepayment('loan-1');
        
        // Prepayment should calculate interest based on actual days used
        expect(calculation.remaining_principal).toBe(10000);
        expect(calculation.recalculated_interest).toBeLessThanOrEqual(calculation.original_interest);
      } finally {
        originalDb.db.get = originalGet;
      }
    });
  });

  describe('checkPrepaymentEligibility', () => {
    it('should allow prepayment for active loans', async () => {
      const originalDb = await import('../db');
      const originalGet = originalDb.db.get;
      originalDb.db.get = mockDb.get;

      try {
        const eligibility = await checkPrepaymentEligibility('loan-1');
        
        expect(eligibility.allowed).toBe(true);
      } finally {
        originalDb.db.get = originalGet;
      }
    });

    it('should reject prepayment for completed loans', async () => {
      const originalDb = await import('../db');
      const originalGet = originalDb.db.get;
      originalDb.db.get = async (sql: string, params: any[]) => {
        if (sql.includes('SELECT * FROM loans')) {
          return {
            id: params[0],
            status: 'completed',
          };
        }
        return null;
      };

      try {
        const eligibility = await checkPrepaymentEligibility('loan-completed');
        
        expect(eligibility.allowed).toBe(false);
        expect(eligibility.reason).toContain('completed');
      } finally {
        originalDb.db.get = originalGet;
      }
    });
  });
});

// ========== 集成测试 ==========

describe('Integration Tests', () => {
  it('should handle complete repayment flow', () => {
    // 1. Generate repayment plan
    const plan = generateRepaymentPlan(
      'loan-test',
      10000,
      0.01,
      30,
      'bullet',
      1,
      new Date('2026-03-01')
    );

    // 2. Simulate partial prepayment
    const penalty = calculatePenalty(10000, 5);
    
    // 3. Allocate repayment
    const dueItems = [
      { type: 'penalty', amount: penalty },
      { type: 'interest', amount: plan.total_interest },
      { type: 'principal', amount: plan.principal },
    ];

    const repaymentAmount = 5000;
    const allocations = allocateRepayment(repaymentAmount, dueItems);

    // Verify allocation order
    expect(allocations[0].type).toBe('penalty');
    
    // Total allocated should equal repayment amount
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    expect(totalAllocated).toBe(repaymentAmount);
  });

  it('should calculate correct total for early settlement', () => {
    const principal = 10000;
    const dailyRate = 0.01;
    const usedDays = 15;

    // Interest for actual days used
    const interest = principal * dailyRate * usedDays;
    
    // Total due (Lann: no prepayment fee)
    const totalDue = principal + interest;

    expect(interest).toBe(1500);
    expect(totalDue).toBe(11500);
    
    // Original 30-day interest would be 3000
    // Savings: 1500
    const originalInterest = principal * dailyRate * 30;
    const savings = originalInterest - interest;
    expect(savings).toBe(1500);
  });
});
