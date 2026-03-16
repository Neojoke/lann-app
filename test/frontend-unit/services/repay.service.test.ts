/**
 * Repay Service 测试
 * 
 * 测试覆盖:
 * - 还款计划获取
 * - 还款创建
 * - 罚息计算
 * - 提前还款
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { repayService } from '../../src/services/repay.service';
import { apiClient } from '../../src/utils/api';

vi.mock('../../src/utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('Repay Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRepaymentSchedule', () => {
    it('should fetch repayment schedule', async () => {
      const mockSchedule = {
        loanId: 'loan_123',
        principal: 10000,
        totalInterest: 1400,
        totalRepayment: 11400,
        remainingAmount: 11400,
        installments: [
          {
            number: 1,
            dueDate: '2026-03-31',
            principal: 10000,
            interest: 1400,
            total: 11400,
            status: 'pending',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockSchedule);

      const result = await repayService.getRepaymentSchedule('loan_123');

      expect(apiClient.get).toHaveBeenCalledWith('/repayment/schedule/loan_123');
      expect(result.loanId).toBe('loan_123');
      expect(result.installments).toHaveLength(1);
    });

    it('should handle completed schedule', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        loanId: 'loan_123',
        remainingAmount: 0,
        status: 'completed',
        installments: [
          { number: 1, status: 'paid', paidAt: '2026-03-30' },
        ],
      });

      const result = await repayService.getRepaymentSchedule('loan_123');

      expect(result.status).toBe('completed');
      expect(result.remainingAmount).toBe(0);
    });

    it('should include penalty information', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        loanId: 'loan_123',
        remainingAmount: 11400,
        penaltyAmount: 250,
        overdueDays: 5,
        installments: [
          {
            number: 1,
            dueDate: '2026-03-25',
            status: 'overdue',
            penalty: 250,
          },
        ],
      });

      const result = await repayService.getRepaymentSchedule('loan_123');

      expect(result.penaltyAmount).toBe(250);
      expect(result.overdueDays).toBe(5);
    });
  });

  describe('createRepayment', () => {
    it('should create repayment', async () => {
      const mockResponse = {
        success: true,
        repaymentId: 'repay_123',
        amount: 5000,
        method: 'promptpay',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await repayService.createRepayment({
        loanId: 'loan_123',
        amount: 5000,
        method: 'promptpay',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/repayment/create', {
        loanId: 'loan_123',
        amount: 5000,
        method: 'promptpay',
      });
      expect(result.success).toBe(true);
      expect(result.repaymentId).toBe('repay_123');
    });

    it('should validate repayment amount', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: 'INVALID_AMOUNT',
      });

      const result = await repayService.createRepayment({
        loanId: 'loan_123',
        amount: -1000,
        method: 'promptpay',
      });

      expect(result.success).toBe(false);
    });

    it('should handle insufficient funds', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        error: 'INSUFFICIENT_FUNDS',
      });

      const result = await repayService.createRepayment({
        loanId: 'loan_123',
        amount: 100000,
        method: 'bank_transfer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('INSUFFICIENT_FUNDS');
    });

    it('should allocate repayment correctly', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        allocation: {
          penalty: 100,
          interest: 200,
          principal: 4700,
        },
      });

      const result = await repayService.createRepayment({
        loanId: 'loan_123',
        amount: 5000,
        method: 'promptpay',
      });

      expect(result.allocation).toBeDefined();
      expect(result.allocation?.penalty).toBe(100);
    });
  });

  describe('calculatePenalty', () => {
    it('should calculate penalty for overdue loan', async () => {
      const mockPenalty = {
        loanId: 'loan_123',
        overdueDays: 5,
        penaltyAmount: 250,
        dailyRate: 0.005,
        breakdown: [
          { days: 5, rate: 0.005, amount: 250 },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPenalty);

      const result = await repayService.calculatePenalty('loan_123');

      expect(apiClient.get).toHaveBeenCalledWith('/repayment/penalty/loan_123');
      expect(result.penaltyAmount).toBe(250);
      expect(result.overdueDays).toBe(5);
    });

    it('should return zero penalty for current loan', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        loanId: 'loan_123',
        overdueDays: 0,
        penaltyAmount: 0,
      });

      const result = await repayService.calculatePenalty('loan_123');

      expect(result.penaltyAmount).toBe(0);
    });

    it('should apply penalty cap', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        loanId: 'loan_123',
        overdueDays: 100,
        penaltyAmount: 2000, // Capped at 20%
        penaltyCap: 2000,
      });

      const result = await repayService.calculatePenalty('loan_123');

      expect(result.penaltyAmount).toBe(2000);
      expect(result.penaltyCap).toBe(2000);
    });
  });

  describe('prepayLoan', () => {
    it('should calculate prepayment amount', async () => {
      const mockPrepayment = {
        loanId: 'loan_123',
        remainingPrincipal: 10000,
        accruedInterest: 500,
        prepaymentFee: 0,
        totalDue: 10500,
        interestSaved: 900,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPrepayment);

      const result = await repayService.getPrepaymentQuote('loan_123');

      expect(apiClient.get).toHaveBeenCalledWith('/repayment/prepayment/loan_123');
      expect(result.remainingPrincipal).toBe(10000);
      expect(result.interestSaved).toBe(900);
    });

    it('should execute prepayment', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        repaymentId: 'prepay_123',
        amount: 10500,
      });

      const result = await repayService.prepayLoan('loan_123');

      expect(apiClient.post).toHaveBeenCalledWith('/repayment/prepay', {
        loanId: 'loan_123',
      });
      expect(result.success).toBe(true);
    });

    it('should check prepayment eligibility', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        allowed: true,
        reason: null,
      });

      const result = await repayService.checkPrepaymentEligibility('loan_123');

      expect(result.allowed).toBe(true);
    });

    it('should reject prepayment for completed loan', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        allowed: false,
        reason: 'Loan already completed',
      });

      const result = await repayService.checkPrepaymentEligibility('loan_123');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('completed');
    });
  });

  describe('getRepaymentMethods', () => {
    it('should fetch available repayment methods', async () => {
      const mockMethods = [
        {
          id: 'promptpay',
          name: { en: 'PromptPay', th: 'พร้อมเพย์' },
          type: 'instant',
          available: true,
        },
        {
          id: 'bank_transfer',
          name: { en: 'Bank Transfer', th: 'โอนเงิน' },
          type: 'transfer',
          available: true,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockMethods);

      const result = await repayService.getRepaymentMethods();

      expect(apiClient.get).toHaveBeenCalledWith('/repayment/methods');
      expect(result).toHaveLength(2);
    });
  });

  describe('getRepaymentHistory', () => {
    it('should fetch repayment history', async () => {
      const mockHistory = [
        {
          repaymentId: 'repay_1',
          loanId: 'loan_123',
          amount: 5000,
          method: 'promptpay',
          status: 'completed',
          createdAt: '2026-03-10',
        },
        {
          repaymentId: 'repay_2',
          loanId: 'loan_123',
          amount: 6400,
          method: 'bank_transfer',
          status: 'completed',
          createdAt: '2026-03-20',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockHistory);

      const result = await repayService.getRepaymentHistory('loan_123');

      expect(apiClient.get).toHaveBeenCalledWith('/repayment/history/loan_123');
      expect(result).toHaveLength(2);
    });

    it('should support pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([]);

      await repayService.getRepaymentHistory('loan_123', { page: 1, size: 10 });

      expect(apiClient.get).toHaveBeenCalledWith('/repayment/history/loan_123', {
        params: { page: 1, size: 10 },
      });
    });
  });

  describe('setupAutoRepay', () => {
    it('should setup automatic repayment', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        autoRepayId: 'auto_123',
      });

      const result = await repayService.setupAutoRepay({
        loanId: 'loan_123',
        method: 'promptpay',
        scheduledDate: '2026-03-31',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/repayment/auto/setup', {
        loanId: 'loan_123',
        method: 'promptpay',
        scheduledDate: '2026-03-31',
      });
      expect(result.success).toBe(true);
    });

    it('should cancel auto repayment', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });

      const result = await repayService.cancelAutoRepay('auto_123');

      expect(apiClient.post).toHaveBeenCalledWith('/repayment/auto/cancel', {
        autoRepayId: 'auto_123',
      });
      expect(result.success).toBe(true);
    });
  });
});
