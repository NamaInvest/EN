import { describe, it, expect } from 'vitest';
import { WPSGenerator } from '../src/lib/wps-generator';

describe('Saudi Wages Protection System IBAN Compliance (SCN-COMP-001)', () => {
  it('should validate correct Saudi IBANs and National IDs', async () => {
    const employees = [
      {
        id: 1,
        name: 'أحمد علي',
        iban: 'SA1234567890123456789012', // 24 chars starting with SA
        idNumber: '1023456789' // 10 chars
      }
    ];

    const result = await WPSGenerator.validateIBANs(employees);
    expect(result.valid).toBe(1);
    expect(result.invalid).toBe(0);
    expect(result.warnings).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it('should reject missing IBANs', async () => {
    const employees = [
      {
        id: 2,
        name: 'خالد محمد',
        iban: '',
        idNumber: '1023456789'
      }
    ];

    const result = await WPSGenerator.validateIBANs(employees);
    expect(result.valid).toBe(0);
    expect(result.invalid).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toContain('لا يوجد رقم IBAN مسجل');
  });

  it('should reject non-SA IBANs', async () => {
    const employees = [
      {
        id: 3,
        name: 'سالم عبدالله',
        iban: 'AE1234567890123456789012', // UAE IBAN
        idNumber: '1023456789'
      }
    ];

    const result = await WPSGenerator.validateIBANs(employees);
    expect(result.valid).toBe(0);
    expect(result.invalid).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toContain('IBAN يجب أن يبدأ بـ SA');
  });

  it('should reject incorrect IBAN lengths', async () => {
    const employees = [
      {
        id: 4,
        name: 'سعد العتيبي',
        iban: 'SA1234567890', // Too short
        idNumber: '1023456789'
      }
    ];

    const result = await WPSGenerator.validateIBANs(employees);
    expect(result.valid).toBe(0);
    expect(result.invalid).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toContain('طول IBAN غير صحيح');
  });

  it('should warn for missing or incomplete National IDs/Iqamas', async () => {
    const employees = [
      {
        id: 5,
        name: 'عمر الخطيب',
        iban: 'SA1234567890123456789012',
        idNumber: '123' // Too short
      }
    ];

    const result = await WPSGenerator.validateIBANs(employees);
    expect(result.valid).toBe(1); // Still valid for bank submission, but with warning
    expect(result.warnings).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].severity).toBe('WARNING');
    expect(result.errors[0].message).toContain('رقم الهوية/الإقامة غير مكتمل');
  });
});
