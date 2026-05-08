/**
 * Unit Tests — Zakat Calculator
 * تغطي: الصيغة الأساسية، وعاء سالب، تعديلات، دقة الحساب
 */
import { Decimal } from '@prisma/client/runtime/library';
import { ZakatCalculatorService } from '../../services/reporting/zakat-calculator.service';

const mockPrisma = {} as any;
const mockCtx   = { tenant: { id: 'test' }, user: { id: 'u1' } } as any;

describe('ZakatCalculatorService.calculate', () => {
  const svc = new ZakatCalculatorService(mockPrisma, mockCtx);

  const base = {
    equity: new Decimal(1_000_000),
    longTermLiabilities: new Decimal(500_000),
    fixedAssetsBookValue: new Decimal(800_000),
    longTermInvestments: new Decimal(200_000),
    adjustmentsTotal: new Decimal(0),
    netProfit: new Decimal(0),
  };

  it('يحسب وعاء الزكاة بشكل صحيح', () => {
    // وعاء = (1M + 500K) - (800K + 200K) = 500,000
    const result = svc.calculate(base);
    expect(result.zakatBase.toNumber()).toBe(500_000);
  });

  it('يحسب الزكاة = 2.5% × الوعاء', () => {
    const result = svc.calculate(base);
    expect(result.zakatDue.toNumber()).toBeCloseTo(12_500, 2); // 500K × 2.5%
  });

  it('وعاء سالب → زكاة صفر', () => {
    const negativeBase = {
      ...base,
      fixedAssetsBookValue: new Decimal(2_000_000), // أصول ثابتة > حقوق ملكية
    };
    const result = svc.calculate(negativeBase);
    expect(result.zakatBase.toNumber()).toBeLessThan(0);
    expect(result.zakatDue.toNumber()).toBe(0);
    expect(result.isZakatApplicable).toBe(false);
  });

  it('التعديلات تُخفِّض الوعاء', () => {
    const withAdj = { ...base, adjustmentsTotal: new Decimal(-100_000) };
    const result = svc.calculate(withAdj);
    // وعاء = (1M + 500K - 100K) - (800K + 200K) = 400,000
    expect(result.zakatBase.toNumber()).toBe(400_000);
    expect(result.zakatDue.toNumber()).toBeCloseTo(10_000, 2);
  });

  it('التعديلات تزيد الوعاء', () => {
    const withAdj = { ...base, adjustmentsTotal: new Decimal(200_000) };
    const result = svc.calculate(withAdj);
    expect(result.zakatBase.toNumber()).toBe(700_000);
    expect(result.zakatDue.toNumber()).toBeCloseTo(17_500, 2);
  });

  it('نسبة الزكاة = 2.5%', () => {
    const result = svc.calculate(base);
    expect(result.zakatRate.toNumber()).toBe(2.5);
  });
});
