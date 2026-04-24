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
  });

  describe('validateMoney', () => {
    it('should validate and return a valid positive number rounded to 2 decimals', () => {
      expect(validateMoney(100.1234)).toBe(100.12);
      expect(validateMoney("100.1234")).toBe(100.12); // Should handle strings parsed as numbers
    });

    it('should throw an error for negative values by default', () => {
      expect(() => validateMoney(-50)).toThrow('المبلغ لا يمكن أن يكون سالباً');
    });

    it('should allow negative values if allowNegative is true', () => {
      expect(validateMoney(-50.555, 'الرصيد', { allowNegative: true })).toBe(-50.55);
    });

    it('should throw an error for NaN or non-numeric strings', () => {
      expect(() => validateMoney("not a number")).toThrow('المبلغ غير صالح');
      expect(() => validateMoney(NaN)).toThrow('المبلغ غير صالح');
    });

    it('should throw an error if value exceeds the default maxValue', () => {
      expect(() => validateMoney(1_000_000_000)).toThrow('المبلغ تجاوز الحد الأقصى');
    });

    it('should use custom field name in errors', () => {
      expect(() => validateMoney(-10, 'الخصم')).toThrow('الخصم لا يمكن أن يكون سالباً');
    });
  });
});
