import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreditLimitAdjuster from '../../src/renderer/components/CreditLimitAdjuster';

// Mock onAdjustmentSubmit function
const mockOnAdjustmentSubmit = vi.fn();
const mockOnCancelled = vi.fn();

describe('CreditLimitAdjuster Component', () => {
  const defaultProps = {
    userId: 'user123',
    currentLimit: 10000,
    onAdjustmentSubmit: mockOnAdjustmentSubmit,
    onCancelled: mockOnCancelled
  };

  beforeEach(() => {
    mockOnAdjustmentSubmit.mockClear();
    mockOnCancelled.mockClear();
  });

  it('renders correctly with current limit info', () => {
    render(<CreditLimitAdjuster {...defaultProps} />);

    expect(screen.getByText('信用额度调整')).toBeInTheDocument();
    expect(screen.getByText('当前额度:')).toBeInTheDocument();
    expect(screen.getByText('¥10,000')).toBeInTheDocument();
  });

  it('displays current limit correctly', () => {
    render(<CreditLimitAdjuster userId="user456" currentLimit={25000} onAdjustmentSubmit={mockOnAdjustmentSubmit} onCancelled={mockOnCancelled} />);

    expect(screen.getByText('¥25,000')).toBeInTheDocument();
  });

  it('allows user to input new limit and reason', async () => {
    render(<CreditLimitAdjuster {...defaultProps} />);

    const newLimitInput = screen.getByLabelText('新额度');
    const reasonTextarea = screen.getByLabelText('调整原因');
    const effectiveDateInput = screen.getByLabelText('生效日期');

    fireEvent.change(newLimitInput, { target: { value: '15000' } });
    fireEvent.change(reasonTextarea, { target: { value: 'Customer requested increase due to good payment history' } });

    expect(newLimitInput).toHaveValue(15000);
    expect(reasonTextarea).toHaveValue('Customer requested increase due to good payment history');
  });

  it('shows percentage and amount change', async () => {
    render(<CreditLimitAdjuster {...defaultProps} />);

    const newLimitInput = screen.getByLabelText('新额度');

    fireEvent.change(newLimitInput, { target: { value: '15000' } });

    await waitFor(() => {
      // Check that the change percentage is displayed (+50%)
      const changeElements = screen.getAllByText('+50.00%');
      expect(changeElements.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      // Check that the change amount is displayed (+¥5,000)
      const changeAmountElements = screen.getAllByText('+¥5,000');
      expect(changeAmountElements.length).toBeGreaterThan(0);
    });
  });

  it('validates form submission with required fields', async () => {
    render(<CreditLimitAdjuster {...defaultProps} />);

    const submitButton = screen.getByText('提交调整申请');
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('新额度不能与当前额度相同')).toBeInTheDocument();
    });
  });

  it('submits valid adjustment data', async () => {
    render(<CreditLimitAdjuster {...defaultProps} />);

    const newLimitInput = screen.getByLabelText('新额度');
    const reasonTextarea = screen.getByLabelText('调整原因');
    const effectiveDateInput = screen.getByLabelText('生效日期');
    const submitButton = screen.getByText('提交调整申请');

    fireEvent.change(newLimitInput, { target: { value: '15000' } });
    fireEvent.change(reasonTextarea, { target: { value: 'Customer has demonstrated excellent repayment history and deserves a higher limit.' } });
    // 设置一个有效的日期格式 - 使用与组件中相同的格式
    const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16); // 明天
    fireEvent.change(effectiveDateInput, { target: { value: futureDate } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAdjustmentSubmit).toHaveBeenCalledWith({
        userId: 'user123',
        currentLimit: 10000,
        newLimit: 15000,
        reason: 'Customer has demonstrated excellent repayment history and deserves a higher limit.',
        effectiveDate: futureDate,
        status: 'pending'
      });
    });
  });

  it('calls onCancelled when cancel button is clicked', () => {
    render(<CreditLimitAdjuster {...defaultProps} />);

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnCancelled).toHaveBeenCalled();
  });

  it('prevents submitting identical new and current limits', async () => {
    render(<CreditLimitAdjuster {...defaultProps} />);

    const newLimitInput = screen.getByLabelText('新额度');
    const reasonTextarea = screen.getByLabelText('调整原因');
    const submitButton = screen.getByText('提交调整申请');

    // Set new limit equal to current limit
    fireEvent.change(newLimitInput, { target: { value: '10000' } });
    fireEvent.change(reasonTextarea, { target: { value: 'Customer has demonstrated excellent repayment history and deserves a higher limit.' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('新额度不能与当前额度相同')).toBeInTheDocument();
    });
  });

  it('shows positive and negative change indicators', async () => {
    render(<CreditLimitAdjuster {...defaultProps} />);

    const newLimitInput = screen.getByLabelText('新额度');

    // Test with higher limit (should show positive change)
    fireEvent.change(newLimitInput, { target: { value: '15000' } });

    await waitFor(() => {
      const positiveElements = screen.getAllByText('+50.00%');
      expect(positiveElements.length).toBeGreaterThan(0);
    });

    // Test with lower limit (should show negative change)
    fireEvent.change(newLimitInput, { target: { value: '8000' } });

    await waitFor(() => {
      const negativeElements = screen.getAllByText('-20.00%');
      expect(negativeElements.length).toBeGreaterThan(0);
    });
  });
});