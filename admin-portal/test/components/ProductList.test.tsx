import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductList from '../../src/renderer/components/ProductList';
import { ProductType } from '../../src/renderer/components/ProductConfig';

// Mock callback functions
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnStatusToggle = vi.fn();

describe('ProductList Component', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Personal Loan',
      type: ProductType.PERSONAL,
      interestRate: 5.5,
      fees: 100,
      terms: [12, 24, 36],
      status: 'active' as const,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    },
    {
      id: '2',
      name: 'Business Loan',
      type: ProductType.BUSINESS,
      interestRate: 7.2,
      fees: 200,
      terms: [12, 24, 36, 48],
      status: 'inactive' as const,
      createdAt: '2023-01-03T00:00:00Z',
      updatedAt: '2023-01-04T00:00:00Z'
    }
  ];

  it('renders correctly with products', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    expect(screen.getByText('产品列表')).toBeInTheDocument();
    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.getByText('Business Loan')).toBeInTheDocument();
    expect(screen.getByText('个人贷款', { selector: 'td' })).toBeInTheDocument();
    expect(screen.getByText('商业贷款', { selector: 'td' })).toBeInTheDocument();
  });

  it('displays product information correctly', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    // Check that product details are displayed
    expect(screen.getByText('5.5%')).toBeInTheDocument();
    expect(screen.getByText('¥100')).toBeInTheDocument();
    expect(screen.getByText('7.2%')).toBeInTheDocument();
    expect(screen.getByText('¥200')).toBeInTheDocument();

    // Check term badges
    expect(screen.getAllByText('12个月')).toHaveLength(2); // 出现在两个产品中
    expect(screen.getAllByText('24个月')).toHaveLength(2); // 出现在两个产品中
    expect(screen.getAllByText('36个月')).toHaveLength(2); // 出现在两个产品中
  });

  it('shows status badges correctly', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    expect(screen.getAllByText('启用')).toHaveLength(1); // 只有一个产品是启用状态
    expect(screen.getAllByText('禁用')).toHaveLength(1); // 只有一个产品是禁用状态
  });

  it('handles edit action', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    const editButtons = screen.getAllByRole('button', { name: '编辑' });
    fireEvent.click(editButtons[1]); // 第二个产品是Personal Loan (id: '1')

    expect(mockOnEdit).toHaveBeenCalledWith(mockProducts[0]); // Personal Loan (id: '1')
  });

  it('handles delete action', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: '删除' });
    fireEvent.click(deleteButtons[0]); // 第一个产品是Business Loan (id: '2')

    expect(mockOnDelete).toHaveBeenCalledWith('2');
  });

  it('handles status toggle action', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    const toggleButtons = screen.getAllByRole('button', { name: '禁用' }); // The button text for active items is "禁用"
    fireEvent.click(toggleButtons[0]); // Click on the first item which is active (Personal Loan, id: '1')

    expect(mockOnStatusToggle).toHaveBeenCalledWith('1', 'inactive');
  });

  it('filters products by search term', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    const searchInput = screen.getByPlaceholderText('搜索产品名称...');
    fireEvent.change(searchInput, { target: { value: 'Personal' } });

    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.queryByText('Business Loan')).not.toBeInTheDocument();
  });

  it('filters products by type', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    const typeSelect = screen.getAllByRole('combobox')[0]; // First select is type
    fireEvent.change(typeSelect, { target: { value: ProductType.PERSONAL } });

    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.queryByText('Business Loan')).not.toBeInTheDocument();
  });

  it('filters products by status', () => {
    render(
      <ProductList 
        products={[...mockProducts]} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    const statusSelect = screen.getAllByRole('combobox')[1]; // Second select is status
    fireEvent.change(statusSelect, { target: { value: 'active' } });

    expect(screen.getByText('Personal Loan')).toBeInTheDocument();
    expect(screen.queryByText('Business Loan')).not.toBeInTheDocument();
  });

  it('shows no data message when no products match filters', () => {
    render(
      <ProductList 
        products={[]} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    expect(screen.getByText('没有找到符合条件的产品')).toBeInTheDocument();
  });

  it('displays statistics correctly', () => {
    render(
      <ProductList 
        products={mockProducts} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    expect(screen.getByText('总数: 2')).toBeInTheDocument();
    expect(screen.getByText('启用: 1')).toBeInTheDocument();
    expect(screen.getByText('禁用: 1')).toBeInTheDocument();
  });

  it('sorts products by clicking on headers', () => {
    const productsWithDifferentNames = [
      {
        ...mockProducts[0],
        id: '3',
        name: 'Z-Product',
        interestRate: 4.0
      },
      {
        ...mockProducts[1],
        id: '4',
        name: 'A-Product',
        interestRate: 8.0
      }
    ];

    render(
      <ProductList 
        products={productsWithDifferentNames} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        onStatusToggle={mockOnStatusToggle} 
      />
    );

    // Initially sorted by name ascending: A-Product, Z-Product
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]; // Skip header row
    expect(firstDataRow).toHaveTextContent('A-Product');

    // Click name header to sort descending
    const nameHeader = screen.getByText('产品名称');
    fireEvent.click(nameHeader);

    // After click, should be sorted descending: Z-Product, A-Product
    const updatedRows = screen.getAllByRole('row');
    const updatedFirstDataRow = updatedRows[1];
    expect(updatedFirstDataRow).toHaveTextContent('Z-Product');

    // Click interest rate header to sort by interest rate
    const rateHeader = screen.getByText('利率 (%)');
    fireEvent.click(rateHeader);

    // Now sorted by interest rate ascending: Z-Product (4.0%), A-Product (8.0%)
    expect(firstRow).toHaveTextContent('Z-Product');
  });
});