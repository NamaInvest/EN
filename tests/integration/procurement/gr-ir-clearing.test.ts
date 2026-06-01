/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock prisma context
vi.mock('@/lib/prisma', () => {
  const mockPrisma: any = {
    setting: { findFirst: vi.fn() },
    purchaseOrder: { findMany: vi.fn() },
    purchaseInvoice: { findMany: vi.fn() },
  };
  return {
    __esModule: true,
    default: mockPrisma,
    prisma: mockPrisma,
  };
});

import { GRIRClearingEngine } from '@/lib/gr-ir-clearing-engine';
import { prisma } from '@/lib/prisma';

describe('Procurement F-07 GR/IR Clearing Engine Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set default tolerance setting mocks (10.00 SAR amount and 2.0% percent tolerance)
    (prisma.setting.findFirst as any).mockImplementation((args: any) => {
      if (args.where.key === 'GRIR_CLEARING_TOLERANCE_AMOUNT') {
        return Promise.resolve({ key: 'GRIR_CLEARING_TOLERANCE_AMOUNT', value: '10.00' });
      }
      if (args.where.key === 'GRIR_CLEARING_TOLERANCE_PERCENT') {
        return Promise.resolve({ key: 'GRIR_CLEARING_TOLERANCE_PERCENT', value: '2.0' });
      }
      if (args.where.key === 'GRIR_AUTO_CLEAR_ENABLED') {
        return Promise.resolve({ key: 'GRIR_AUTO_CLEAR_ENABLED', value: 'false' });
      }
      return Promise.resolve(null);
    });
  });

  it('Case 1: Fully Matched => GRN amount equals Invoice amount', async () => {
    // 10 items received at 100 SAR, and invoiced exactly 1000 SAR
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: 1,
        orderNo: 1001,
        tenantId: 'tenant_test',
        date: new Date(),
        supplier: { name: 'Supplier A', nameAr: 'المورد أ' },
        details: [
          { productId: 101, quantity: 10, price: 100, total: 1000 }
        ],
        goodsReceipts: [
          {
            id: 10,
            date: new Date(),
            details: [
              { productId: 101, quantity: 10, acceptedQty: 10 }
            ]
          }
        ]
      }
    ]);

    (prisma.purchaseInvoice.findMany as any).mockResolvedValue([
      {
        id: 20,
        purchaseOrderId: 1,
        tenantId: 'tenant_test',
        date: new Date(),
        total: 1000,
        subtotal: 1000,
        status: 'completed',
        details: [
          { productId: 101, quantity: 10, price: 100, total: 1000 }
        ]
      }
    ]);

    const report = await GRIRClearingEngine.generateReport('tenant_test');
    expect(report.lines).toHaveLength(1);
    expect(report.lines[0].status).toBe('MATCHED');
    expect(report.lines[0].balance).toBe(0);
    expect(report.lines[0].clearableWithinTolerance).toBe(true);
    expect(report.matchedCount).toBe(1);
    expect(report.unmatchedCount).toBe(0);
  });

  it('Case 2: Variance within tolerance => CLEARABLE_WITHIN_TOLERANCE', async () => {
    // GRN is 1000 SAR, Invoice is 995 SAR (delta 5 SAR is within 10 SAR & 2% limit)
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: 2,
        orderNo: 1002,
        tenantId: 'tenant_test',
        date: new Date(),
        supplier: { name: 'Supplier A', nameAr: 'المورد أ' },
        details: [
          { productId: 101, quantity: 10, price: 100, total: 1000 }
        ],
        goodsReceipts: [
          {
            id: 11,
            date: new Date(),
            details: [
              { productId: 101, quantity: 10, acceptedQty: 10 }
            ]
          }
        ]
      }
    ]);

    (prisma.purchaseInvoice.findMany as any).mockResolvedValue([
      {
        id: 21,
        purchaseOrderId: 2,
        tenantId: 'tenant_test',
        date: new Date(),
        total: 995,
        subtotal: 995,
        status: 'completed',
        details: [
          { productId: 101, quantity: 10, price: 99.5, total: 995 }
        ]
      }
    ]);

    const report = await GRIRClearingEngine.generateReport('tenant_test');
    expect(report.lines).toHaveLength(1);
    expect(report.lines[0].status).toBe('CLEARABLE_WITHIN_TOLERANCE');
    expect(report.lines[0].balance).toBe(5); // 1000 - 995
    expect(report.lines[0].clearableWithinTolerance).toBe(true);
    expect(report.lines[0].blockedOverTolerance).toBe(false);
  });

  it('Case 3: Variance exceeding tolerance => BLOCKED_OVER_TOLERANCE', async () => {
    // GRN is 1000 SAR, Invoice is 950 SAR (delta 50 SAR is greater than 10 SAR limit)
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: 3,
        orderNo: 1003,
        tenantId: 'tenant_test',
        date: new Date(),
        supplier: { name: 'Supplier A', nameAr: 'المورد أ' },
        details: [
          { productId: 101, quantity: 10, price: 100, total: 1000 }
        ],
        goodsReceipts: [
          {
            id: 12,
            date: new Date(),
            details: [
              { productId: 101, quantity: 10, acceptedQty: 10 }
            ]
          }
        ]
      }
    ]);

    (prisma.purchaseInvoice.findMany as any).mockResolvedValue([
      {
        id: 22,
        purchaseOrderId: 3,
        tenantId: 'tenant_test',
        date: new Date(),
        total: 950,
        subtotal: 950,
        status: 'completed',
        details: [
          { productId: 101, quantity: 10, price: 95, total: 950 }
        ]
      }
    ]);

    const report = await GRIRClearingEngine.generateReport('tenant_test');
    expect(report.lines).toHaveLength(1);
    expect(report.lines[0].status).toBe('BLOCKED_OVER_TOLERANCE');
    expect(report.lines[0].balance).toBe(50);
    expect(report.lines[0].clearableWithinTolerance).toBe(false);
    expect(report.lines[0].blockedOverTolerance).toBe(true);
  });

  it('Case 4: Goods received but no invoice => PENDING_CLEARING / UNINVOICED_RECEIPT', async () => {
    // GRN recorded, no invoice
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: 4,
        orderNo: 1004,
        tenantId: 'tenant_test',
        date: new Date(),
        supplier: { name: 'Supplier A', nameAr: 'المورد أ' },
        details: [
          { productId: 101, quantity: 10, price: 100, total: 1000 }
        ],
        goodsReceipts: [
          {
            id: 13,
            date: new Date(),
            details: [
              { productId: 101, quantity: 10, acceptedQty: 10 }
            ]
          }
        ]
      }
    ]);

    (prisma.purchaseInvoice.findMany as any).mockResolvedValue([]);

    const report = await GRIRClearingEngine.generateReport('tenant_test');
    expect(report.lines).toHaveLength(1);
    expect(report.lines[0].status).toBe('PENDING_CLEARING');
    expect(report.lines[0].balance).toBe(1000);
    expect(report.lines[0].invoiceAmount).toBe(0);
  });

  it('Case 5: Invoice recorded but no GRN => PENDING_CLEARING / INVOICE_WITHOUT_RECEIPT', async () => {
    // Invoice exists, no GRN
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: 5,
        orderNo: 1005,
        tenantId: 'tenant_test',
        date: new Date(),
        supplier: { name: 'Supplier A', nameAr: 'المورد أ' },
        details: [
          { productId: 101, quantity: 10, price: 100, total: 1000 }
        ],
        goodsReceipts: []
      }
    ]);

    (prisma.purchaseInvoice.findMany as any).mockResolvedValue([
      {
        id: 24,
        purchaseOrderId: 5,
        tenantId: 'tenant_test',
        date: new Date(),
        total: 1000,
        subtotal: 1000,
        status: 'completed',
        details: [
          { productId: 101, quantity: 10, price: 100, total: 1000 }
        ]
      }
    ]);

    const report = await GRIRClearingEngine.generateReport('tenant_test');
    expect(report.lines).toHaveLength(1);
    expect(report.lines[0].status).toBe('PENDING_CLEARING');
    expect(report.lines[0].balance).toBe(-1000); // 0 - 1000
    expect(report.lines[0].grnAmount).toBe(0);
  });

  it('Case 6: Correct ageing bucket according to GRN date', async () => {
    // GRN is 45 days old => bucket '31-60'
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: 6,
        orderNo: 1006,
        tenantId: 'tenant_test',
        date: fortyFiveDaysAgo,
        supplier: { name: 'Supplier A', nameAr: 'المورد أ' },
        details: [
          { productId: 101, quantity: 10, price: 100, total: 1000 }
        ],
        goodsReceipts: [
          {
            id: 15,
            date: fortyFiveDaysAgo,
            details: [
              { productId: 101, quantity: 10, acceptedQty: 10 }
            ]
          }
        ]
      }
    ]);

    (prisma.purchaseInvoice.findMany as any).mockResolvedValue([]);

    const report = await GRIRClearingEngine.generateReport('tenant_test');
    expect(report.lines).toHaveLength(1);
    expect(report.lines[0].ageingDays).toBeGreaterThanOrEqual(44);
    expect(report.lines[0].bucket).toBe('31-60');
  });

  it('Case 7: Strict Tenant Isolation', async () => {
    // Call generateReport for tenant_test. Should query PO and Invoices filtering by tenantId
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([]);
    (prisma.purchaseInvoice.findMany as any).mockResolvedValue([]);

    await GRIRClearingEngine.generateReport('tenant_test');

    expect(prisma.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant_test'
        })
      })
    );
  });
});
