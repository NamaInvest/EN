import { FXRevaluationEngine } from '../lib/fx-revaluation-engine';

describe('FX-02A: Bank Monthly FX Revaluation Engine Preview Tests', () => {
  const mockTenantId = 'test-tenant-fx';
  const targetDate = new Date('2026-05-31');

  // Seed currencies
  const mockCurrencies = [
    { id: 10, code: 'USD', isActive: true, tenantId: mockTenantId },
    { id: 11, code: 'EUR', isActive: true, tenantId: mockTenantId },
    { id: 12, code: 'KWD', isActive: true, tenantId: mockTenantId },
  ];

  // Seed spot exchange rates on 2026-05-31
  const mockExchangeRates = [
    { id: 1, currencyId: 10, rate: 3.75, date: new Date('2026-05-31'), tenantId: mockTenantId },
    { id: 2, currencyId: 11, rate: 4.10, date: new Date('2026-05-31'), tenantId: mockTenantId },
    // KWD exchange rate is purposefully omitted to test MISSING_EXCHANGE_RATE
  ];

  // Mock operational bank accounts
  const mockBankAccounts = [
    {
      id: 5,
      tenantId: mockTenantId,
      bankName: 'AlRajhi Bank USD',
      accountName: 'USD Operational',
      accountNumber: 'SA800000000000000000005',
      currency: 'USD',
      currentBalance: 10000.00,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 6,
      tenantId: mockTenantId,
      bankName: 'SNB Bank EUR',
      accountName: 'EUR Operational',
      accountNumber: 'SA800000000000000000006',
      currency: 'EUR',
      currentBalance: 5000.00,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 7,
      tenantId: mockTenantId,
      bankName: 'Riyad Bank SAR',
      accountName: 'SAR Main',
      accountNumber: 'SA800000000000000000007',
      currency: 'SAR',
      currentBalance: 250000.00,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 8,
      tenantId: mockTenantId,
      bankName: 'SABB Bank USD',
      accountName: 'USD Unmapped',
      accountNumber: 'SA800000000000000000008',
      currency: 'USD',
      currentBalance: 2000.00,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 9,
      tenantId: mockTenantId,
      bankName: 'Gulf Bank KWD',
      accountName: 'KWD Operational',
      accountNumber: 'SA800000000000000000009',
      currency: 'KWD',
      currentBalance: 1000.00,
      isActive: true,
      deletedAt: null,
    },
    {
      id: 15,
      tenantId: mockTenantId,
      bankName: 'Arab National Bank USD',
      accountName: 'USD Zero Difference',
      accountNumber: 'SA800000000000000000015',
      currency: 'USD',
      currentBalance: 4000.00,
      isActive: true,
      deletedAt: null,
    },
  ];

  // Mock settings for bank-to-GL mapping and gain/loss accounts
  const mockSettings = [
    { key: 'GL_BANK_MAPPING_5', value: '110201', tenantId: mockTenantId }, // Mapped USD AlRajhi
    { key: 'GL_BANK_MAPPING_6', value: '110202', tenantId: mockTenantId }, // Mapped EUR SNB
    { key: 'GL_BANK_MAPPING_9', value: '110203', tenantId: mockTenantId }, // Mapped KWD Gulf (Missing rate)
    { key: 'GL_BANK_MAPPING_15', value: '110205', tenantId: mockTenantId }, // Mapped USD ANB (Zero diff)
    { key: 'FX_GAIN_GL_CODE', value: '8101', tenantId: mockTenantId },
    { key: 'FX_LOSS_GL_CODE', value: '8102', tenantId: mockTenantId },
  ];

  // Mock ledger accounts
  const mockAccounts = [
    { id: 110201, code: '110201', name: 'AlRajhi USD Ledger Account', isActive: true, tenantId: mockTenantId },
    { id: 110202, code: '110202', name: 'SNB EUR Ledger Account', isActive: true, tenantId: mockTenantId },
    { id: 110203, code: '110203', name: 'Gulf KWD Ledger Account', isActive: true, tenantId: mockTenantId },
    { id: 110205, code: '110205', name: 'ANB USD Ledger Account', isActive: true, tenantId: mockTenantId },
    { id: 8101, code: '8101', name: 'Unrealized FX Gain Account', isActive: true, tenantId: mockTenantId },
    { id: 8102, code: '8102', name: 'Unrealized FX Loss Account', isActive: true, tenantId: mockTenantId },
  ];

  // Mock journal entries and lines to compute ledger balances
  const mockJournalLines = [
    // AlRajhi USD (id 5, gl 110201): historical FCY = 10000 USD, historical SAR = 37000 SAR
    { accountId: 110201, foreignDebit: 10000, foreignCredit: 0, debit: 37000, credit: 0, tenantId: mockTenantId },
    // SNB EUR (id 6, gl 110202): historical FCY = 5000 EUR, historical SAR = 21000 SAR
    { accountId: 110202, foreignDebit: 5000, foreignCredit: 0, debit: 21000, credit: 0, tenantId: mockTenantId },
    // ANB USD (id 15, gl 110205): historical FCY = 4000 USD, historical SAR = 15000 SAR (Exactly 3.75 carrying rate)
    { accountId: 110205, foreignDebit: 4000, foreignCredit: 0, debit: 15000, credit: 0, tenantId: mockTenantId },
  ];

  it('should correctly process Bank FX Revaluation preview matching SOCPA rules', async () => {
    const mockTx = {
      bankAccount: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(mockBankAccounts.filter(b => b.tenantId === where.tenantId));
        }),
      },
      setting: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const setting = mockSettings.find(s => s.key === where.key && s.tenantId === where.tenantId);
          return Promise.resolve(setting || null);
        }),
      },
      account: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const account = mockAccounts.find(a => a.code === where.code && a.tenantId === where.tenantId);
          return Promise.resolve(account || null);
        }),
      },
      journalLine: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          const lines = mockJournalLines.filter(l => l.accountId === where.accountId && l.tenantId === where.tenantId);
          return Promise.resolve(lines);
        }),
      },
      currency: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const currency = mockCurrencies.find(c => c.code === where.code && c.tenantId === where.tenantId);
          return Promise.resolve(currency || null);
        }),
      },
      exchangeRate: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          const rate = mockExchangeRates.find(r => r.currencyId === where.currencyId && r.tenantId === where.tenantId);
          return Promise.resolve(rate || null);
        }),
      },
    };

    const result = await FXRevaluationEngine.previewBank(mockTx as any, mockTenantId, targetDate);

    expect(result).toBeDefined();
    expect(result.tenantId).toBe(mockTenantId);
    expect(result.revalDate).toBe('2026-05-31');
    expect(result.baseCurrency).toBe('SAR');

    // 1. AlRajhi Bank USD (Mapped, Gain scenario)
    // 10000 USD, original total 37000 SAR. Closing rate 3.75 -> 37500 SAR.
    // Gain = +500 SAR
    const alrajhiLine = result.lines.find((l: any) => l.bankAccountId === 5);
    expect(alrajhiLine).toBeDefined();
    expect(alrajhiLine.glAccountCode).toBe('110201');
    expect(alrajhiLine.operationalBalance).toBe(10000);
    expect(alrajhiLine.ledgerFcyBalance).toBe(10000);
    expect(alrajhiLine.carryingVariance).toBe(0);
    expect(alrajhiLine.historicalRate).toBe(3.7);
    expect(alrajhiLine.closingRate).toBe(3.75);
    expect(alrajhiLine.sarAtHistorical).toBe(37000);
    expect(alrajhiLine.sarAtClosing).toBe(37500);
    expect(alrajhiLine.unrealizedGainLoss).toBe(500);
    expect(alrajhiLine.direction).toBe('GAIN');
    expect(alrajhiLine.status).toBe('SUCCESS');
    expect(alrajhiLine.reference).toBe('FX_REVAL_BANK_2026_05_5');

    // 2. SNB EUR (Mapped, Loss scenario)
    // 5000 EUR, original total 21000 SAR. Closing rate 4.10 -> 20500 SAR.
    // Loss = -500 SAR
    const snbLine = result.lines.find((l: any) => l.bankAccountId === 6);
    expect(snbLine).toBeDefined();
    expect(snbLine.glAccountCode).toBe('110202');
    expect(snbLine.unrealizedGainLoss).toBe(-500);
    expect(snbLine.direction).toBe('LOSS');
    expect(snbLine.status).toBe('SUCCESS');
    expect(snbLine.reference).toBe('FX_REVAL_BANK_2026_05_6');

    // 3. Riyad Bank SAR (Local currency account)
    // Must be completely skipped
    const riyadLine = result.lines.find((l: any) => l.bankAccountId === 7);
    expect(riyadLine).toBeUndefined();

    // 4. SABB USD (Unmapped Bank Account)
    // Must trigger UNMAPPED status and have glAccountCode as null
    const sabbLine = result.lines.find((l: any) => l.bankAccountId === 8);
    expect(sabbLine).toBeDefined();
    expect(sabbLine.glAccountCode).toBeNull();
    expect(sabbLine.status).toBe('UNMAPPED');
    expect(sabbLine.error).toContain('Unmapped bank account');

    // 5. Gulf Bank KWD (Missing exchange rate)
    // Must trigger MISSING_EXCHANGE_RATE status
    const gulfLine = result.lines.find((l: any) => l.bankAccountId === 9);
    expect(gulfLine).toBeDefined();
    expect(gulfLine.status).toBe('MISSING_EXCHANGE_RATE');
    expect(gulfLine.error).toContain('Missing exchange rate');

    // 6. ANB USD (Zero Difference scenario)
    // 4000 USD, original total 15000 SAR. Closing rate 3.75 -> 15000 SAR.
    // Must trigger ZERO_DIFFERENCE status and unrealizedGainLoss must be 0
    const anbLine = result.lines.find((l: any) => l.bankAccountId === 15);
    expect(anbLine).toBeDefined();
    expect(anbLine.unrealizedGainLoss).toBe(0);
    expect(anbLine.direction).toBe('NONE');
    expect(anbLine.status).toBe('ZERO_DIFFERENCE');

    // Total Aggregates:
    // Total Gain = 500
    // Total Loss = 500
    // Net = 0
    expect(result.totalGain).toBe(500);
    expect(result.totalLoss).toBe(500);
    expect(result.totalUnrealized).toBe(0);

    // Projected Journal lines verification:
    // USD AlRajhi Gain (+500):
    // Debit 110201: 500, Credit 8101: 500
    // EUR SNB Loss (-500):
    // Debit 8102: 500, Credit 110202: 500
    expect(result.projectedJournalLines.length).toBe(4);
    
    const debitAlrajhi = result.projectedJournalLines.find((j: any) => j.accountCode === '110201' && j.debit === 500);
    expect(debitAlrajhi).toBeDefined();

    const creditGain = result.projectedJournalLines.find((j: any) => j.accountCode === '8101' && j.credit === 500);
    expect(creditGain).toBeDefined();

    const debitLoss = result.projectedJournalLines.find((j: any) => j.accountCode === '8102' && j.debit === 500);
    expect(debitLoss).toBeDefined();

    const creditSnb = result.projectedJournalLines.find((j: any) => j.accountCode === '110202' && j.credit === 500);
    expect(creditSnb).toBeDefined();
  });

  it('should enforce strict tenant isolation safety', async () => {
    const mockTx = {
      bankAccount: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          // Should only filter by the requested tenant
          return Promise.resolve(mockBankAccounts.filter(b => b.tenantId === where.tenantId));
        }),
      },
      setting: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const emptyResult = await FXRevaluationEngine.previewBank(mockTx as any, 'tenant-empty-isolated', targetDate);
    expect(emptyResult.lines.length).toBe(0);
    expect(emptyResult.totalGain).toBe(0);
    expect(emptyResult.totalLoss).toBe(0);
  });
});
