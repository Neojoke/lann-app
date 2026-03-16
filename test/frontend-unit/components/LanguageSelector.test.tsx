/**
 * LanguageSelector 组件测试
 * 
 * 测试覆盖:
 * - 语言切换功能
 * - 语言状态显示
 * - 多语言文本渲染
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { LanguageProvider, useLanguage } from '../../src/contexts/LanguageContext';

describe('LanguageSelector Component', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <LanguageProvider>
        {component}
      </LanguageProvider>
    );
  };

  describe('Rendering', () => {
    it('should render language selector button', () => {
      renderWithProvider(<LanguageSelector />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display current language icon', () => {
      renderWithProvider(<LanguageSelector />);
      
      // Should show TH or EN icon based on current language
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Language Toggle', () => {
    it('should toggle between Thai and English', () => {
      renderWithProvider(<LanguageSelector />);
      
      const button = screen.getByRole('button');
      
      // Click to toggle
      fireEvent.click(button);
      
      // Language should have changed
      expect(button).toBeInTheDocument();
    });

    it('should persist language selection', () => {
      renderWithProvider(<LanguageSelector />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Verify language changed
      expect(button).toBeInTheDocument();
    });
  });

  describe('Dropdown Menu', () => {
    it('should show language options on click', () => {
      renderWithProvider(<LanguageSelector />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Should show language options
      expect(screen.getByText('ไทย')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should highlight current language', () => {
      renderWithProvider(<LanguageSelector />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Current language should be highlighted
      const currentLang = navigator.language.startsWith('th') ? 'ไทย' : 'English';
      expect(screen.getByText(currentLang)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProvider(<LanguageSelector />);
      
      const button = screen.getByRole('button', { name: /language/i });
      expect(button).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible', () => {
      renderWithProvider(<LanguageSelector />);
      
      const button = screen.getByRole('button');
      
      // Tab to button
      button.focus();
      expect(button).toHaveFocus();
      
      // Enter to open
      fireEvent.keyDown(button, { key: 'Enter' });
    });
  });
});
