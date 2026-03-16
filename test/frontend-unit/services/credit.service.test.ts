/**
 * Credit Service 测试
 * 
 * 测试覆盖:
 * - API 调用
 * - 数据转换
 * - 错误处理
 * - 缓存逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { creditService } from '../../src/services/credit.service';
import { apiClient } from '../../src/utils/api';

vi.mock('../../src/utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}));

describe('Credit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('applyCredit', () => {
    it('should submit credit application', async () => {
      const mockResponse = {
        success: true,
        applicationId: 'app_123',
        message: 'Application submitted',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const profile = {
        income: 30000,
        employer: 'Test Company',
        position: 'Developer',
        phone: '0812345678',
      };

      const result = await creditService.applyCredit(profile);

      expect(apiClient.post).toHaveBeenCalledWith('/credit/apply', profile);
      expect(result.success).toBe(true);
      expect(result.applicationId).toBe('app_123');
    });

    it('should handle application error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      const profile = { income: 30000, employer: 'Test' };

      await expect(creditService.applyCredit(profile))
        .rejects
        .toThrow('Network error');
    });

    it('should validate profile before submission', async () => {
      const invalidProfile = { income: -1000 };

      await expect(creditService.applyCredit(invalidProfile as any))
        .rejects
        .toThrow();
    });
  });

  describe('getCreditStatus', () => {
    it('should fetch credit status', async () => {
      const mockStatus = {
        userId: 'user_123',
        creditScore: 750,
        grade: 'A+',
        totalLimit: 50000,
        availableLimit: 45000,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockStatus);

      const result = await creditService.getCreditStatus();

      expect(apiClient.get).toHaveBeenCalledWith('/credit/status');
      expect(result).toEqual(mockStatus);
    });

    it('should return null when no credit', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(null);

      const result = await creditService.getCreditStatus();

      expect(result).toBeNull();
    });

    it('should handle fetch error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      await expect(creditService.getCreditStatus())
        .rejects
        .toThrow('Network error');
    });
  });

  describe('refreshCreditScore', () => {
    it('should refresh credit score', async () => {
      const mockResponse = {
        success: true,
        newScore: 760,
        previousScore: 750,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await creditService.refreshCreditScore();

      expect(apiClient.post).toHaveBeenCalledWith('/credit/refresh');
      expect(result.success).toBe(true);
      expect(result.newScore).toBe(760);
    });

    it('should handle refresh error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Refresh failed'));

      await expect(creditService.refreshCreditScore())
        .rejects
        .toThrow('Refresh failed');
    });
  });

  describe('getCreditLimit', () => {
    it('should fetch credit limit', async () => {
      const mockLimit = {
        totalLimit: 50000,
        availableLimit: 45000,
        usedLimit: 5000,
        frozenLimit: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockLimit);

      const result = await creditService.getCreditLimit();

      expect(apiClient.get).toHaveBeenCalledWith('/credit/limit');
      expect(result).toEqual(mockLimit);
    });
  });

  describe('useCreditLimit', () => {
    it('should use credit limit', async () => {
      const mockResponse = {
        success: true,
        remainingLimit: 35000,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await creditService.useCreditLimit(10000);

      expect(apiClient.post).toHaveBeenCalledWith('/credit/use', { amount: 10000 });
      expect(result.success).toBe(true);
    });

    it('should reject insufficient limit', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: 'INSUFFICIENT_LIMIT',
      });

      const result = await creditService.useCreditLimit(100000);

      expect(result.success).toBe(false);
    });
  });

  describe('restoreCreditLimit', () => {
    it('should restore limit after repayment', async () => {
      const mockResponse = {
        success: true,
        restoredAmount: 5000,
        newAvailableLimit: 40000,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await creditService.restoreCreditLimit(5000);

      expect(apiClient.post).toHaveBeenCalledWith('/credit/restore', { amount: 5000 });
      expect(result.success).toBe(true);
    });
  });

  describe('adjustCreditLimit', () => {
    it('should request limit adjustment', async () => {
      const mockResponse = {
        success: true,
        newLimit: 60000,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await creditService.adjustCreditLimit('increase', 0.2, 'Good repayment');

      expect(apiClient.post).toHaveBeenCalledWith('/credit/adjust', {
        type: 'increase',
        percentage: 0.2,
        reason: 'Good repayment',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getCreditsHistory', () => {
    it('should fetch credit history', async () => {
      const mockHistory = [
        { date: '2026-03-01', score: 700, event: 'Initial grant' },
        { date: '2026-03-15', score: 750, event: 'Review' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockHistory);

      const result = await creditService.getCreditsHistory();

      expect(apiClient.get).toHaveBeenCalledWith('/credit/history');
      expect(result).toEqual(mockHistory);
    });

    it('should support pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      await creditService.getCreditsHistory({ page: 1, size: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/credit/history', {
        params: { page: 1, size: 10 },
      });
    });
  });

  describe('cancelCredit', () => {
    it('should cancel credit application', async () => {
      const mockResponse = { success: true };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await creditService.cancelCredit('app_123');

      expect(apiClient.post).toHaveBeenCalledWith('/credit/cancel', {
        applicationId: 'app_123',
      });
      expect(result.success).toBe(true);
    });
  });
});
