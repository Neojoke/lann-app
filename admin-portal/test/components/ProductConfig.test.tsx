import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductConfig, { ProductType, ProductFormData } from '../../src/renderer/components/ProductConfig';

// Mock onSubmit function
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

describe('ProductConfig Component', () => {
  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders correctly with default values', () => {
    render(<ProductConfig {...defaultProps} />);
    
    expect(screen.getByText('产品配置')).toBeInTheDocument();
    expect(screen.getByLabelText('产品名称 *')).toBeInTheDocument();
    expect(screen.getByLabelText('产品类型')).toBeInTheDocument();
    expect(screen.getByLabelText('利率 (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('费用')).toBeInTheDocument();
    expect(screen.getByText('期限选项 (月)')).toBeInTheDocument();
  });

  it('renders with initial data', () => {
    const initialData = {
      name: 'Test Product',
      type: ProductType.PERSONAL,
      interestRate: 5.5,
      fees: 100,
      terms: [12, 24],
      status: 'active' as const
    };

    render(<ProductConfig initialData={initialData} onSubmit={mockOnSubmit} />);

    expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('allows adding new terms', async () => {
    render(<ProductConfig {...defaultProps} />);

    const termInput = screen.getByPlaceholderText('输入期限值');
    const addButton = screen.getByText('添加');

    fireEvent.change(termInput, { target: { value: '48' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('48个月')).toBeInTheDocument();
    });
  });

  it('validates form submission', async () => {
    render(<ProductConfig {...defaultProps} />);

    const nameInput = screen.getByLabelText('产品名称 *');
    const rateInput = screen.getByLabelText('利率 (%)');
    const feesInput = screen.getByLabelText('费用');
    const submitButton = screen.getByText('保存');

    // Submit with empty form to trigger validation
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('产品名称不能为空')).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(nameInput, { target: { value: 'Test Product' } });
    fireEvent.change(rateInput, { target: { value: '5' } });
    fireEvent.change(feesInput, { target: { value: '100' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Product',
        type: ProductType.PERSONAL,
        interestRate: 5,
        fees: 100,
        terms: [12, 24, 36], // Default terms
        status: 'inactive'
      });
    });
  });

  it('handles radio button status selection', () => {
    render(<ProductConfig {...defaultProps} />);

    const activeRadio = screen.getByLabelText('启用');
    const inactiveRadio = screen.getByLabelText('禁用');

    expect(inactiveRadio).toBeChecked();

    fireEvent.click(activeRadio);
    expect(activeRadio).toBeChecked();
    expect(inactiveRadio).not.toBeChecked();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ProductConfig {...defaultProps} />);

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});