/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mock central components
vi.mock('@/lib/prisma', () => {
  const mockPrisma: any = {
    account: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    fiscalPeriod: { findUnique: vi.fn() },
    journalEntry: { create: vi.fn() },
    setting: { findFirst: vi.fn() },
  };
  return {
    __esModule: true,
    default: mockPrisma,
    prisma: mockPrisma,
    resolveTenant: vi.fn().mockImplementation(() => 'tenant_test'),
    withTenant: vi.fn().mockImplementation((tenant: string, callback: () => any) => callback()),
  };
});

vi.mock('@/lib/governance/period-lock', () => ({
  assertPeriodWritable: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/observability/financial-trace', () => ({
  traceFinancialOperation: (ctx: any, callback: () => any) => callback(),
}));

vi.mock('@/lib/observability/correlation', () => ({
  getCorrelationId: () => 'test-correlation-id',
}));

vi.mock('@/lib/numbering', () => ({
  getNextNumber: vi.fn().mockResolvedValue({ formatted: 'JE-0001', raw: 1 }),
}));

import { SubledgerAccountingService, ACCOUNTS_SLA } from '@/lib/services/subledger-accounting';
import { prisma } from '@/lib/prisma';
import { assertPeriodWritable } from '@/lib/governance/period-lock';

describe('Accounting F-08 Subledger Accounting (SLA) Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default account resolution mock (map code to ID)
    (prisma.account.findFirst as any).mockImplementation((args: any) => {
      const code = args.where.code;
      return Promise.resolve({ id: Number(code), code, type: 'asset' });
    });

    (prisma.account.findUnique as any).mockImplementation((args: any) => {
      const id = args.where.id;
      return Promise.resolve({ id, code: String(id), type: 'asset' });
    });

    (prisma.account.update as any).mockResolvedValue({ id: 1 });
    
    // Default open period mock
    (prisma.fiscalPeriod.findUnique as any).mockResolvedValue({
      year: 2026,
      month: 6,
      status: 'open',
    });
  });

  it('Case 1: Sales Invoice with Cash/Bank Split & COGS perpetual inventory', async () => {
    (prisma.journalEntry.create as any).mockResolvedValue({ id: 100, entryNumber: 'JE-0001' });

    const invoice = {
      invoiceNo: 5001,
      subtotal: 1000,
      taxValue: 150,
      total: 1150,
      paymentType: 'split',
      splitCash: 500,
      splitCard: 650,
      userId: 1,
      branchId: 10,
      date: '2026-06-01',
      discountValue: 0,
      totalCost: 700, // perpetual inventory cost matching
      customerId: 2001,
      productId: 301,
      quantity: 5,
      uom: 'PCS',
      projectId: 9,
    };

    const entry = await SubledgerAccountingService.postSalesInvoice(invoice);
    expect(entry).toBeDefined();

    // Check lines sent to Journal Creation
    expect(prisma.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'فاتورة بيع #5001',
          reference: 'SALE-5001',
          totalDebit: 1850,  // (500 cash + 650 card) + 700 COGS
          totalCredit: 1850, // 1000 sales + 150 VAT + 700 Inventory credit
          lines: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.CASH), debit: 500, credit: 0 }),
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.BANK), debit: 650, credit: 0 }),
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.SALES), debit: 0, credit: 1000 }),
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.VAT_OUTPUT), debit: 0, credit: 150 }),
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.COGS), debit: 700, credit: 0 }),
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.INVENTORY), debit: 0, credit: 700 }),
            ]),
          }),
        }),
      })
    );
  });

  it('Case 2: Purchase Invoice with standard PPV and Landed Costs', async () => {
    (prisma.journalEntry.create as any).mockResolvedValue({ id: 101, entryNumber: 'JE-0002' });

    const invoice = {
      invoiceNo: 8001,
      subtotal: 1000,
      taxValue: 150,
      total: 1150,
      paymentType: 'credit',
      userId: 1,
      branchId: 10,
      date: '2026-06-01',
      ppvAmount: 50, // Purchase Price Variance (Paid 50 SAR more than standard)
      landedCosts: [
        { accountCode: '2290', amountValue: 30, description: 'Customs Accrual' }
      ],
      vendorId: 4001,
      productId: 301,
      quantity: 5,
      uom: 'PCS',
      projectId: 9,
    };

    const entry = await SubledgerAccountingService.postPurchaseInvoice(invoice);
    expect(entry).toBeDefined();

    // Check lines sent to Journal Creation
    expect(prisma.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'فاتورة شراء #8001',
          reference: 'PUR-8001',
          totalDebit: 1180,  // (1000 - 50 subtotal + 30 landed) + 50 PPV + 150 VAT input
          totalCredit: 1180, // 30 customs credit + 1150 Payables credit
          lines: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.GRNI), debit: 980, credit: 0 }),
              expect.objectContaining({ accountId: 2290, debit: 0, credit: 30 }),
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.PPV), debit: 50, credit: 0 }),
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.VAT_INPUT), debit: 150, credit: 0 }),
              expect.objectContaining({ accountId: Number(ACCOUNTS_SLA.PAYABLES), debit: 0, credit: 1150 }),
            ]),
          }),
        }),
      })
    );
  });

  it('Case 3: Unbalanced payload throws error and rolls back cleanly', async () => {
    // Manually bypass service mapping to trigger unbalance inside AccountingJournalService directly
    const badInvoice = {
      invoiceNo: 9001,
      subtotal: 1000,
      taxValue: 150,
      total: 1300, // Total 1300 doesn't match 1000 + 150 = 1150 (Unbalanced)
      paymentType: 'credit',
      userId: 1,
      date: '2026-06-01',
    };

    await expect(SubledgerAccountingService.postPurchaseInvoice(badInvoice)).rejects.toThrow(/القيد غير متوازن/);
    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
  });

  it('Case 4: Block posting if Period Lock is active', async () => {
    (assertPeriodWritable as any).mockRejectedValue(new Error('الفترة مقفلة'));

    const invoice = {
      invoiceNo: 5002,
      subtotal: 1000,
      taxValue: 150,
      total: 1150,
      paymentType: 'cash',
      userId: 1,
      date: '2026-06-01',
    };

    await expect(SubledgerAccountingService.postSalesInvoice(invoice)).rejects.toThrow(/الفترة مقفلة/);
    expect(prisma.journalEntry.create).not.toHaveBeenCalled();
  });
});
