/**
 * Unit Tests — WHT Service
 * تغطي: نسب صحيحة، مقيم vs غير مقيم، توليد النموذج 14
 */
import { Decimal } from '@prisma/client/runtime/library';
import { WHTService } from '../../services/payables/wht.service';

// Mock Prisma
const mockPrisma = {
  wHTRule: { findFirst: jest.fn().mockResolvedValue(null) },
  wHTTransaction: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
  },
  whtForm14Batch: { create: jest.fn().mockResolvedValue({ id: 1 }) },
};

const mockCtx = { tenant: { id: 'test-tenant' }, user: { id: 'user-1' } };

describe('WHTService', () => {
  let svc: WHTService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new WHTService(mockPrisma as any, mockCtx as any);
  });

  describe('calculate — غير مقيم', () => {
    it('إيجار = 5%', async () => {
      const res = await svc.calculate(new Decimal(100_000), 'RENT', false);
      expect(res.whtRate.toNumber()).toBe(5);
      expect(res.whtAmount.toNumber()).toBeCloseTo(5_000, 2);
      expect(res.netPayable.toNumber()).toBeCloseTo(95_000, 2);
    });

    it('حقوق ملكية فكرية = 15%', async () => {
      const res = await svc.calculate(new Decimal(100_000), 'ROYALTY', false);
      expect(res.whtRate.toNumber()).toBe(15);
      expect(res.whtAmount.toNumber()).toBeCloseTo(15_000, 2);
    });

    it('رسوم إدارية = 20%', async () => {
      const res = await svc.calculate(new Decimal(100_000), 'MANAGEMENT_FEES', false);
      expect(res.whtRate.toNumber()).toBe(20);
      expect(res.whtAmount.toNumber()).toBeCloseTo(20_000, 2);
    });

    it('خدمات تقنية = 5%', async () => {
      const res = await svc.calculate(new Decimal(50_000), 'TECHNICAL_SERVICES', false);
      expect(res.whtRate.toNumber()).toBe(5);
    });
  });

  describe('calculate — مقيم', () => {
    it('مقيم = 0% على جميع الأنواع (النظام السعودي الحالي)', async () => {
      const res = await svc.calculate(new Decimal(100_000), 'RENT', true);
      expect(res.whtRate.toNumber()).toBe(0);
      expect(res.whtAmount.toNumber()).toBe(0);
      expect(res.netPayable.toNumber()).toBe(100_000);
    });
  });

  describe('generateForm14', () => {
    it('يُولِّد دفعة النموذج 14 بالمجاميع الصحيحة', async () => {
      mockPrisma.wHTTransaction.findMany.mockResolvedValueOnce([
        { id: 1, baseAmount: '100000', whtAmount: '5000' },
        { id: 2, baseAmount: '50000', whtAmount: '7500' },
      ]);

      const result = await svc.generateForm14('2025-01');
      expect(mockPrisma.whtForm14Batch.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ period: '2025-01' }) }),
      );
    });
  });
});
