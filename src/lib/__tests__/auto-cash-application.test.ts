/**
 * Unit Tests — Auto Cash Application (FIFO)
 * تغطي: FIFO، تطبيق كامل، جزئي، مدفوعات زائدة، بدون فواتير
 */
import { Decimal } from '@prisma/client/runtime/library';
import { AutoCashApplicationService } from '../../services/receivables/auto-cash-application.service';

const makeItem = (id: number, docId: number, openAmount: string, date: string) => ({
  id, documentId: docId, partyId: 1, partyType: 'customer',
  openAmount, status: 'OPEN', documentDate: new Date(date),
});

const buildMock = (items: ReturnType<typeof makeItem>[]) => ({
  openItem: {
    findMany: jest.fn().mockResolvedValue(items),
    update:   jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
  },
  journalEntry: {
    create: jest.fn().mockResolvedValue({ id: 99 }),
  },
  $transaction: jest.fn().mockImplementation((fn: (arg: any) => any) =>
    fn({
      openItem:    { update: jest.fn() },
      journalEntry: { create: jest.fn().mockResolvedValue({ id: 99 }) },
    })
  ),
});

const mockCtx = { tenant: { id: 'test' }, user: { id: 'u1' } } as any;

const baseParams = {
  customerId: 1,
  paymentRef: 'PAY-001',
  paymentDate: new Date('2025-01-15'),
};

describe('AutoCashApplicationService', () => {
  it('يُطبِّق الدفعة الكاملة ويُغلق الفاتورة', async () => {
    const items = [makeItem(1, 101, '5000', '2025-01-01')];
    const svc = new AutoCashApplicationService(buildMock(items) as any, mockCtx);

    const result = await svc.apply({ ...baseParams, paymentAmount: new Decimal(5000) });

    expect(result.invoicesClosed).toBe(1);
    expect(result.invoicesPartial).toBe(0);
    expect(result.appliedAmount.toNumber()).toBe(5000);
    expect(result.overpayment.toNumber()).toBe(0);
  });

  it('يُطبِّق FIFO — يُغلق الأقدم أولاً', async () => {
    const items = [
      makeItem(1, 101, '3000', '2025-01-01'), // الأقدم
      makeItem(2, 102, '3000', '2025-02-01'),
    ];
    const svc = new AutoCashApplicationService(buildMock(items) as any, mockCtx);

    const result = await svc.apply({ ...baseParams, paymentAmount: new Decimal(4000) });

    expect(result.applications[0].invoiceId).toBe(101);   // الأقدم أولاً
    expect(result.applications[0].appliedAmount.toNumber()).toBe(3000); // مغلق كلياً
    expect(result.applications[1].appliedAmount.toNumber()).toBe(1000); // جزئي
    expect(result.invoicesClosed).toBe(1);
    expect(result.invoicesPartial).toBe(1);
  });

  it('يكتشف المدفوعات الزائدة (Overpayment)', async () => {
    const items = [makeItem(1, 101, '2000', '2025-01-01')];
    const svc = new AutoCashApplicationService(buildMock(items) as any, mockCtx);

    const result = await svc.apply({ ...baseParams, paymentAmount: new Decimal(3000) });

    expect(result.invoicesClosed).toBe(1);
    expect(result.overpayment.toNumber()).toBe(1000);
  });

  it('يرفع خطأ عند غياب الفواتير المفتوحة', async () => {
    const svc = new AutoCashApplicationService(buildMock([]) as any, mockCtx);
    await expect(svc.apply({ ...baseParams, paymentAmount: new Decimal(5000) }))
      .rejects.toThrow('لا توجد فواتير مفتوحة');
  });
});
