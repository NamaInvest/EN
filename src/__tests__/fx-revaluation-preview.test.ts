import { FXRevaluationEngine } from '../lib/fx-revaluation-engine';

describe('FX-01A: AR/AP Monthly FX Revaluation Engine Preview Tests', () => {
  const mockTenantId = 'test-tenant-fx';
  const targetDate = new Date('2026-05-31');

  // Helper mocks for currency and exchange rate data
  const mockCurrencies = [
    { id: 10, code: 'USD', isActive: true, tenantId: mockTenantId },
    { id: 11, code: 'EUR', isActive: true, tenantId: mockTenantId },
  ];

  const mockExchangeRates = [
    { currencyId: 10, rate: 3.75, date: new Date('2026-05-31') }, // USD Spot Close
    { currencyId: 11, rate: 4.10, date: new Date('2026-05-31') }, // EUR Spot Close
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
    {
      id: 2,
      invoiceNo: 5002,
      tenantId: mockTenantId,
      currencyId: 11,
      exchangeRate: 4.20, // Original rate (decreased to 4.10 = Loss)
      remaining: 2000, // FCY Balance (Asset)
      deletedAt: null,
      status: 'pending',
      currency: { code: 'EUR' },
      customer: { fullName: 'Panda Retail' },
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

  it('should correctly calculate FX revaluation preview with gains and losses on AR/AP invoices', async () => {
    // Mock the transactional prisma client
    const mockTx = {
      setting: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      account: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.code === '1101') return Promise.resolve({ id: 1101, code: '1101', isActive: true, type: 'asset' });
          if (where.code === '2101') return Promise.resolve({ id: 2101, code: '2101', isActive: true, type: 'liability' });
          if (where.code === '8101') return Promise.resolve({ id: 8101, code: '8101', isActive: true, type: 'revenue' });
          if (where.code === '8102') return Promise.resolve({ id: 8102, code: '8102', isActive: true, type: 'expense' });
          return Promise.resolve(null);
        }),
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
    };

    const result = await FXRevaluationEngine.previewARAP(mockTx as any, mockTenantId, targetDate);

    expect(result).toBeDefined();
    expect(result.tenantId).toBe(mockTenantId);
    expect(result.revalDate).toBe('2026-05-31');
    expect(result.baseCurrency).toBe('SAR');

    // AR Invoice #1 (USD): 1000 USD, original 3.70, closing 3.75
    // Historical SAR = 3700, Closing SAR = 3750, Gain = +50 SAR
    const arUsdLine = result.lines.find((l: any) => l.documentNo === '5001');
    expect(arUsdLine).toBeDefined();
    expect(arUsdLine.unrealizedGainLoss).toBe(50);
    expect(arUsdLine.direction).toBe('GAIN');

    // AR Invoice #2 (EUR): 2000 EUR, original 4.20, closing 4.10
    // Historical SAR = 8400, Closing SAR = 8200, Loss = -200 SAR
    const arEurLine = result.lines.find((l: any) => l.documentNo === '5002');
    expect(arEurLine).toBeDefined();
    expect(arEurLine.unrealizedGainLoss).toBe(-200);
    expect(arEurLine.direction).toBe('LOSS');

    // AP Invoice #9001 (USD): 3000 USD, original 3.80, closing 3.75 (Liability decrease = Gain)
    // Historical SAR = 11400, Closing SAR = 11250, Gain = +150 SAR
    const apUsdLine = result.lines.find((l: any) => l.documentNo === '9001');
    expect(apUsdLine).toBeDefined();
    expect(apUsdLine.unrealizedGainLoss).toBe(150);
    expect(apUsdLine.direction).toBe('GAIN');

    // Aggregates:
    // Total Gain = 50 (AR USD) + 150 (AP USD) = 200
    // Total Loss = 200 (AR EUR)
    // Net Unrealized = 200 - 200 = 0
    expect(result.totalGain).toBe(200);
    expect(result.totalLoss).toBe(200);
    expect(result.totalUnrealized).toBe(0);

    // Projected Journal lines length should match 2 lines per revalued invoice line (3 lines × 2 = 6 entries)
    expect(result.projectedJournalLines.length).toBe(6);
  });

  it('should throw a safe and clear error when a closing exchange rate is missing', async () => {
    // Mock where EUR rate is missing (returns null)
    const mockTx = {
      setting: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      account: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.code === '1101') return Promise.resolve({ id: 1101, code: '1101', isActive: true, type: 'asset' });
          if (where.code === '2101') return Promise.resolve({ id: 2101, code: '2101', isActive: true, type: 'liability' });
          if (where.code === '8101') return Promise.resolve({ id: 8101, code: '8101', isActive: true, type: 'revenue' });
          if (where.code === '8102') return Promise.resolve({ id: 8102, code: '8102', isActive: true, type: 'expense' });
          return Promise.resolve(null);
        }),
      },
      currency: {
        findMany: jest.fn().mockResolvedValue(mockCurrencies),
      },
      exchangeRate: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          // Force EUR (id 11) to be missing/null
          if (where.currencyId === 11) {
            return Promise.resolve(null);
          }
          const rate = mockExchangeRates.find(r => r.currencyId === where.currencyId);
          return Promise.resolve(rate);
        }),
      },
      salesInvoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      purchaseInvoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    await expect(
      FXRevaluationEngine.previewARAP(mockTx as any, mockTenantId, targetDate)
    ).rejects.toThrow('Missing closing exchange rate for EUR on 2026-05-31');
  });
});
