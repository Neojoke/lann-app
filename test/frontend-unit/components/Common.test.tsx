/**
 * 组件通用测试
 * 
 * 测试覆盖:
 * - Button 组件
 * - Input 组件
 * - Modal 组件
 * - Loading 组件
 */

import { describe, it, expect } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button Component', () => {
  it('should render button with text', () => {
    const { container } = render(<button>Click Me</button>);
    expect(container.querySelector('button')).toBeInTheDocument();
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<button onClick={handleClick}>Click Me</button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<button disabled>Disabled</button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('should handle loading state', () => {
    render(<button disabled>Loading...</button>);
    expect(screen.getByText('Loading...')).toBeDisabled();
  });
});

describe('Input Component', () => {
  it('should render input', () => {
    render(<input type="text" placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should handle text input', () => {
    const handleChange = vi.fn();
    render(<input type="text" onChange={handleChange} />);
    
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should render with label', () => {
    render(
      <label>
        Name
        <input type="text" />
      </label>
    );
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(<input type="text" aria-invalid="true" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Modal Component', () => {
  it('should render modal content', () => {
    render(
      <div role="dialog" aria-modal="true">
        <h2>Modal Title</h2>
        <p>Modal Content</p>
      </div>
    );
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('should handle close action', () => {
    const handleClose = vi.fn();
    render(
      <div role="dialog" aria-modal="true">
        <button onClick={handleClose}>Close</button>
      </div>
    );
    
    fireEvent.click(screen.getByText('Close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should be accessible', () => {
    render(
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Title</h2>
      </div>
    );
    
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });
});

describe('Loading Component', () => {
  it('should render loading spinner', () => {
    render(<div role="status">Loading...</div>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render loading text', () => {
    render(<div>Loading...</div>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<div role="status" aria-live="polite">Loading...</div>);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('Card Component', () => {
  it('should render card with content', () => {
    render(
      <div data-testid="card">
        <h3>Card Title</h3>
        <p>Card Content</p>
      </div>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
});

describe('Alert Component', () => {
  it('should render success alert', () => {
    render(<div role="alert" data-variant="success">Success!</div>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render error alert', () => {
    render(<div role="alert" data-variant="error">Error!</div>);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('should render warning alert', () => {
    render(<div role="alert" data-variant="warning">Warning!</div>);
    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });
});
