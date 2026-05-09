import { round2, validateMoney } from './money';

describe('Money Utility Tests', () => {
  describe('round2', () => {
    it('should round numbers to 2 decimal places', () => {
      expect(round2(10.123)).toBe(10.12);
      expect(round2(10.125)).toBe(10.13);
      expect(round2(10.129)).toBe(10.13);
      expect(round2(10)).toBe(10);
    });

    it('should handle negative numbers correctly', () => {
      expect(round2(-10.123)).toBe(-10.12);
      expect(round2(-10.125)).toBe(-10.12); // Math.round(-10.125 * 100) / 100 = -1012/100 = -10.12
      expect(round2(-10.129)).toBe(-10.13);
    });

    it('should handle zero', () => {
      expect(round2(0)).toBe(0);
      expect(round2(0.001)).toBe(0);
    });
  });

  describe('validateMoney', () => {
    it('should validate and return a valid positive number rounded to 2 decimals', () => {
      expect(validateMoney(100.1234)).toBe(100.12);
      expect(validateMoney('100.1234')).toBe(100.12); // handles string input
    });

    it('should throw for negative values by default', () => {
      expect(() => validateMoney(-50)).toThrow('لا يمكن أن يكون سالباً');
    });

    it('should allow negative values if allowNegative is true', () => {
      expect(validateMoney(-50.555, 'الرصيد', { allowNegative: true })).toBe(-50.55);
    });

    it('should throw for NaN or non-numeric strings', () => {
      expect(() => validateMoney('not a number')).toThrow('غير صالح');
      expect(() => validateMoney(NaN)).toThrow('غير صالح');
    });

    it('should use custom field name in errors', () => {
      expect(() => validateMoney(-10, 'الخصم')).toThrow('الخصم لا يمكن أن يكون سالباً');
    });

    it('should accept values under maxValue (default ~1T)', () => {
      // Default maxValue is 999_999_999_999 so 1 billion is fine
      expect(validateMoney(1_000_000_000)).toBe(1_000_000_000);
    });

    it('should reject values exceeding custom maxValue', () => {
      expect(() => validateMoney(1001, 'المبلغ', { maxValue: 1000 })).toThrow('تجاوز الحد الأقصى');
    });

    it('should handle Infinity as invalid', () => {
      expect(() => validateMoney(Infinity)).toThrow('غير صالح');
      expect(() => validateMoney(-Infinity)).toThrow('غير صالح');
    });

    it('should handle zero as valid', () => {
      expect(validateMoney(0)).toBe(0);
    });
  });
});
