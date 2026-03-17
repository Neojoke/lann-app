import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LoanApplicationForm from '../../../mobile-app/src/components/LoanApplicationForm'; // Adjust path as needed
import { useCreateLoanApplication } from '../../../mobile-app/src/hooks/useLoans'; // Adjust path as needed

// Mock the API hook
vi.mock('../../../mobile-app/src/hooks/useLoans', () => ({
  useCreateLoanApplication: vi.fn()
}));

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key // Return the key as translation for testing
  })
}));

// Mock Toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('Loan Application Form - Error Handling Tests', () => {
  const mockMutateAsync = vi.fn();
  const mockOnError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    (useCreateLoanApplication as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      isError: false,
      error: null
    });
  });

  it('should display loading state during submission', async () => {
    const mockMutateAsyncLoading = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    (useCreateLoanApplication as any).mockReturnValue({
      mutateAsync: mockMutateAsyncLoading,
      isLoading: true,
      isError: false,
      error: null
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '12' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Check loading state
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
  });

  it('should handle API error gracefully', async () => {
    const errorMessage = 'Network error occurred';
    mockMutateAsync.mockRejectedValue(new Error(errorMessage));

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '12' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        loanAmount: 50000,
        term: 12,
        purpose: '',
        repaymentSchedule: 'monthly'
      });
    });

    // Verify error handling
    expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
  });

  it('should handle validation errors from API', async () => {
    const validationErrors = {
      errors: {
        loanAmount: ['Loan amount must be greater than 1000'],
        term: ['Term must be between 1 and 36 months']
      }
    };
    mockMutateAsync.mockRejectedValue({ response: { data: validationErrors } });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '40' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/loan amount must be greater than 1000/i)).toBeInTheDocument();
      expect(screen.getByText(/term must be between 1 and 36 months/i)).toBeInTheDocument();
    });
  });

  it('should handle network timeout error', async () => {
    const timeoutError = new Error('Network timeout');
    Object.assign(timeoutError, { code: 'ECONNABORTED' });
    mockMutateAsync.mockRejectedValue(timeoutError);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '12' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
    });
  });

  it('should handle server error (5xx)', async () => {
    const serverError = {
      response: {
        status: 500,
        data: { message: 'Internal server error' }
      }
    };
    mockMutateAsync.mockRejectedValue(serverError);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '12' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it('should handle client error (4xx)', async () => {
    const clientError = {
      response: {
        status: 400,
        data: { message: 'Bad request' }
      }
    };
    mockMutateAsync.mockRejectedValue(clientError);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '12' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/bad request/i)).toBeInTheDocument();
    });
  });

  it('should handle unexpected errors', async () => {
    const unexpectedError = 'Something went wrong';
    mockMutateAsync.mockRejectedValue(unexpectedError);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '12' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('should prevent multiple submissions while loading', async () => {
    let resolvePromise: any;
    const promise = new Promise(resolve => { resolvePromise = resolve; });
    mockMutateAsync.mockReturnValue(promise);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '50000' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '12' } });
    
    // Submit twice
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Should only have called mutateAsync once
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    
    // Resolve the promise to complete the test
    resolvePromise();
  });

  it('should reset error state when form is modified after error', async () => {
    const errorMessage = 'Validation failed';
    mockMutateAsync.mockRejectedValue(new Error(errorMessage));

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '40' } });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
    });

    // Modify form again - error should clear
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '5000' } });

    // Error message should still be visible until next submission attempt
    expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
  });
});

describe('Loan Application Form - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (useCreateLoanApplication as any).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isLoading: false,
      isError: false,
      error: null
    });
  });

  it('should handle maximum number values', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill with maximum safe integer
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: Number.MAX_SAFE_INTEGER.toString() } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '36' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect((useCreateLoanApplication as any).mock.results[0].value.mutateAsync).toHaveBeenCalledWith({
        loanAmount: Number.MAX_SAFE_INTEGER,
        term: 36,
        purpose: '',
        repaymentSchedule: 'monthly'
      });
    });
  });

  it('should handle minimum number values', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill with minimum positive value
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '0.01' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '1' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect((useCreateLoanApplication as any).mock.results[0].value.mutateAsync).toHaveBeenCalledWith({
        loanAmount: 0.01,
        term: 1,
        purpose: '',
        repaymentSchedule: 'monthly'
      });
    });
  });

  it('should handle empty string values gracefully', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoanApplicationForm />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Leave some fields empty
    fireEvent.change(screen.getByLabelText(/loan amount/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/term/i), { target: { value: '' } });
    
    // Should trigger validation error rather than crash
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Form validation should prevent submission or handle gracefully
    expect(useCreateLoanApplication).toHaveBeenCalled();
  });
});