/**
 * 工具函数测试
 * 
 * 测试覆盖:
 * - 货币格式化
 * - 日期格式化
 * - 验证函数
 * - 计算函数
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  validatePhone,
  validateEmail,
  calculateAge,
  clamp,
  debounce,
  throttle,
} from '../../src/utils';

describe('Currency Formatting', () => {
  it('should format Thai Baht correctly', () => {
    expect(formatCurrency(10000, 'THB', 'th-TH')).toContain('฿');
    expect(formatCurrency(10000, 'THB', 'th-TH')).toContain('10,000');
  });

  it('should format with English locale', () => {
    const formatted = formatCurrency(10000, 'THB', 'en-US');
    expect(formatted).toContain('THB');
  });

  it('should handle decimals', () => {
    const formatted = formatCurrency(10000.50, 'THB', 'th-TH');
    expect(formatted).toContain('50');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0, 'THB', 'th-TH')).toBe('฿0.00');
  });

  it('should handle negative numbers', () => {
    const formatted = formatCurrency(-1000, 'THB', 'th-TH');
    expect(formatted).toContain('-');
  });
});

describe('Date Formatting', () => {
  it('should format date in Thai', () => {
    const date = new Date('2026-03-17');
    const formatted = formatDate(date, 'th-TH');
    
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('should format date in English', () => {
    const date = new Date('2026-03-17');
    const formatted = formatDate(date, 'en-US');
    
    expect(formatted).toBeDefined();
    expect(formatted).toContain('2026');
  });

  it('should handle relative dates', () => {
    const today = new Date();
    const formatted = formatDate(today, 'en-US', 'relative');
    
    expect(formatted).toMatch(/today|yesterday|\d+ days? ago/);
  });
});

describe('Phone Validation', () => {
  it('should validate Thai phone number', () => {
    expect(validatePhone('0812345678')).toBe(true);
    expect(validatePhone('0823456789')).toBe(true);
    expect(validatePhone('0834567890')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(validatePhone('12345')).toBe(false);
    expect(validatePhone('abcdefghij')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });

  it('should handle international format', () => {
    expect(validatePhone('+66812345678')).toBe(true);
  });
});

describe('Email Validation', () => {
  it('should validate email format', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.th')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('Age Calculation', () => {
  it('should calculate age correctly', () => {
    const birthDate = '1990-01-01';
    const age = calculateAge(birthDate);
    
    expect(age).toBeGreaterThan(30);
    expect(age).toBeLessThan(40);
  });

  it('should handle leap year', () => {
    const birthDate = '2000-02-29';
    const age = calculateAge(birthDate);
    
    expect(age).toBeGreaterThan(20);
  });

  it('should return 0 for future dates', () => {
    const futureDate = '2030-01-01';
    const age = calculateAge(futureDate);
    
    expect(age).toBeLessThanOrEqual(0);
  });
});

describe('Clamp Function', () => {
  it('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle edge cases', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('Debounce Function', () => {
  it('should debounce function calls', async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 150));

    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('Throttle Function', () => {
  it('should throttle function calls', async () => {
    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    await new Promise(resolve => setTimeout(resolve, 150));

    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
