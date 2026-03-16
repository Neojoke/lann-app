/**
 * 信用服务单元测试
 * 
 * 测试覆盖:
 * - 信用评分计算
 * - 额度授予逻辑
 * - API 端点
 * 
 * 目标覆盖率：≥ 80%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCreditScore,
  getCreditGrade,
  getRecommendedLimit,
  getInterestRate,
  type UserProfile
} from '../services/credit-score.service';
import {
  grantCreditLimit,
  adjustCreditLimit,
  checkLimitReview,
  reviewCreditLimit,
  useCreditLimit,
  restoreCreditLimit,
  grantTemporaryLimit,
  checkTemporaryLimitEligibility,
  serializeLimit,
  deserializeLimit,
  type CreditLimit
} from '../services/credit-limit.service';

// ==================== 测试数据 ====================

const createOptimalProfile = (): UserProfile => ({
  dateOfBirth: '1990-01-01', // 36 岁
  nationality: 'TH',
  residenceYears: 5,
  address: {
    province: 'Bangkok',
    district: 'Pathum Wan',
    postalCode: '10330'
  },
  employment: {
    company: 'Tech Corp',
    position: 'Senior Developer',
    type: 'employee',
    industry: 'technology',
    monthlyIncome: 50000,
    employmentYears: 5
  },
  contact: {
    phone: '0812345678',
    phoneMonths: 24,
    email: 'test@example.com',
    emailVerified: true
  },
  social: {
    emergencyContact: {
      name: 'John Doe',
      relationship: 'spouse',
      phone: '0823456789'
    }
  },
  behavior: {
    deviceId: 'device_123',
    deviceTrustScore: 90,
    applicationCount: 0,
    ipRiskScore: 5
  }
});

const createPoorProfile = (): UserProfile => ({
  dateOfBirth: '2005-01-01', // 21 岁
  nationality: 'Other',
  residenceYears: 0.5,
  employment: {
    company: 'Freelance',
    position: 'Freelancer',
    type: 'self_employed',
    industry: 'freelance',
    monthlyIncome: 10000,
    employmentYears: 0.5
  },
  contact: {
    phone: '0899999999',
    phoneMonths: 3,
    email: 'test@example.com',
    emailVerified: false
  },
  social: {
    emergencyContact: {
      name: 'Friend',
      relationship: 'friend',
      phone: '0811111111'
    }
  },
  behavior: {
    deviceId: 'device_456',
    deviceTrustScore: 30,
    applicationCount: 5,
    ipRiskScore: 40
  }
});

// ==================== 信用评分服务测试 ====================

describe('Credit Score Service', () => {
  describe('calculateCreditScore', () => {
    it('should calculate optimal score for excellent profile', () => {
      const profile = createOptimalProfile();
      const result = calculateCreditScore(profile);
      
      expect(result.totalScore).toBeGreaterThanOrEqual(750);
      expect(result.grade).toBe('A+');
      expect(result.dimensions.basic.score).toBeGreaterThan(150);
      expect(result.dimensions.employment.score).toBeGreaterThan(200);
    });
    
    it('should calculate low score for poor profile', () => {
      const profile = createPoorProfile();
      const result = calculateCreditScore(profile);
      
      expect(result.totalScore).toBeLessThan(550);
      expect(['C', 'D', 'F']).toContain(result.grade);
    });
    
    it('should return score between 300-1000', () => {
      const profile1 = createOptimalProfile();
      const profile2 = createPoorProfile();
      
      const result1 = calculateCreditScore(profile1);
      const result2 = calculateCreditScore(profile2);
      
      expect(result1.totalScore).toBeGreaterThanOrEqual(300);
      expect(result1.totalScore).toBeLessThanOrEqual(1000);
      expect(result2.totalScore).toBeGreaterThanOrEqual(300);
      expect(result2.totalScore).toBeLessThanOrEqual(1000);
    });
    
    it('should handle missing profile data gracefully', () => {
      const profile: UserProfile = {};
      const result = calculateCreditScore(profile);
      
      expect(result.totalScore).toBeGreaterThanOrEqual(300);
      expect(result.totalScore).toBeLessThanOrEqual(1000);
    });
    
    it('should calculate all dimension scores correctly', () => {
      const profile = createOptimalProfile();
      const result = calculateCreditScore(profile);
      
      expect(result.dimensions.basic).toBeDefined();
      expect(result.dimensions.employment).toBeDefined();
      expect(result.dimensions.contact).toBeDefined();
      expect(result.dimensions.social).toBeDefined();
      expect(result.dimensions.behavior).toBeDefined();
      
      // 检查权重
      expect(result.dimensions.basic.weight).toBe(0.20);
      expect(result.dimensions.employment.weight).toBe(0.25);
      expect(result.dimensions.contact.weight).toBe(0.15);
      expect(result.dimensions.social.weight).toBe(0.15);
      expect(result.dimensions.behavior.weight).toBe(0.25);
    });
    
    it('should include detailed scoring information', () => {
      const profile = createOptimalProfile();
      const result = calculateCreditScore(profile);
      
      expect(result.details.basic.length).toBeGreaterThan(0);
      expect(result.details.employment.length).toBeGreaterThan(0);
      expect(result.details.contact.length).toBeGreaterThan(0);
      expect(result.details.social.length).toBeGreaterThan(0);
      expect(result.details.behavior.length).toBeGreaterThan(0);
    });
  });
  
  describe('getCreditGrade', () => {
    it('should return A+ for scores 750-1000', () => {
      expect(getCreditGrade(750).grade).toBe('A+');
      expect(getCreditGrade(850).grade).toBe('A+');
      expect(getCreditGrade(1000).grade).toBe('A+');
    });
    
    it('should return A for scores 650-749', () => {
      expect(getCreditGrade(650).grade).toBe('A');
      expect(getCreditGrade(700).grade).toBe('A');
      expect(getCreditGrade(749).grade).toBe('A');
    });
    
    it('should return B for scores 550-649', () => {
      expect(getCreditGrade(550).grade).toBe('B');
      expect(getCreditGrade(600).grade).toBe('B');
      expect(getCreditGrade(649).grade).toBe('B');
    });
    
    it('should return C for scores 450-549', () => {
      expect(getCreditGrade(450).grade).toBe('C');
      expect(getCreditGrade(500).grade).toBe('C');
      expect(getCreditGrade(549).grade).toBe('C');
    });
    
    it('should return D for scores 300-449', () => {
      expect(getCreditGrade(300).grade).toBe('D');
      expect(getCreditGrade(350).grade).toBe('D');
      expect(getCreditGrade(449).grade).toBe('D');
    });
    
    it('should return F for scores below 300', () => {
      expect(getCreditGrade(0).grade).toBe('F');
      expect(getCreditGrade(200).grade).toBe('F');
      expect(getCreditGrade(299).grade).toBe('F');
    });
  });
  
  describe('getRecommendedLimit', () => {
    it('should return correct limit range for A+ grade', () => {
      const limit = getRecommendedLimit('A+');
      expect(limit.min).toBe(30000);
      expect(limit.max).toBe(50000);
    });
    
    it('should return correct limit range for A grade', () => {
      const limit = getRecommendedLimit('A');
      expect(limit.min).toBe(20000);
      expect(limit.max).toBe(30000);
    });
    
    it('should return correct limit range for B grade', () => {
      const limit = getRecommendedLimit('B');
      expect(limit.min).toBe(10000);
      expect(limit.max).toBe(20000);
    });
    
    it('should return 0 for F grade', () => {
      const limit = getRecommendedLimit('F');
      expect(limit.min).toBe(0);
      expect(limit.max).toBe(0);
    });
  });
  
  describe('getInterestRate', () => {
    it('should return lowest rate for A+ grade', () => {
      expect(getInterestRate('A+')).toBe(0.008);
    });
    
    it('should return higher rate for lower grades', () => {
      expect(getInterestRate('A')).toBe(0.01);
      expect(getInterestRate('B')).toBe(0.012);
      expect(getInterestRate('C')).toBe(0.015);
    });
  });
});

// ==================== 额度管理服务测试 ====================

describe('Credit Limit Service', () => {
  describe('grantCreditLimit', () => {
    it('should grant limit for excellent profile', () => {
      const profile = createOptimalProfile();
      const result = grantCreditLimit('user_123', profile);
      
      expect(result.success).toBe(true);
      expect(result.limit).toBeDefined();
      
      if (result.limit) {
        expect(result.limit.userId).toBe('user_123');
        expect(result.limit.totalLimit).toBeGreaterThanOrEqual(30000);
        expect(result.limit.totalLimit).toBeLessThanOrEqual(50000);
        expect(result.limit.status).toBe('active');
        expect(result.limit.creditGrade).toBe('A+');
        expect(result.limit.validityDays).toBe(365);
      }
    });
    
    it('should reject limit for poor profile', () => {
      const profile = createPoorProfile();
      const result = grantCreditLimit('user_456', profile);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INSUFFICIENT_SCORE');
    });
    
    it('should set correct expiry date', () => {
      const profile = createOptimalProfile();
      const result = grantCreditLimit('user_789', profile);
      
      if (result.limit) {
        const now = new Date();
        const expectedExpiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        const timeDiff = Math.abs(result.limit.expiresAt.getTime() - expectedExpiry.getTime());
        
        // 允许 1 秒误差
        expect(timeDiff).toBeLessThan(1000);
      }
    });
    
    it('should initialize available limit equal to total limit', () => {
      const profile = createOptimalProfile();
      const result = grantCreditLimit('user_test', profile);
      
      if (result.limit) {
        expect(result.limit.availableLimit).toBe(result.limit.totalLimit);
        expect(result.limit.usedLimit).toBe(0);
        expect(result.limit.frozenLimit).toBe(0);
      }
    });
  });
  
  describe('adjustCreditLimit', () => {
    let baseLimit: CreditLimit;
    
    beforeEach(() => {
      const profile = createOptimalProfile();
      const result = grantCreditLimit('user_adjust', profile);
      if (result.limit) {
        baseLimit = result.limit;
      }
    });
    
    it('should increase limit by percentage', () => {
      const result = adjustCreditLimit({
        userId: 'user_adjust',
        currentLimit: baseLimit,
        adjustmentType: 'increase',
        percentage: 0.2,
        reason: 'Good repayment history',
        reasonCode: 'GOOD_REPAY',
        adjustedBy: 'system'
      });
      
      expect(result.success).toBe(true);
      if (result.limit) {
        expect(result.limit.totalLimit).toBeGreaterThan(baseLimit.totalLimit);
      }
    });
    
    it('should decrease limit by percentage', () => {
      const result = adjustCreditLimit({
        userId: 'user_adjust',
        currentLimit: baseLimit,
        adjustmentType: 'decrease',
        percentage: 0.5,
        reason: 'Inactive for 90 days',
        reasonCode: 'INACTIVE',
        adjustedBy: 'system'
      });
      
      expect(result.success).toBe(true);
      if (result.limit) {
        expect(result.limit.totalLimit).toBeLessThan(baseLimit.totalLimit);
      }
    });
    
    it('should freeze limit', () => {
      const result = adjustCreditLimit({
        userId: 'user_adjust',
        currentLimit: baseLimit,
        adjustmentType: 'freeze',
        reason: 'Suspicious activity',
        reasonCode: 'SUSPICIOUS',
        adjustedBy: 'admin'
      });
      
      expect(result.success).toBe(true);
      if (result.limit) {
        expect(result.limit.status).toBe('suspended');
        expect(result.limit.availableLimit).toBe(0);
        expect(result.limit.frozenLimit).toBe(result.limit.totalLimit);
      }
    });
    
    it('should unfreeze limit', () => {
      // 先冻结
      const frozenResult = adjustCreditLimit({
        userId: 'user_adjust',
        currentLimit: baseLimit,
        adjustmentType: 'freeze',
        reason: 'Test',
        reasonCode: 'TEST',
        adjustedBy: 'admin'
      });
      
      if (frozenResult.limit) {
        // 再解冻
        const unfreezeResult = adjustCreditLimit({
          userId: 'user_adjust',
          currentLimit: frozenResult.limit,
          adjustmentType: 'unfreeze',
          reason: 'Issue resolved',
          reasonCode: 'RESOLVED',
          adjustedBy: 'admin'
        });
        
        expect(unfreezeResult.success).toBe(true);
        if (unfreezeResult.limit) {
          expect(unfreezeResult.limit.status).toBe('active');
          expect(unfreezeResult.limit.frozenLimit).toBe(0);
        }
      }
    });
    
    it('should reject adjustment for expired limit', () => {
      const expiredLimit = { ...baseLimit, status: 'expired' as const };
      
      const result = adjustCreditLimit({
        userId: 'user_adjust',
        currentLimit: expiredLimit,
        adjustmentType: 'increase',
        percentage: 0.1,
        reason: 'Test',
        reasonCode: 'TEST',
        adjustedBy: 'system'
      });
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LIMIT_EXPIRED');
    });
  });
  
  describe('checkLimitReview', () => {
    let baseLimit: CreditLimit;
    
    beforeEach(() => {
      const profile = createOptimalProfile();
      const result = grantCreditLimit('user_review', profile);
      if (result.limit) {
        baseLimit = result.limit;
      }
    });
    
    it('should not require review for new active limit', () => {
      const result = checkLimitReview(baseLimit);
      
      expect(result.shouldReview).toBe(false);
      expect(result.recommendedAction).toBe('maintain');
    });
    
    it('should trigger review when expiring soon', () => {
      const expiringLimit = {
        ...baseLimit,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 天后到期
      };
      
      const result = checkLimitReview(expiringLimit);
      
      expect(result.shouldReview).toBe(true);
      expect(result.reason).toContain('Expiring');
    });
    
    it('should trigger review when expired', () => {
      const expiredLimit = {
        ...baseLimit,
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 天前到期
        status: 'expired' as const
      };
      
      const result = checkLimitReview(expiredLimit);
      
      expect(result.shouldReview).toBe(true);
      expect(result.reason).toContain('Expired');
    });
    
    it('should trigger review for inactive limit', () => {
      const inactiveLimit = {
        ...baseLimit,
        grantedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 天前授予
        usedLimit: 0
      };
      
      const result = checkLimitReview(inactiveLimit);
      
      expect(result.shouldReview).toBe(true);
      expect(result.reason).toContain('Inactive');
      expect(result.recommendedAction).toBe('decrease');
    });
  });
  
  describe('useCreditLimit', () => {
    let baseLimit: CreditLimit;
    
    beforeEach(() => {
      const profile = createOptimalProfile();
      const result = grantCreditLimit('user_use', profile);
      if (result.limit) {
        baseLimit = result.limit;
      }
    });
    
    it('should successfully use credit within limit', () => {
      const useAmount = 10000;
      const result = useCreditLimit(baseLimit, useAmount);
      
      expect(result.success).toBe(true);
      if (result.limit) {
        expect(result.limit.usedLimit).toBe(useAmount);
        expect(result.limit.availableLimit).toBe(baseLimit.totalLimit - useAmount);
      }
    });
    
    it('should reject use exceeding available limit', () => {
      const useAmount = baseLimit.totalLimit + 1;
      const result = useCreditLimit(baseLimit, useAmount);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INSUFFICIENT_LIMIT');
    });
    
    it('should reject use for non-active limit', () => {
      const suspendedLimit = { ...baseLimit, status: 'suspended' as const };
      const result = useCreditLimit(suspendedLimit, 1000);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('LIMIT_NOT_ACTIVE');
    });
  });
  
  describe('restoreCreditLimit', () => {
    let usedLimit: CreditLimit;
    
    beforeEach(() => {
      const profile = createOptimalProfile();
      const grantResult = grantCreditLimit('user_restore', profile);
      if (grantResult.limit) {
        const useResult = useCreditLimit(grantResult.limit, 10000);
        if (useResult.limit) {
          usedLimit = useResult.limit;
        }
      }
    });
    
    it('should restore limit after repayment', () => {
      const repayAmount = 5000;
      const result = restoreCreditLimit(usedLimit, repayAmount);
      
      expect(result.success).toBe(true);
      if (result.limit) {
        expect(result.limit.usedLimit).toBe(5000);
        expect(result.limit.availableLimit).toBe(usedLimit.availableLimit + repayAmount);
      }
    });
    
    it('should not exceed total limit when restoring', () => {
      const repayAmount = 20000; // 超过已用额度
      const result = restoreCreditLimit(usedLimit, repayAmount);
      
      expect(result.success).toBe(true);
      if (result.limit) {
        expect(result.limit.availableLimit).toBeLessThanOrEqual(result.limit.totalLimit);
      }
    });
  });
  
  describe('temporary limit', () => {
    let baseLimit: CreditLimit;
    
    beforeEach(() => {
      const profile = createOptimalProfile();
      const result = grantCreditLimit('user_temp', profile);
      if (result.limit) {
        baseLimit = result.limit;
      }
    });
    
    it('should check temporary limit eligibility', () => {
      const eligibility = checkTemporaryLimitEligibility(baseLimit);
      
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.amount).toBeGreaterThan(0);
    });
    
    it('should grant temporary limit', () => {
      const result = grantTemporaryLimit(baseLimit, createOptimalProfile(), 30);
      
      expect(result.success).toBe(true);
      if (result.limit) {
        expect(result.limit.totalLimit).toBeGreaterThan(baseLimit.totalLimit);
        expect(result.limit.temporaryLimit).toBeDefined();
        expect(result.limit.temporaryLimit?.amount).toBeGreaterThan(0);
      }
    });
    
    it('should reject temporary limit for low grade', () => {
      const lowGradeLimit = {
        ...baseLimit,
        creditGrade: 'D' as const,
        creditScore: 350
      };
      
      const eligibility = checkTemporaryLimitEligibility(lowGradeLimit);
      
      expect(eligibility.eligible).toBe(false);
    });
  });
  
  describe('serialize/deserialize', () => {
    it('should serialize and deserialize correctly', () => {
      const profile = createOptimalProfile();
      const grantResult = grantCreditLimit('user_serial', profile);
      
      if (grantResult.limit) {
        const serialized = serializeLimit(grantResult.limit);
        const deserialized = deserializeLimit(serialized);
        
        expect(deserialized.userId).toBe(grantResult.limit.userId);
        expect(deserialized.totalLimit).toBe(grantResult.limit.totalLimit);
        expect(deserialized.creditScore).toBe(grantResult.limit.creditScore);
        expect(deserialized.status).toBe(grantResult.limit.status);
        
        // 检查日期是否正确转换
        expect(deserialized.grantedAt).toBeInstanceOf(Date);
        expect(deserialized.expiresAt).toBeInstanceOf(Date);
      }
    });
  });
});

// ==================== 边界情况测试 ====================

describe('Edge Cases', () => {
  describe('Age boundary', () => {
    it('should handle minimum age (20)', () => {
      const profile: UserProfile = {
        dateOfBirth: new Date(new Date().getFullYear() - 20, 0, 1).toISOString(),
        nationality: 'TH',
        residenceYears: 1
      };
      
      const result = calculateCreditScore(profile);
      expect(result.totalScore).toBeGreaterThanOrEqual(300);
    });
    
    it('should handle maximum age (65)', () => {
      const profile: UserProfile = {
        dateOfBirth: new Date(new Date().getFullYear() - 65, 0, 1).toISOString(),
        nationality: 'TH',
        residenceYears: 40
      };
      
      const result = calculateCreditScore(profile);
      expect(result.totalScore).toBeGreaterThanOrEqual(300);
    });
  });
  
  describe('Income boundary', () => {
    it('should handle zero income', () => {
      const profile: UserProfile = {
        dateOfBirth: '1990-01-01',
        nationality: 'TH',
        employment: {
          monthlyIncome: 0,
          employmentYears: 0
        }
      };
      
      const result = calculateCreditScore(profile);
      expect(result.dimensions.employment.score).toBeLessThan(50);
    });
    
    it('should handle very high income', () => {
      const profile: UserProfile = {
        dateOfBirth: '1990-01-01',
        nationality: 'TH',
        employment: {
          monthlyIncome: 500000,
          employmentYears: 10
        }
      };
      
      const result = calculateCreditScore(profile);
      expect(result.dimensions.employment.score).toBeGreaterThanOrEqual(200);
    });
  });
  
  describe('Limit adjustment boundary', () => {
    it('should not allow negative limit', () => {
      const profile = createOptimalProfile();
      const grantResult = grantCreditLimit('user_boundary', profile);
      
      if (grantResult.limit) {
        const result = adjustCreditLimit({
          userId: 'user_boundary',
          currentLimit: grantResult.limit,
          adjustmentType: 'decrease',
          percentage: 2, // 减少 200%
          reason: 'Test',
          reasonCode: 'TEST',
          adjustedBy: 'system'
        });
        
        if (result.limit) {
          expect(result.limit.totalLimit).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});

// ==================== 集成测试 ====================

describe('Integration Tests', () => {
  it('should complete full credit lifecycle', () => {
    // 1. 申请信用
    const profile = createOptimalProfile();
    const grantResult = grantCreditLimit('user_lifecycle', profile);
    
    expect(grantResult.success).toBe(true);
    expect(grantResult.limit).toBeDefined();
    
    if (!grantResult.limit) return;
    
    // 2. 使用额度
    const useResult = useCreditLimit(grantResult.limit, 10000);
    expect(useResult.success).toBe(true);
    expect(useResult.limit).toBeDefined();
    
    if (!useResult.limit) return;
    
    // 3. 还款恢复额度
    const restoreResult = restoreCreditLimit(useResult.limit, 5000);
    expect(restoreResult.success).toBe(true);
    expect(restoreResult.limit).toBeDefined();
    
    if (!restoreResult.limit) return;
    
    // 4. 检查复审
    const reviewCheck = checkLimitReview(restoreResult.limit);
    expect(reviewCheck).toBeDefined();
    
    // 5. 调整额度
    const adjustResult = adjustCreditLimit({
      userId: 'user_lifecycle',
      currentLimit: restoreResult.limit,
      adjustmentType: 'increase',
      percentage: 0.1,
      reason: 'Good customer',
      reasonCode: 'GOOD',
      adjustedBy: 'system'
    });
    
    expect(adjustResult.success).toBe(true);
    if (adjustResult.limit) {
      expect(adjustResult.limit.totalLimit).toBeGreaterThan(restoreResult.limit.totalLimit);
    }
  });
});
