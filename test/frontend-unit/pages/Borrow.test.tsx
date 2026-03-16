/**
 * Borrow 页面测试
 * 
 * 测试覆盖:
 * - 借款申请表单
 * - 产品选择
 * - 金额和期限计算
 * - 还款计划预览
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Borrow } from '../../src/pages/Borrow';
import { LoanProvider } from '../../src/contexts/LoanContext';
import { LanguageProvider } from '../../src/contexts/LanguageContext';
import { loanService } from '../../src/services/loan.service';

vi.mock('../../src/services/loan.service', () => ({
  loanService: {
    getProducts: vi.fn(),
    applyLoan: vi.fn(),
    calculateRepayment: vi.fn(),
  }
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      <LoanProvider>
        {component}
      </LoanProvider>
    </LanguageProvider>
  );
};

describe('Borrow Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loanService.getProducts).mockResolvedValue([
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
    ]);
  });

  describe('Product Selection', () => {
    it('should display available loan products', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        expect(screen.getByText(/payday/i)).toBeInTheDocument();
        expect(screen.getByText(/installment/i)).toBeInTheDocument();
      });
    });

    it('should allow product selection', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        const paydayOption = screen.getByText(/payday/i);
        fireEvent.click(paydayOption);
        expect(paydayOption).toHaveClass('selected');
      });
    });
  });

  describe('Amount Input', () => {
    it('should validate minimum amount', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        const amountInput = screen.getByLabelText(/amount/i);
        fireEvent.change(amountInput, { target: { value: '500' } });
        
        const submitButton = screen.getByRole('button', { name: /apply/i });
        fireEvent.click(submitButton);
        
        expect(screen.getByText(/minimum amount/i)).toBeInTheDocument();
      });
    });

    it('should validate maximum amount', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        const amountInput = screen.getByLabelText(/amount/i);
        fireEvent.change(amountInput, { target: { value: '100000' } });
        
        const submitButton = screen.getByRole('button', { name: /apply/i });
        fireEvent.click(submitButton);
        
        expect(screen.getByText(/maximum amount/i)).toBeInTheDocument();
      });
    });

    it('should update repayment preview on amount change', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        const amountInput = screen.getByLabelText(/amount/i);
        fireEvent.change(amountInput, { target: { value: '10000' } });
        
        expect(screen.getByText(/10,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Term Selection', () => {
    it('should display available terms', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        expect(screen.getByText(/7 days/i)).toBeInTheDocument();
        expect(screen.getByText(/14 days/i)).toBeInTheDocument();
        expect(screen.getByText(/30 days/i)).toBeInTheDocument();
      });
    });

    it('should update interest calculation on term change', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        const termOption = screen.getByText(/14 days/i);
        fireEvent.click(termOption);
        
        expect(screen.getByText(/interest/i)).toBeInTheDocument();
      });
    });
  });

  describe('Repayment Preview', () => {
    it('should show repayment breakdown', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        const amountInput = screen.getByLabelText(/amount/i);
        fireEvent.change(amountInput, { target: { value: '10000' } });
        
        const termOption = screen.getByText(/14 days/i);
        fireEvent.click(termOption);
        
        expect(screen.getByText(/total repayment/i)).toBeInTheDocument();
        expect(screen.getByText(/interest/i)).toBeInTheDocument();
      });
    });

    it('should calculate daily payment for payday loan', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        const amountInput = screen.getByLabelText(/amount/i);
        fireEvent.change(amountInput, { target: { value: '10000' } });
        
        expect(screen.getByText(/daily payment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Application Submission', () => {
    it('should submit loan application', async () => {
      vi.mocked(loanService.applyLoan).mockResolvedValue({
        success: true,
        applicationId: 'loan_123',
      });

      renderWithProviders(<Borrow />);
      
      await waitFor(async () => {
        const amountInput = screen.getByLabelText(/amount/i);
        fireEvent.change(amountInput, { target: { value: '10000' } });
        
        const submitButton = screen.getByRole('button', { name: /apply/i });
        fireEvent.click(submitButton);
        
        await waitFor(() => {
          expect(loanService.applyLoan).toHaveBeenCalled();
        });
      });
    });

    it('should check credit limit before application', async () => {
      renderWithProviders(<Borrow />);
      
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /apply/i });
        fireEvent.click(submitButton);
        
        expect(screen.getByText(/credit limit/i)).toBeInTheDocument();
      });
    });
  });
});
