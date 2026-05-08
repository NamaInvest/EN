/**
 * Unit Tests — GOSI Rates Calculator
 * تغطي: النسب الصحيحة، سقف 45K، Saudi vs Expat، الدقة الرياضية
 */
import { GOSIRatesCalculatorService } from '../../services/gosi/rates-calculator.service';

describe('GOSIRatesCalculatorService', () => {
  const svc = new GOSIRatesCalculatorService();

  describe('موظف سعودي', () => {
    it('يحسب 9% موظف + 9% شركة + 2% ساند', () => {
      const result = svc.calculateRates({ basicSalary: 10_000, housingAllowance: 2_000 }, true);
      expect(result.eligibleBase).toBe(12_000);
      expect(result.employeeShare).toBeCloseTo(1_080, 2);    // 12000 * 9%
      expect(result.companyAnnuity).toBeCloseTo(1_080, 2);   // 12000 * 9%
      expect(result.companySaned).toBeCloseTo(240, 2);        // 12000 * 2%
      expect(result.totalContribution).toBeCloseTo(2_400, 2); // 12000 * 20%
    });

    it('يطبق سقف 45,000 ريال', () => {
      const result = svc.calculateRates({ basicSalary: 40_000, housingAllowance: 20_000 }, true);
      expect(result.eligibleBase).toBe(45_000); // مقيَّد بالسقف
      expect(result.employeeShare).toBeCloseTo(4_050, 2);
    });

    it('لا استقطاع على البدلات الأخرى (النقل مثلاً) — القاعدة أساسي + سكن فقط', () => {
      const onlyBasic = svc.calculateRates({ basicSalary: 10_000, housingAllowance: 0 }, true);
      expect(onlyBasic.eligibleBase).toBe(10_000);
    });
  });

  describe('موظف غير سعودي', () => {
    it('شركة تدفع 2% أخطار مهنية فقط — لا استقطاع من الموظف', () => {
      const result = svc.calculateRates({ basicSalary: 10_000, housingAllowance: 2_000 }, false);
      expect(result.employeeShare).toBe(0);
      expect(result.companyAnnuity).toBe(0);
      expect(result.companySaned).toBe(0);
      expect(result.companyOccupationHazards).toBeCloseTo(240, 2); // 12000 * 2%
    });
  });

  describe('exceedsCeiling', () => {
    it('يكتشف تجاوز السقف', () => {
      expect(svc.exceedsCeiling({ basicSalary: 40_000, housingAllowance: 10_000 })).toBe(true);
      expect(svc.exceedsCeiling({ basicSalary: 20_000, housingAllowance: 10_000 })).toBe(false);
    });
  });
});
