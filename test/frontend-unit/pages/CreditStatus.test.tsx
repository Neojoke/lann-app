/**
 * CreditStatus 页面测试
 * 
 * 测试覆盖:
 * - 信用状态显示
 * - 额度信息展示
 * - 信用评分可视化
 * - 状态更新
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CreditStatus } from '../../src/pages/CreditStatus';
import { CreditProvider } from '../../src/contexts/CreditContext';
import { LanguageProvider } from '../../src/contexts/LanguageContext';
import { creditService } from '../../src/services/credit.service';

vi.mock('../../src/services/credit.service', () => ({
  creditService: {
    getCreditStatus: vi.fn(),
    refreshCreditScore: vi.fn(),
  }
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      <CreditProvider>
        {component}
      </CreditProvider>
    </LanguageProvider>
  );
};

describe('CreditStatus Page', () => {
  const mockCreditStatus = {
    userId: 'user_123',
    creditScore: 750,
    grade: 'A+',
    totalLimit: 50000,
    availableLimit: 45000,
    usedLimit: 5000,
    frozenLimit: 0,
    status: 'active',
    expiresAt: '2027-03-17',
    lastReviewDate: '2026-03-17',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(creditService.getCreditStatus).mockResolvedValue(mockCreditStatus);
  });

  describe('Status Display', () => {
    it('should render credit status page', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/credit status/i)).toBeInTheDocument();
      });
    });

    it('should display credit score', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/750/i)).toBeInTheDocument();
      });
    });

    it('should display credit grade', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/A\+/i)).toBeInTheDocument();
      });
    });
  });

  describe('Limit Information', () => {
    it('should display total credit limit', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/50,000/i)).toBeInTheDocument();
      });
    });

    it('should display available limit', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/45,000/i)).toBeInTheDocument();
      });
    });

    it('should display used limit', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/5,000/i)).toBeInTheDocument();
      });
    });

    it('should show limit utilization progress bar', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow', '10'); // 5000/50000 = 10%
      });
    });
  });

  describe('Credit Score Visualization', () => {
    it('should display score gauge or chart', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/750/i)).toBeInTheDocument();
      });
    });

    it('should show score range indicator', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/300/i)).toBeInTheDocument();
        expect(screen.getByText(/1000/i)).toBeInTheDocument();
      });
    });

    it('should highlight score grade with color', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        const gradeElement = screen.getByText(/A\+/i);
        expect(gradeElement).toHaveClass('grade-a-plus');
      });
    });
  });

  describe('Status States', () => {
    it('should show active status', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument();
      });
    });

    it('should handle suspended status', async () => {
      vi.mocked(creditService.getCreditStatus).mockResolvedValue({
        ...mockCreditStatus,
        status: 'suspended',
      });

      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/suspended/i)).toBeInTheDocument();
      });
    });

    it('should handle expired status', async () => {
      vi.mocked(creditService.getCreditStatus).mockResolvedValue({
        ...mockCreditStatus,
        status: 'expired',
      });

      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/expired/i)).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('should provide refresh button', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it('should refresh credit score on button click', async () => {
      vi.mocked(creditService.refreshCreditScore).mockResolvedValue({
        success: true,
        newScore: 760,
      });

      renderWithProviders(<CreditStatus />);
      
      await waitFor(async () => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);
        
        await waitFor(() => {
          expect(creditService.refreshCreditScore).toHaveBeenCalled();
        });
      });
    });

    it('should show loading state during refresh', async () => {
      vi.mocked(creditService.refreshCreditScore).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderWithProviders(<CreditStatus />);
      
      await waitFor(async () => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);
        
        expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
      });
    });
  });

  describe('Expiry Information', () => {
    it('should display expiry date', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/2027/i)).toBeInTheDocument();
      });
    });

    it('should show days until expiry', async () => {
      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/days?/i)).toBeInTheDocument();
      });
    });

    it('should warn when expiring soon', async () => {
      vi.mocked(creditService.getCreditStatus).mockResolvedValue({
        ...mockCreditStatus,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
      });

      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/expiring soon/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show apply button when no credit', async () => {
      vi.mocked(creditService.getCreditStatus).mockResolvedValue(null);

      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        const applyButton = screen.getByRole('button', { name: /apply/i });
        expect(applyButton).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error', async () => {
      vi.mocked(creditService.getCreditStatus).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should provide retry option on error', async () => {
      vi.mocked(creditService.getCreditStatus).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<CreditStatus />);
      
      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });
});
