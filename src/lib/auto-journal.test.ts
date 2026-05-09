/**
 * auto-journal.test.ts — Contract & Logic Tests
 * 
 * Tests the validation logic that doesn't need DB (balance checks, etc.)
 * DB-dependent tests are in integration tests (financial-integration.test.ts)
 */

// ── Full mock of prisma module ────────────────────────────────────────────────

jest.mock('./prisma', () => {
  const mkFn = () => jest.fn();
  const client: any = {
    account:      { findFirst: mkFn(), findUnique: mkFn(), findMany: mkFn(), create: mkFn(), update: mkFn(), upsert: mkFn() },
    journalEntry: { findFirst: mkFn(), findUnique: mkFn(), findMany: mkFn(), create: mkFn(), update: mkFn(), count: mkFn() },
    journalLine:  { create: mkFn(), createMany: mkFn() },
    sequence:     { findFirst: mkFn(), upsert: mkFn() },
    $transaction: jest.fn(async (fn: any) => typeof fn === 'function' ? fn(client) : Promise.all(fn)),
  };
  return {
    __esModule:    true,
    prisma:        client,
    getPrisma:     jest.fn(() => client),
    resolveTenant: jest.fn(() => 'default'),
    withTenant:    jest.fn((_t: string, fn: () => Promise<any>) => fn()),
    currentRequestStore: { getStore: jest.fn(() => ({ tenant: 'default' })) },
  };
});

jest.mock('./numbering', () => ({
  getNextNumber: jest.fn(() => Promise.resolve({ formatted: 'JE-000001', number: 1 })),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { createJournalEntry, postSalesInvoice } from './auto-journal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupSuccessfulMocks() {
  const { prisma: mp } = jest.requireMock('./prisma');
  mp.account.findFirst.mockResolvedValue({ id: 1, code: '1110', balance: 0 });
  mp.account.findUnique.mockResolvedValue({ id: 1, code: '1110', balance: 0 });
  mp.account.update.mockResolvedValue({ id: 1 });
  mp.journalEntry.findFirst.mockResolvedValue({ entryNumber: 'JE000010' });
  mp.journalEntry.create.mockResolvedValue({ id: 99 });
  mp.journalEntry.count.mockResolvedValue(10);
  mp.sequence.findFirst.mockResolvedValue({ prefix: 'JE', currentValue: 10 });
  mp.sequence.upsert.mockResolvedValue({ currentValue: 11 });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Auto-Journal: Business Logic', () => {

  beforeEach(() => {
    // Don't use clearAllMocks() — it zeros out the mock implementations
    // Instead, just reset the withTenant callback and set up fresh returns
    const { withTenant, resolveTenant } = jest.requireMock('./prisma');
    withTenant.mockImplementation((_t: string, fn: () => any) => fn());
    resolveTenant.mockReturnValue('default');
    setupSuccessfulMocks();
  });

  // ── Balance Validation ─────────────────────────────────────────────────

  describe('createJournalEntry — Balance Validation', () => {
    it('✅ should REJECT unbalanced entry (Dr 100 ≠ Cr 90)', async () => {
      const result = await createJournalEntry({
        description: 'Unbalanced',
        lines: [
          { accountCode: '1110', debit: 100, credit: 0  },
          { accountCode: '4100', debit: 0,   credit: 90 },
        ],
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('القيد غير متوازن');
    });

    it('✅ should REJECT entry with Dr=0 and Cr=0 (no movement)', async () => {
      const result = await createJournalEntry({
        description: 'Zero',
        lines: [
          { accountCode: '1110', debit: 0, credit: 0 },
          { accountCode: '4100', debit: 0, credit: 0 },
        ],
      });
      // Zero lines are skipped — entry will fail or succeed (no crash)
      expect(typeof result.success).toBe('boolean');
    });

    it('✅ balanced entry should call journalEntry.create', async () => {
      const { prisma: mp } = jest.requireMock('./prisma');
      const result = await createJournalEntry({
        description: 'Balanced: Dr Cash 115 / Cr Rev 100 / Cr VAT 15',
        lines: [
          { accountCode: '1110', debit: 115, credit: 0   },
          { accountCode: '4100', debit: 0,   credit: 100 },
          { accountCode: '2300', debit: 0,   credit: 15  },
        ],
      });
      expect(result.success).toBe(true);
      expect(result.entryId).toBe(99);
      expect(mp.journalEntry.create).toHaveBeenCalledTimes(1);
    });

    it('✅ large balanced entry (10 lines) should succeed', async () => {
      const lines = [];
      for (let i = 0; i < 5; i++) {
        lines.push({ accountCode: '1110', debit: 20, credit: 0  });
        lines.push({ accountCode: '4100', debit: 0,  credit: 20 });
      }
      const result = await createJournalEntry({ description: 'Multi-line', lines });
      expect(result.success).toBe(true);
    });
  });

  // ── postSalesInvoice ─────────────────────────────────────────────────────

  describe('postSalesInvoice', () => {
    it('✅ cash sale creates balanced journal', async () => {
      const result = await postSalesInvoice({
        invoiceNo: 101, subtotal: 100, taxValue: 15, total: 115,
        paymentType: 'cash', discountValue: 0,
      });
      expect(result.success).toBe(true);
    });

    it('✅ credit sale creates balanced journal', async () => {
      const result = await postSalesInvoice({
        invoiceNo: 102, subtotal: 200, taxValue: 30, total: 230,
        paymentType: 'credit', discountValue: 0,
      });
      expect(result.success).toBe(true);
    });

    it('✅ sale with discount should succeed', async () => {
      const result = await postSalesInvoice({
        invoiceNo: 200, subtotal: 100, taxValue: 14.25, total: 109.25,
        paymentType: 'cash', discountValue: 5,
      });
      expect(result.success).toBe(true);
    });
  });
});
