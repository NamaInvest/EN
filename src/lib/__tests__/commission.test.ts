/**
 * Unit Tests — CommissionService
 * تغطي: معدل الطبقة، الهرمية، توازن القيد
 */
import { Decimal } from '@prisma/client/runtime/library';
import { CommissionService } from '../../services/sales/commission.service';

const mockCtx = { tenant: { id: 'test' }, user: { id: 'u1' } } as any;

const makeInvoice = (salespersonId: number, total: number) => ({
  id: Math.random(), salespersonId, totalAmount: total, status: 'POSTED',
});

const makeEmployee = (id: number, name: string, managerId?: number) => ({
  id, fullName: name, managerId,
});

function buildPrisma(invoices: any[], employees: any[]) {
  const jeCreate = jest.fn().mockResolvedValue({ id: 99 });
  return {
    salesInvoice: { findMany: jest.fn().mockResolvedValue(invoices) },
    employee:     { findMany: jest.fn().mockResolvedValue(employees) },
    journalEntry: { create: jeCreate },
  } as any;
}

const from = new Date('2025-01-01');
const to   = new Date('2025-01-31');

describe('CommissionService', () => {

  it('معدل 2% لمبيعات أقل من 100K', async () => {
    const prisma = buildPrisma(
      [makeInvoice(1, 50_000)],
      [makeEmployee(1, 'أحمد')],
    );
    const svc = new CommissionService(prisma, mockCtx);
    const result = await svc.calculateAndPostCommissions(from, to);

    const summary = result.summaries.find(s => String(s.salespersonId) === '1')!;
    expect(summary.commissionRate).toBe(0.02);
    expect(summary.commissionAmount.toNumber()).toBeCloseTo(1000, 0);
  });

  it('معدل 5% لمبيعات أكثر من 500K', async () => {
    const prisma = buildPrisma(
      [makeInvoice(1, 600_000)],
      [makeEmployee(1, 'خالد')],
    );
    const svc = new CommissionService(prisma, mockCtx);
    const result = await svc.calculateAndPostCommissions(from, to);

    const summary = result.summaries.find(s => String(s.salespersonId) === '1')!;
    expect(summary.commissionRate).toBe(0.05);
    expect(summary.commissionAmount.toNumber()).toBeCloseTo(30_000, 0);
  });

  it('المدير يحصل على 10% من عمولة مرؤوسيه', async () => {
    const prisma = buildPrisma(
      [makeInvoice(2, 200_000)],   // مندوب مبيعات
      [makeEmployee(1, 'المدير'), makeEmployee(2, 'المندوب', 1)],
    );
    const svc = new CommissionService(prisma, mockCtx);
    const result = await svc.calculateAndPostCommissions(from, to);

    const mgr = result.summaries.find(s => String(s.salespersonId) === '1');
    const rep = result.summaries.find(s => String(s.salespersonId) === '2')!;

    // عمولة المندوب: 200K × 3% = 6,000
    expect(rep.commissionAmount.toNumber()).toBeCloseTo(6_000, 0);
    // عمولة المدير الهرمية: 6,000 × 10% = 600
    expect(mgr?.managerOverride.toNumber()).toBeCloseTo(600, 0);
  });

  it('إجمالي العمولات يساوي مجموع الأفراد', async () => {
    const prisma = buildPrisma(
      [makeInvoice(1, 100_000), makeInvoice(2, 50_000)],
      [makeEmployee(1, 'علي'), makeEmployee(2, 'سلمى')],
    );
    const svc = new CommissionService(prisma, mockCtx);
    const result = await svc.calculateAndPostCommissions(from, to);

    const sumFromSummaries = result.summaries.reduce((s, r) => s + r.totalPayout.toNumber(), 0);
    expect(result.totalPayout.toNumber()).toBeCloseTo(sumFromSummaries, 0);
  });
});
