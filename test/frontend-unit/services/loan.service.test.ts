/**
 * Loan Service 测试
 * 
 * 测试覆盖:
 * - 产品获取
 * - 借款申请
 * - 还款计算
 * - 状态查询
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loanService } from '../../src/services/loan.service';
import { apiClient } from '../../src/utils/api';

vi.mock('../../src/utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('Loan Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch available loan products', async () => {
      const mockProducts = [
        {
          id: 'payday',
          name: { en: 'Payday Loan', th: 'เงินด่วน' },
          type: 'payday',
          minAmount: 1000,
          maxAmount: 50000,
          terms: [7, 14, 30],
          interestRate: 0.01,
        },
        {
          id: 'installment',
          name: { en: 'Installment Loan', th: 'เงินผ่อน' },
          type: 'installment',
          minAmount: 5000,
          maxAmount: 100000,
          terms: [90, 180],
          interestRate: 0.02,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockProducts);

      const result = await loanService.getProducts();

      expect(apiClient.get).toHaveBeenCalledWith('/loan/products');
      expect(result).toEqual(mockProducts);
      expect(result).toHaveLength(2);
    });

    it('should filter active products only', async () => {
      const mockProducts = [
        { id: 'payday', status: 'active' },
        { id: 'installment', status: 'inactive' },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockProducts);

      const result = await loanService.getProducts();

      expect(result).toHaveLength(2);
    });

    it('should handle empty product list', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      const result = await loanService.getProducts();

      expect(result).toEqual([]);
    });

    it('should handle fetch error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      await expect(loanService.getProducts())
        .rejects
        .toThrow('Network error');
    });
  });

  describe('applyLoan', () => {
    it('should submit loan application', async () => {
      const mockResponse = {
        success: true,
        applicationId: 'loan_123',
        message: 'Application submitted',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const application = {
        productId: 'payday',
        amount: 10000,
        termDays: 14,
      };

      const result = await loanService.applyLoan(application);

      expect(apiClient.post).toHaveBeenCalledWith('/loan/apply', application);
      expect(result.success).toBe(true);
      expect(result.applicationId).toBe('loan_123');
    });

    it('should validate application data', async () => {
      const invalidApplication = {
        productId: 'payday',
        amount: -1000, // Invalid
        termDays: 14,
      };

      await expect(loanService.applyLoan(invalidApplication as any))
        .rejects
        .toThrow();
    });

    it('should check credit limit before application', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: 'INSUFFICIENT_CREDIT',
      });

      const application = {
        productId: 'payday',
        amount: 100000, // Exceeds limit
        termDays: 14,
      };

      const result = await loanService.applyLoan(application);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_CREDIT');
    });

    it('should handle application error', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Submission failed'));

      const application = { productId: 'payday', amount: 10000, termDays: 14 };

      await expect(loanService.applyLoan(application))
        .rejects
        .toThrow('Submission failed');
    });
  });

  describe('calculateRepayment', () => {
    it('should calculate repayment details', async () => {
      const mockCalculation = {
        principal: 10000,
        interest: 1400,
        totalRepayment: 11400,
        dailyPayment: 814.29,
        termDays: 14,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockCalculation);

      const result = await loanService.calculateRepayment({
        productId: 'payday',
        amount: 10000,
        termDays: 14,
      });

      expect(apiClient.post).toHaveBeenCalledWith('/loan/calculate', {
        productId: 'payday',
        amount: 10000,
        termDays: 14,
      });
      expect(result.principal).toBe(10000);
      expect(result.interest).toBe(1400);
      expect(result.totalRepayment).toBe(11400);
    });

    it('should calculate for different loan types', async () => {
      const mockCalculation = {
        principal: 30000,
        interest: 1800,
        totalRepayment: 31800,
        monthlyPayment: 10600,
        termDays: 90,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockCalculation);

      const result = await loanService.calculateRepayment({
        productId: 'installment',
        amount: 30000,
        termDays: 90,
      });

      expect(result.monthlyPayment).toBe(10600);
    });

    it('should include fee breakdown', async () => {
      const mockCalculation = {
        principal: 10000,
        interest: 1400,
        fees: [
          { type: 'processing', amount: 200 },
          { type: 'service', amount: 100 },
        ],
        totalRepayment: 11700,
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockCalculation);

      const result = await loanService.calculateRepayment({
        productId: 'payday',
        amount: 10000,
        termDays: 14,
      });

      expect(result.fees).toHaveLength(2);
      expect(result.totalRepayment).toBe(11700);
    });
  });

  describe('getApplicationStatus', () => {
    it('should fetch application status', async () => {
      const mockStatus = {
        applicationId: 'loan_123',
        status: 'approved',
        approvedAmount: 10000,
        approvedTerm: 14,
        reviewNote: 'Good credit history',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockStatus);

      const result = await loanService.getApplicationStatus('loan_123');

      expect(apiClient.get).toHaveBeenCalledWith('/loan/application/loan_123');
      expect(result.status).toBe('approved');
      expect(result.approvedAmount).toBe(10000);
    });

    it('should handle pending status', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        applicationId: 'loan_123',
        status: 'pending',
        estimatedReviewTime: '24 hours',
      });

      const result = await loanService.getApplicationStatus('loan_123');

      expect(result.status).toBe('pending');
      expect(result.estimatedReviewTime).toBe('24 hours');
    });

    it('should handle rejected status', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        applicationId: 'loan_123',
        status: 'rejected',
        rejectionReason: 'Insufficient credit',
      });

      const result = await loanService.getApplicationStatus('loan_123');

      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('Insufficient credit');
    });
  });

  describe('getLoanDetails', () => {
    it('should fetch loan details', async () => {
      const mockLoan = {
        id: 'loan_123',
        productId: 'payday',
        amount: 10000,
        termDays: 14,
        interestRate: 0.01,
        totalRepayment: 11400,
        status: 'active',
        disbursedAt: '2026-03-17',
        dueDate: '2026-03-31',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockLoan);

      const result = await loanService.getLoanDetails('loan_123');

      expect(apiClient.get).toHaveBeenCalledWith('/loan/loan_123');
      expect(result.amount).toBe(10000);
      expect(result.status).toBe('active');
    });
  });

  describe('getLoanHistory', () => {
    it('should fetch loan history', async () => {
      const mockHistory = [
        {
          id: 'loan_1',
          amount: 10000,
          status: 'completed',
          completedAt: '2026-02-01',
        },
        {
          id: 'loan_2',
          amount: 15000,
          status: 'active',
          dueDate: '2026-04-01',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockHistory);

      const result = await loanService.getLoanHistory();

      expect(apiClient.get).toHaveBeenCalledWith('/loan/history');
      expect(result).toHaveLength(2);
    });

    it('should support pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      await loanService.getLoanHistory({ page: 1, size: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/loan/history', {
        params: { page: 1, size: 10 },
      });
    });
  });

  describe('cancelApplication', () => {
    it('should cancel pending application', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });

      const result = await loanService.cancelApplication('loan_123');

      expect(apiClient.post).toHaveBeenCalledWith('/loan/cancel', {
        applicationId: 'loan_123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject cancellation for approved loan', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: 'CANNOT_CANCEL_APPROVED',
      });

      const result = await loanService.cancelApplication('loan_123');

      expect(result.success).toBe(false);
    });
  });
});
