import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Decimal } from '@prisma/client/runtime/library';
import { FinancialPeriodStatus } from '@prisma/client';

// ── Mock Dependencies ────────────────────────────────────────────────────────

// Mock Redis to prevent real connection attempts during tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(),
      incr: jest.fn().mockImplementation(() => Promise.resolve(1)),
      pexpire: jest.fn().mockImplementation(() => Promise.resolve(true)),
    };
  });
});

// Mock logger to console/warn printout
jest.mock('@/lib/observability/logger', () => ({
  logger: {
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as any),
  },
}));

// Mock period-lock service directly to allow period writable assertions
jest.mock('@/lib/governance/period-lock', () => ({
  assertPeriodWritable: jest.fn().mockImplementation(() => Promise.resolve('ALLOWED')),
  PeriodLockViolation: class PeriodLockViolation extends Error {
    constructor(public message: string, public code: string) {
      super(message);
    }
  },
}));

// Mock database transaction wrapper
jest.mock('@/lib/db/transaction', () => ({
  runFinancialTx: jest.fn((prisma: any, cb: any) => cb(prisma)),
}));

import { OpenItemsService } from '../lib/services/open-items.service';
import { assertPeriodWritable } from '@/lib/governance/period-lock';

describe('Open Items Allocation Service Engine (Phase OPEN-ITEMS-01E)', () => {
  const tenantId = 'test-tenant';
  const userId = '101';

  // Mock transaction client
  let txMock: any;

  beforeEach(() => {
    jest.clearAllMocks();

    txMock = {
      salesInvoice: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      purchaseInvoice: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      treasury: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      openItemMatching: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(() => Promise.resolve({ id: 'mock-audit' })),
      },
    };
  });

  describe('allocateCustomerPayment()', () => {
    it('1. should successfully allocate a valid payment and update invoice balances', async () => {
      // Setup Mock Data
      txMock.salesInvoice.findFirst.mockResolvedValue({
        id: 501,
        tenantId,
        total: new Decimal(1000.0),
        paid: new Decimal(0),
        remaining: new Decimal(1000.0),
        date: new Date('2026-05-15'),
      });

      txMock.treasury.findFirst.mockResolvedValue({
        id: 701,
        tenantId,
        amount: new Decimal(1500.0),
        type: 'in',
        date: new Date('2026-05-15'),
      });

      txMock.openItemMatching.findMany.mockResolvedValue([]); // no prior allocations

      txMock.openItemMatching.create.mockResolvedValue({
        id: 901,
        tenantId,
        salesInvoiceId: 501,
        treasuryId: 701,
        amount: new Decimal(1000.0),
      });

      const result = await OpenItemsService.allocateCustomerPayment(txMock, {
        tenantId,
        salesInvoiceId: 501,
        treasuryId: 701,
        amount: 1000.0,
        allocatedBy: 'MANUAL_USER',
        sourceType: 'MANUAL',
        userId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(901);

      // Verify Row lock fetch
      expect(txMock.salesInvoice.findFirst).toHaveBeenCalledWith({
        where: { id: 501, tenantId, deletedAt: null },
      });

      // Verify invoice update balances
      expect(txMock.salesInvoice.update).toHaveBeenCalledWith({
        where: { id: 501 },
        data: expect.objectContaining({
          paid: new Decimal(1000.0),
          remaining: new Decimal(0),
          status: 'completed',
        }),
      });

      // Verify Period Lock asserted
      expect(assertPeriodWritable).toHaveBeenCalled();
    });

    it('2. should reject allocation if amount exceeds remaining invoice balance', async () => {
      txMock.salesInvoice.findFirst.mockResolvedValue({
        id: 501,
        tenantId,
        total: new Decimal(1000.0),
        paid: new Decimal(800.0),
        remaining: new Decimal(200.0),
        date: new Date(),
      });

      txMock.treasury.findFirst.mockResolvedValue({
        id: 701,
        tenantId,
        amount: new Decimal(1000.0),
        type: 'in',
        date: new Date(),
      });

      txMock.openItemMatching.findMany.mockResolvedValue([]);

      await expect(
        OpenItemsService.allocateCustomerPayment(txMock, {
          tenantId,
          salesInvoiceId: 501,
          treasuryId: 701,
          amount: 200.01, // 0.01 over remaining
          allocatedBy: 'MANUAL_USER',
          sourceType: 'MANUAL',
          userId,
        })
      ).rejects.toThrow('exceeds remaining invoice balance');
    });

    it('3. should reject allocation if amount is zero or negative', async () => {
      await expect(
        OpenItemsService.allocateCustomerPayment(txMock, {
          tenantId,
          salesInvoiceId: 501,
          treasuryId: 701,
          amount: -5.0,
          allocatedBy: 'MANUAL_USER',
          sourceType: 'MANUAL',
          userId,
        })
      ).rejects.toThrow('Allocation amount must be greater than zero.');
    });

    it('4. should reject allocation if invoice belongs to another tenant', async () => {
      txMock.salesInvoice.findFirst.mockResolvedValue(null); // not found under this tenant context

      await expect(
        OpenItemsService.allocateCustomerPayment(txMock, {
          tenantId,
          salesInvoiceId: 501,
          treasuryId: 701,
          amount: 500.0,
          allocatedBy: 'MANUAL_USER',
          sourceType: 'MANUAL',
          userId,
        })
      ).rejects.toThrow('Sales invoice not found or unauthorized.');
    });

    it('5. should reject allocation if treasury entry belongs to another tenant', async () => {
      txMock.salesInvoice.findFirst.mockResolvedValue({
        id: 501,
        tenantId,
        total: new Decimal(1000.0),
        paid: new Decimal(0),
        remaining: new Decimal(1000.0),
        date: new Date(),
      });
      txMock.treasury.findFirst.mockResolvedValue(null); // cross-tenant or missing

      await expect(
        OpenItemsService.allocateCustomerPayment(txMock, {
          tenantId,
          salesInvoiceId: 501,
          treasuryId: 701,
          amount: 500.0,
          allocatedBy: 'MANUAL_USER',
          sourceType: 'MANUAL',
          userId,
        })
      ).rejects.toThrow('Treasury entry not found or unauthorized.');
    });
  });

  describe('allocateSupplierPayment()', () => {
    it('6. should successfully allocate supplier payment to purchase invoice', async () => {
      txMock.purchaseInvoice.findFirst.mockResolvedValue({
        id: 601,
        tenantId,
        total: new Decimal(2000.0),
        paid: new Decimal(0),
        remaining: new Decimal(2000.0),
        date: new Date('2026-05-15'),
      });

      txMock.treasury.findFirst.mockResolvedValue({
        id: 702,
        tenantId,
        amount: new Decimal(2000.0),
        type: 'out', // payment going out
        date: new Date('2026-05-15'),
      });

      txMock.openItemMatching.findMany.mockResolvedValue([]);

      txMock.openItemMatching.create.mockResolvedValue({
        id: 902,
        tenantId,
        purchaseInvoiceId: 601,
        treasuryId: 702,
        amount: new Decimal(2000.0),
      });

      const result = await OpenItemsService.allocateSupplierPayment(txMock, {
        tenantId,
        purchaseInvoiceId: 601,
        treasuryId: 702,
        amount: 2000.0,
        allocatedBy: 'MANUAL_USER',
        sourceType: 'MANUAL',
        userId,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(902);

      expect(txMock.purchaseInvoice.update).toHaveBeenCalledWith({
        where: { id: 601 },
        data: expect.objectContaining({
          paid: new Decimal(2000.0),
          remaining: new Decimal(0),
          status: 'completed',
        }),
      });
    });
  });

  describe('reverseAllocation()', () => {
    it('7. should successfully reverse an active allocation and restore parent balances', async () => {
      txMock.openItemMatching.findFirst.mockResolvedValue({
        id: 901,
        tenantId,
        salesInvoiceId: 501,
        amount: new Decimal(400.0),
        status: 'ACTIVE',
      });

      txMock.salesInvoice.findUnique.mockResolvedValue({
        id: 501,
        tenantId,
        total: new Decimal(1000.0),
        paid: new Decimal(400.0),
        remaining: new Decimal(600.0),
      });

      await OpenItemsService.reverseAllocation(
        txMock,
        tenantId,
        901,
        userId,
        'Incorrect invoice match made by staff'
      );

      // Verify status changed to REVERSED
      expect(txMock.openItemMatching.update).toHaveBeenCalledWith({
        where: { id: 901 },
        data: expect.objectContaining({
          status: 'REVERSED',
          reversedBy: userId,
          reversalReason: 'Incorrect invoice match made by staff',
        }),
      });

      // Verify parent invoice remaining is fully restored
      expect(txMock.salesInvoice.update).toHaveBeenCalledWith({
        where: { id: 501 },
        data: expect.objectContaining({
          paid: new Decimal(0),
          remaining: new Decimal(1000.0),
          status: 'pending',
        }),
      });
    });

    it('8. should reject reversal if reason is too short', async () => {
      await expect(
        OpenItemsService.reverseAllocation(
          txMock,
          tenantId,
          901,
          userId,
          'Short' // too short (< 10 chars)
        )
      ).rejects.toThrow('A detailed reversal reason (minimum 10 characters) is strictly required.');
    });
  });
});
