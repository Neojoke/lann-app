import { describe, it, expect } from 'vitest';
import { calculateInterest, validateThaiNationalId, formatCurrency, generateReferenceNumber } from '../../../backend/src/utils/financial-utils'; // Adjust path as needed

describe('Financial Utilities - Boundary Tests', () => {
  describe('calculateInterest', () => {
    it('should calculate interest correctly with minimum values', () => {
      const result = calculateInterest(1000, 0.05, 1);
      expect(result).toBeCloseTo(50);
    });

    it('should calculate interest correctly with maximum values', () => {
      const result = calculateInterest(Number.MAX_SAFE_INTEGER, 0.25, 360);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle zero principal', () => {
      const result = calculateInterest(0, 0.1, 12);
      expect(result).toBe(0);
    });

    it('should handle zero interest rate', () => {
      const result = calculateInterest(10000, 0, 12);
      expect(result).toBe(0);
    });

    it('should handle zero term', () => {
      const result = calculateInterest(10000, 0.1, 0);
      expect(result).toBe(0);
    });

    it('should handle negative values gracefully', () => {
      expect(() => calculateInterest(-1000, 0.1, 12)).toThrow();
      expect(() => calculateInterest(1000, -0.1, 12)).toThrow();
      expect(() => calculateInterest(1000, 0.1, -12)).toThrow();
    });

    it('should handle very small decimal values', () => {
      const result = calculateInterest(0.01, 0.001, 1);
      expect(result).toBeCloseTo(0.00001);
    });

    it('should handle very large decimal values', () => {
      const result = calculateInterest(999999999.99, 0.25, 360);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('validateThaiNationalId', () => {
    it('should validate correct 13-digit Thai national ID', () => {
      expect(validateThaiNationalId('1234567890123')).toBe(true);
    });

    it('should reject non-numeric IDs', () => {
      expect(validateThaiNationalId('123456789012A')).toBe(false);
      expect(validateThaiNationalId('123456789012!')).toBe(false);
    });

    it('should reject non-13 digit IDs', () => {
      expect(validateThaiNationalId('123456789012')).toBe(false); // 12 digits
      expect(validateThaiNationalId('12345678901234')).toBe(false); // 14 digits
    });

    it('should reject empty string', () => {
      expect(validateThaiNationalId('')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(validateThaiNationalId(null as any)).toBe(false);
      expect(validateThaiNationalId(undefined as any)).toBe(false);
    });

    it('should reject IDs with spaces', () => {
      expect(validateThaiNationalId('1234 5678 90123')).toBe(false);
    });

    it('should validate edge case IDs', () => {
      // Valid edge cases (based on Thai national ID algorithm)
      expect(validateThaiNationalId('1111111111111')).toBe(false); // Invalid checksum
      expect(validateThaiNationalId('0000000000000')).toBe(false); // Invalid checksum
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default locale', () => {
      expect(formatCurrency(1000)).toBe('THB 1,000.00');
    });

    it('should format currency with minimum value', () => {
      expect(formatCurrency(0.01)).toBe('THB 0.01');
    });

    it('should format currency with zero value', () => {
      expect(formatCurrency(0)).toBe('THB 0.00');
    });

    it('should format currency with maximum safe integer', () => {
      expect(formatCurrency(Number.MAX_SAFE_INTEGER)).toMatch(/THB \d+,?\d+\.?\d*/);
    });

    it('should format negative currency values', () => {
      expect(formatCurrency(-1000)).toBe('-THB 1,000.00');
    });

    it('should handle very small decimals', () => {
      expect(formatCurrency(0.001)).toBe('THB 0.00'); // Should round down
      expect(formatCurrency(0.005)).toBe('THB 0.01'); // Should round up
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999999)).toMatch(/THB \d{3},?\d{3},?\d{3}\.?\d*/);
    });

    it('should throw error for non-numeric input', () => {
      expect(() => formatCurrency(NaN)).toThrow();
      expect(() => formatCurrency(Infinity)).toThrow();
      expect(() => formatCurrency(-Infinity)).toThrow();
    });
  });

  describe('generateReferenceNumber', () => {
    it('should generate reference number with default length', () => {
      const ref = generateReferenceNumber();
      expect(ref).toMatch(/^\d{10}$/); // 10 digits
      expect(ref.length).toBe(10);
    });

    it('should generate reference number with custom length', () => {
      const ref = generateReferenceNumber(8);
      expect(ref).toMatch(/^\d{8}$/); // 8 digits
      expect(ref.length).toBe(8);
    });

    it('should generate unique reference numbers', () => {
      const refs = new Set();
      for (let i = 0; i < 100; i++) {
        refs.add(generateReferenceNumber());
      }
      // We expect most to be unique, though with random generation there's a tiny chance of collision
      expect(refs.size).toBeGreaterThan(90); // At least 90% unique
    });

    it('should handle minimum length', () => {
      const ref = generateReferenceNumber(1);
      expect(ref).toMatch(/^\d{1}$/);
      expect(ref.length).toBe(1);
    });

    it('should handle maximum reasonable length', () => {
      const ref = generateReferenceNumber(20);
      expect(ref).toMatch(/^\d{20}$/);
      expect(ref.length).toBe(20);
    });

    it('should throw error for invalid lengths', () => {
      expect(() => generateReferenceNumber(0)).toThrow();
      expect(() => generateReferenceNumber(-1)).toThrow();
      expect(() => generateReferenceNumber(100)).toThrow(); // Too long
    });

    it('should only contain numeric characters', () => {
      const ref = generateReferenceNumber();
      expect(ref).toMatch(/^\d+$/);
    });
  });
});

describe('Financial Utilities - Error Handling Tests', () => {
  it('should handle unexpected input types gracefully', () => {
    expect(() => calculateInterest('1000' as any, 0.1, 12)).toThrow();
    expect(() => calculateInterest(1000, '0.1' as any, 12)).toThrow();
    expect(() => calculateInterest(1000, 0.1, '12' as any)).toThrow();
  });

  it('should handle null/undefined inputs', () => {
    expect(() => calculateInterest(null as any, 0.1, 12)).toThrow();
    expect(() => calculateInterest(1000, null as any, 12)).toThrow();
    expect(() => calculateInterest(1000, 0.1, null as any)).toThrow();
  });

  it('should handle special number values', () => {
    expect(() => calculateInterest(NaN, 0.1, 12)).toThrow();
    expect(() => calculateInterest(1000, NaN, 12)).toThrow();
    expect(() => calculateInterest(1000, 0.1, NaN)).toThrow();
    
    expect(() => calculateInterest(Infinity, 0.1, 12)).toThrow();
    expect(() => calculateInterest(1000, Infinity, 12)).toThrow();
    expect(() => calculateInterest(1000, 0.1, Infinity)).toThrow();
  });
});