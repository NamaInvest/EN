/**
 * Mock Seed Plan factories for financial scenarios.
 * Contains no dependencies on database writers.
 */

export interface SeedPlanWrapper {
  type: string;
  tenantId: string;
  payload: Record<string, any>;
}

export function buildChartOfAccountsSeedPlan(tenantId: string): SeedPlanWrapper {
  return {
    type: 'COA_SEED',
    tenantId,
    payload: {
      accounts: [
        { code: '1', name: 'Assets', type: 'ASSET' },
        { code: '11', name: 'Current Assets', parentCode: '1', type: 'ASSET' },
        { code: '110101', name: 'Cash in Hand', parentCode: '11', type: 'ASSET' },
        { code: '2', name: 'Liabilities', type: 'LIABILITY' },
        { code: '21', name: 'Current Liabilities', parentCode: '2', type: 'LIABILITY' },
        { code: '210101', name: 'Accounts Payable', parentCode: '21', type: 'LIABILITY' }
      ]
    }
  };
}

export function buildBalancedJournalSeedPlan(tenantId: string): SeedPlanWrapper {
  return {
    type: 'BALANCED_JOURNAL_SEED',
    tenantId,
    payload: {
      date: '2026-06-07',
      description: 'Balanced Ledger Seed Entry',
      lines: [
        { accountCode: '110101', debit: 500, credit: 0 },
        { accountCode: '210101', debit: 0, credit: 500 }
      ]
    }
  };
}

export function buildUnbalancedJournalSeedPlan(tenantId: string): SeedPlanWrapper {
  return {
    type: 'UNBALANCED_JOURNAL_SEED',
    tenantId,
    payload: {
      date: '2026-06-07',
      description: 'Unbalanced Ledger Seed Entry',
      lines: [
        { accountCode: '110101', debit: 500, credit: 0 },
        { accountCode: '210101', debit: 0, credit: 490 } // 10 diff
      ]
    }
  };
}

export function buildLockedPeriodSeedPlan(tenantId: string): SeedPlanWrapper {
  return {
    type: 'LOCKED_PERIOD_SEED',
    tenantId,
    payload: {
      period: '2026-01',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: 'LOCKED'
    }
  };
}

export function buildOpenItemSeedPlan(tenantId: string): SeedPlanWrapper {
  return {
    type: 'OPEN_ITEM_SEED',
    tenantId,
    payload: {
      invoiceId: 1001,
      customerName: 'Customer A',
      amountDue: 15000,
      currency: 'SAR'
    }
  };
}

export function buildFxRateSeedPlan(tenantId: string): SeedPlanWrapper {
  return {
    type: 'FX_RATE_SEED',
    tenantId,
    payload: {
      fromCurrency: 'USD',
      toCurrency: 'SAR',
      rate: 3.75,
      date: '2026-06-07'
    }
  };
}

export function buildPreviewOnlySeedPlan(tenantId: string): SeedPlanWrapper {
  return {
    type: 'PREVIEW_ONLY_SEED',
    tenantId,
    payload: {
      previewMode: true,
      simulationType: 'DEPRECIATION_RUN',
      targetAssetId: 44
    }
  };
}
