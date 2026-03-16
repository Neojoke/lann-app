import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoanReviewer, { LoanDetails, ReviewStatus } from '../../src/renderer/components/LoanReviewer';

// Mock onReviewSubmit function
const mockOnReviewSubmit = vi.fn();

describe('LoanReviewer Component', () => {
  const loanDetails: LoanDetails = {
    id: '1',
    applicantName: 'John Doe',
    loanAmount: 50000,
    loanTerm: 24,
    interestRate: 5.5,
    applicationDate: new Date().toISOString(),
    status: ReviewStatus.PENDING,
    creditScore: 750,
    employmentStatus: 'Employed',
    income: 80000
  };

  const reviewers = ['Admin', 'Manager'];

  beforeEach(() => {
    mockOnReviewSubmit.mockClear();
  });

  it('renders correctly with loan details', () => {
    render(
      <LoanReviewer 
        loanId="1" 
        initialLoanDetails={loanDetails} 
        onReviewSubmit={mockOnReviewSubmit}
        reviewers={reviewers}
      />
    );

    expect(screen.getByText('贷款审核')).toBeInTheDocument();
    expect(screen.getByText('John Doe', { selector: '.detail-item' })).toBeInTheDocument();
    expect(screen.getByText('¥50,000')).toBeInTheDocument();
    expect(screen.getByText('24个月')).toBeInTheDocument();
    expect(screen.getByText('5.5%')).toBeInTheDocument();
  });

  it('displays loan details correctly', () => {
    render(
      <LoanReviewer 
        loanId="1" 
        initialLoanDetails={loanDetails} 
        onReviewSubmit={mockOnReviewSubmit}
        reviewers={reviewers}
      />
    );

    const detailsGrid = screen.getByTestId('loan-details-grid'); // We'll need to add this test ID
    
    // The details should be displayed in the component
    expect(screen.getByText('申请人:')).toBeInTheDocument();
    expect(screen.getByText('John Doe', { selector: '.detail-item' })).toBeInTheDocument();
    expect(screen.getByText('贷款金额:')).toBeInTheDocument();
    expect(screen.getByText('¥50,000')).toBeInTheDocument();
    expect(screen.getByText('贷款期限:')).toBeInTheDocument();
    expect(screen.getByText('24个月')).toBeInTheDocument();
    expect(screen.getByText(/利率: 5.5%/)).toBeInTheDocument();
    expect(screen.getByText(/信用评分: 750/)).toBeInTheDocument();
    expect(screen.getByText(/就业状况: Employed/)).toBeInTheDocument();
  });

  it('allows reviewer to select action and submit', async () => {
    render(
      <LoanReviewer 
        loanId="1" 
        initialLoanDetails={loanDetails} 
        onReviewSubmit={mockOnReviewSubmit}
        reviewers={reviewers}
      />
    );

    // Select reject action
    const rejectRadio = screen.getByLabelText('拒绝');
    fireEvent.click(rejectRadio);

    // Add comment
    const commentTextarea = screen.getByLabelText('审核意见');
    fireEvent.change(commentTextarea, { target: { value: 'Insufficient income' } });

    // Submit
    const submitButton = screen.getByText('拒绝申请');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnReviewSubmit).toHaveBeenCalledWith({
        status: ReviewStatus.REJECTED,
        comment: 'Insufficient income',
        action: 'reject'
      });
    });
  });

  it('allows reviewer to approve loan', async () => {
    render(
      <LoanReviewer 
        loanId="1" 
        initialLoanDetails={loanDetails} 
        onReviewSubmit={mockOnReviewSubmit}
        reviewers={reviewers}
      />
    );

    // Select approve action
    const approveRadio = screen.getByLabelText('批准');
    fireEvent.click(approveRadio);

    // Add comment
    const commentTextarea = screen.getByLabelText('审核意见');
    fireEvent.change(commentTextarea, { target: { value: 'Approved based on good credit score' } });

    // Submit
    const submitButton = screen.getByText('批准申请');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnReviewSubmit).toHaveBeenCalledWith({
        status: ReviewStatus.APPROVED,
        comment: 'Approved based on good credit score',
        action: 'approve'
      });
    });
  });

  it('allows reviewer to request more information', async () => {
    render(
      <LoanReviewer 
        loanId="1" 
        initialLoanDetails={loanDetails} 
        onReviewSubmit={mockOnReviewSubmit}
        reviewers={reviewers}
      />
    );

    // Select request info action
    const requestInfoRadio = screen.getByLabelText('补充材料');
    fireEvent.click(requestInfoRadio);

    // Add comment
    const commentTextarea = screen.getByLabelText('审核意见');
    fireEvent.change(commentTextarea, { target: { value: 'Please provide additional income proof' } });

    // Submit
    const submitButton = screen.getByText('要求补充材料');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnReviewSubmit).toHaveBeenCalledWith({
        status: ReviewStatus.NEEDS_INFO,
        comment: 'Please provide additional income proof',
        action: 'request_info'
      });
    });
  });

  it('formats dates correctly', () => {
    render(
      <LoanReviewer 
        loanId="1" 
        initialLoanDetails={loanDetails} 
        onReviewSubmit={mockOnReviewSubmit}
        reviewers={reviewers}
      />
    );

    // Check if the application date is formatted correctly
    const formattedDate = new Date(loanDetails.applicationDate).toLocaleString('zh-CN');
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });
});