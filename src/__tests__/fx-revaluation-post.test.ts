import { FXRevaluationEngine } from '../lib/fx-revaluation-engine';
import { assertPeriodWritable, PeriodLockViolation } from '../lib/governance/period-lock';
import { AccountingJournalService } from '../lib/services/accounting-journal.service';

// Mock period-lock governance
jest.mock('../lib/governance/period-lock', () => {
  const original = jest.requireActual('../lib/governance/period-lock');
  return {
    ...original,
    assertPeriodWritable: jest.fn().mockResolvedValue('ALLOWED'),
  };
});

// Mock AccountingJournalService to prevent DB hits
jest.mock('../lib/services/accounting-journal.service', () => ({
  AccountingJournalService: {
    getAccountId: jest.fn().mockResolvedValue(12345),
    createEntry: jest.fn().mockImplementation((tx, params) => {
      return Promise.resolve({
        id: Math.floor(Math.random() * 1000) + 1,
        entryNumber: `JE-${params.reference || '123'}`,
      });
    }),
  },
}));

describe('FX-01B: AR/AP Monthly FX Revaluation Real Posting Engine Tests', () => {
  const mockTenantId = 'test-tenant-fx-post';
  const targetDate = new Date('2026-05-31');

  // Mocks matching mock preview test
  const mockCurrencies = [
    { id: 10, code: 'USD', isActive: true, tenantId: mockTenantId },
  ];

  const mockExchangeRates = [
    { currencyId: 10, rate: 3.75, date: new Date('2026-05-31') }, // USD Spot Close
  ];

  const mockSalesInvoices = [
    {
      id: 1,
      invoiceNo: 5001,
      tenantId: mockTenantId,
      currencyId: 10,
      exchangeRate: 3.70, // Original rate
      remaining: 1000, // FCY Balance (Asset)
      deletedAt: null,
      status: 'pending',
      currency: { code: 'USD' },
      customer: { fullName: 'Almarai Corp' },
    },
  ];

  const mockPurchaseInvoices = [
    {
      id: 101,
      invoiceNo: 9001,
      tenantId: mockTenantId,
      currencyId: 10,
      exchangeRate: 3.80, // Original rate (decreased to 3.75 = Gain for liability)
      remaining: 3000, // FCY Balance (Liability)
      deletedAt: null,
      status: 'pending',
      currency: { code: 'USD' },
      supplier: { fullName: 'AWS Cloud Services' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully post FX revaluation journal entry and immediately generate auto-reversals', async () => {
    // Mock the transactional prisma client
    const mockTx = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 12345 }),
      },
      currency: {
        findMany: jest.fn().mockResolvedValue(mockCurrencies),
      },
      exchangeRate: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const rate = mockExchangeRates.find(r => r.currencyId === where.currencyId);
          return Promise.resolve(rate);
        }),
      },
      salesInvoice: {
        findMany: jest.fn().mockResolvedValue(mockSalesInvoices),
      },
      purchaseInvoice: {
        findMany: jest.fn().mockResolvedValue(mockPurchaseInvoices),
      },
      journalEntry: {
        findFirst: jest.fn().mockResolvedValue(null), // No duplicate exists
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const results = await FXRevaluationEngine.postARAP(
      mockTx as any,
      mockTenantId,
      targetDate,
      123, // userId
      1    // branchId
    );

    expect(results).toBeDefined();
    expect(results.length).toBe(1); // USD revaluation posted

    const usdRun = results[0];
    expect(usdRun.currency).toBe('USD');
    expect(usdRun.reference).toBe('FX_REVAL_ARAP_2026_05_USD');
    expect(usdRun.totalGain).toBe(200); // 50 (AR USD) + 150 (AP USD)
    expect(usdRun.totalLoss).toBe(0);
    expect(usdRun.linesCount).toBe(2);

    // Verify assertPeriodWritable was called for both revaluation and reversal dates
    expect(assertPeriodWritable).toHaveBeenCalledTimes(2);

    // Verify createEntry was called twice (once for revaluation, once for reversal)
    expect(AccountingJournalService.createEntry).toHaveBeenCalledTimes(2);

    // Verify journalEntry updates occurred (to set autoReverseDate/isReversal details)
    expect(mockTx.journalEntry.update).toHaveBeenCalledTimes(2);

    // Verify Audit Log was generated
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it('should throw an error and prevent double posting if a revaluation already exists', async () => {
    const mockTx = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 12345 }),
      },
      currency: {
        findMany: jest.fn().mockResolvedValue(mockCurrencies),
      },
      exchangeRate: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const rate = mockExchangeRates.find(r => r.currencyId === where.currencyId);
          return Promise.resolve(rate);
        }),
      },
      journalEntry: {
        findFirst: jest.fn().mockResolvedValue({ id: 99 }), // Duplicate exists!
      },
    };

    await expect(
      FXRevaluationEngine.postARAP(mockTx as any, mockTenantId, targetDate, 123)
    ).rejects.toThrow('FX Revaluation for USD in period 2026-05 has already been posted.');

    expect(AccountingJournalService.createEntry).not.toHaveBeenCalled();
  });

  it('should reject posting and propagate error if period-lock validation rejects the targetDate', async () => {
    // Force assertPeriodWritable to throw PeriodLockViolation
    (assertPeriodWritable as jest.Mock).mockRejectedValueOnce(
      new PeriodLockViolation('الفترة المحاسبية 2026-05 مغلقة نهائياً (CLOSED).', 'LOCKED')
    );

    const mockTx = {};

    await expect(
      FXRevaluationEngine.postARAP(mockTx as any, mockTenantId, targetDate, 123)
    ).rejects.toThrow('الفترة المحاسبية 2026-05 مغلقة نهائياً (CLOSED).');

    expect(AccountingJournalService.createEntry).not.toHaveBeenCalled();
  });
});
