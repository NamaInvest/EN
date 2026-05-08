/**
 * Unit Tests — Fixed Asset Depreciation
 * تغطي: القسط الثابت، المتناقص المضاعف، وعاء صفر، سقف القيمة المتبقية
 */
import { Decimal } from '@prisma/client/runtime/library';
import { FixedAssetDepreciationService } from '../../services/assets/fixed-asset-depreciation.service';

const mockPrisma = {} as any;
const mockCtx   = { tenant: { id: 'test' }, user: { id: 'u1' } } as any;

describe('FixedAssetDepreciationService._calculateMonthlyCharge (via runMonthlyDepreciation)', () => {
  // نصل للدالة الخاصة عبر any
  const svc = new FixedAssetDepreciationService(mockPrisma, mockCtx) as any;

  const makeAsset = (overrides: Record<string, any>) => ({
    acquisitionCost: '120000',
    residualValue: '0',
    usefulLifeYears: 5,
    usefulLifeMonths: 0,
    accumulatedDepreciation: '0',
    depreciationMethod: 'STRAIGHT_LINE',
    depreciationRate: '20',
    ...overrides,
  });

  describe('STRAIGHT_LINE', () => {
    it('يحسب القسط الشهري بدقة', () => {
      // 120,000 / (5 × 12) = 2,000 / شهر
      const charge = svc._calculateMonthlyCharge(makeAsset({ depreciationMethod: 'STRAIGHT_LINE' }), new Date());
      expect(charge.toNumber()).toBeCloseTo(2000, 2);
    });

    it('يطرح القيمة المتبقية', () => {
      // (120,000 - 20,000) / 60 = 1,666.67
      const charge = svc._calculateMonthlyCharge(
        makeAsset({ depreciationMethod: 'STRAIGHT_LINE', residualValue: '20000' }),
        new Date(),
      );
      expect(charge.toNumber()).toBeCloseTo(1666.67, 1);
    });
  });

  describe('DECLINING_BALANCE', () => {
    it('يحسب القسط المتناقص على الرصيد الدفتري', () => {
      // رصيد = 120,000، معدل 20% سنوياً → 120,000 × 20% / 12 = 2,000
      const charge = svc._calculateMonthlyCharge(
        makeAsset({ depreciationMethod: 'DECLINING_BALANCE', depreciationRate: '20' }),
        new Date(),
      );
      expect(charge.toNumber()).toBeCloseTo(2000, 2);
    });

    it('ينخفض بعد تراكم الاستهلاك', () => {
      // بعد تراكم 60,000: رصيد = 60,000 → 60,000 × 20% / 12 = 1,000
      const charge = svc._calculateMonthlyCharge(
        makeAsset({ depreciationMethod: 'DECLINING_BALANCE', accumulatedDepreciation: '60000', depreciationRate: '20' }),
        new Date(),
      );
      expect(charge.toNumber()).toBeCloseTo(1000, 2);
    });
  });

  describe('DOUBLE_DECLINING', () => {
    it('معدل مضاعف: 2 / عمر إنتاجي', () => {
      // 5 سنوات → معدل = 2/5 = 40% / سنة → 120,000 × 40% / 12 = 4,000
      const charge = svc._calculateMonthlyCharge(
        makeAsset({ depreciationMethod: 'DOUBLE_DECLINING' }),
        new Date(),
      );
      expect(charge.toNumber()).toBeCloseTo(4000, 2);
    });
  });

  describe('Edge Cases', () => {
    it('عمر إنتاجي صفر → لا استهلاك', () => {
      const charge = svc._calculateMonthlyCharge(
        makeAsset({ usefulLifeYears: 0 }),
        new Date(),
      );
      expect(charge.toNumber()).toBe(0);
    });

    it('رصيد دفتري = قيمة متبقية → لا استهلاك', () => {
      const charge = svc._calculateMonthlyCharge(
        makeAsset({ accumulatedDepreciation: '120000' }), // مستهلك كلياً
        new Date(),
      );
      expect(charge.toNumber()).toBe(0);
    });
  });
});
