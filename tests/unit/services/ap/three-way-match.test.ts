/**
 * Unit Tests — Three-Way Match Service (AP 22.1)
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/services/shared/event-bus.service', () => ({
  eventBus: { afterCommit: vi.fn() },
}));

import { ThreeWayMatchService } from '@/services/ap/three-way-match.service';

const mockCtx = {
  tenant: { id: 'tenant-001' },
  user:   { id: 'user-001' },
  requirePermission: vi.fn(),
  fiscal: { isClosed: false },
} as any;

function buildPrisma(overrides: any = {}) {
  return {
    purchaseInvoice: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'inv-001',
        tenantId: 'tenant-001',
        supplierId: 'sup-001',
        totalAmount: 10000,
        invoiceDate: '2026-05-01',
        details: [{ itemId: 'item-001', qty: 10, unitPrice: 1000 }],
        supplier: { id: 'sup-001', name: 'مورد اختبار' },
        ...overrides.invoice,
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    purchaseOrder: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'po-001',
        tenantId: 'tenant-001',
        supplierId: 'sup-001',
        orderDate: '2026-04-01',
        details: [{ itemId: 'item-001', qty: 10, unitPrice: 1000 }],
        ...overrides.po,
      }),
    },
    goodsReceiptNote: {
      findMany: vi.fn().mockResolvedValue([{
        id: 'grn-001',
        orderId: 'po-001',
        tenantId: 'tenant-001',
        details: [{ itemId: 'item-001', qty: 10, unitCost: 1000 }],
      }]),
    },
    $transaction: vi.fn(),
  };
}

describe('ThreeWayMatchService — match', () => {
  it('returns matched status when PO/GRN/Invoice all align', async () => {
    const prisma = buildPrisma();
    const svc = new ThreeWayMatchService(prisma as any, mockCtx);

    const result = await svc.match({ invoiceId: 'inv-001', poId: 'po-001' });

    expect(result.status).toBe('matched');
    expect(result.exceptions).toHaveLength(0);
    expect(result.canApprove).toBe(true);
  });

  it('raises error exception when supplier mismatch', async () => {
    const prisma = buildPrisma({
      po: { supplierId: 'sup-DIFFERENT' },
    });
    const svc = new ThreeWayMatchService(prisma as any, mockCtx);

    const result = await svc.match({ invoiceId: 'inv-001', poId: 'po-001' });

    const supplierEx = result.exceptions.find(e => e.field === 'sku');
    expect(supplierEx).toBeDefined();
    expect(supplierEx?.severity).toBe('error');
    expect(result.canApprove).toBe(false);
  });

  it('raises price exception when invoice exceeds PO by more than tolerance', async () => {
    const prisma = buildPrisma({
      invoice: { totalAmount: 12000 }, // 20% over PO (10000)
    });
    const svc = new ThreeWayMatchService(prisma as any, mockCtx);

    const result = await svc.match({ invoiceId: 'inv-001', poId: 'po-001', tolerance: 5 });

    const priceEx = result.exceptions.find(e => e.field === 'price');
    expect(priceEx).toBeDefined();
    expect(result.summary.invoiceAmount).toBe(12000);
    expect(result.summary.poAmount).toBe(10000);
  });

  it('allows price variance within tolerance', async () => {
    const prisma = buildPrisma({
      invoice: { totalAmount: 10100 }, // 1% over — within 2% default
    });
    const svc = new ThreeWayMatchService(prisma as any, mockCtx);

    const result = await svc.match({ invoiceId: 'inv-001', poId: 'po-001' });

    const priceEx = result.exceptions.find(e => e.field === 'price');
    expect(priceEx).toBeUndefined();
    expect(result.status).toBe('matched');
  });
});
