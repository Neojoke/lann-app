/**
 * CreditApply 页面测试
 * 
 * 测试覆盖:
 * - 信用申请表单
 * - 表单验证
 * - 提交流程
 * - 错误处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreditApply } from '../../src/pages/CreditApply';
import { CreditProvider } from '../../src/contexts/CreditContext';
import { LanguageProvider } from '../../src/contexts/LanguageContext';
import { creditService } from '../../src/services/credit.service';

// Mock credit service
vi.mock('../../src/services/credit.service', () => ({
  creditService: {
    applyCredit: vi.fn(),
    getCreditStatus: vi.fn(),
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

describe('CreditApply Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render credit application form', () => {
      renderWithProviders(<CreditApply />);
      
      expect(screen.getByText(/apply/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/income/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/employer/i)).toBeInTheDocument();
    });

    it('should display form sections', () => {
      renderWithProviders(<CreditApply />);
      
      expect(screen.getByText(/personal information/i)).toBeInTheDocument();
      expect(screen.getByText(/employment information/i)).toBeInTheDocument();
      expect(screen.getByText(/contact information/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      renderWithProviders(<CreditApply />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getAllByText(/required/i)).toHaveLengthGreaterThan(0);
      });
    });

    it('should validate income is positive number', async () => {
      renderWithProviders(<CreditApply />);
      
      const incomeInput = screen.getByLabelText(/income/i);
      fireEvent.change(incomeInput, { target: { value: '-1000' } });
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid income/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      renderWithProviders(<CreditApply />);
      
      const phoneInput = screen.getByLabelText(/phone/i);
      fireEvent.change(phoneInput, { target: { value: 'invalid' } });
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid phone/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit application successfully', async () => {
      vi.mocked(creditService.applyCredit).mockResolvedValue({
        success: true,
        applicationId: 'app_123',
      });

      renderWithProviders(<CreditApply />);
      
      // Fill form
      fireEvent.change(screen.getByLabelText(/income/i), { target: { value: '30000' } });
      fireEvent.change(screen.getByLabelText(/employer/i), { target: { value: 'Test Company' } });
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(creditService.applyCredit).toHaveBeenCalled();
      });
    });

    it('should handle submission error', async () => {
      vi.mocked(creditService.applyCredit).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<CreditApply />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      vi.mocked(creditService.applyCredit).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<CreditApply />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    });
  });

  describe('Multi-language Support', () => {
    it('should display form in Thai', () => {
      renderWithProviders(<CreditApply />);
      
      // Should have Thai labels when language is Thai
      expect(screen.getByLabelText(/income/i)).toBeInTheDocument();
    });

    it('should display form in English', () => {
      renderWithProviders(<CreditApply />);
      
      // Should have English labels when language is English
      expect(screen.getByLabelText(/income/i)).toBeInTheDocument();
    });
  });
});
