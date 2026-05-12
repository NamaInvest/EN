---
version: 1.0
last_updated: 2026-05-12
---

# Testing Strategy

## الهرم (Test Pyramid)

```
       ┌─────────────────┐
       │   E2E (50)      │  Playwright — critical journeys فقط
       ├─────────────────┤
       │ Integration (300) │  Vitest — API + DB
       ├─────────────────┤
       │   Unit (3000)    │  Vitest — engines + utils
       └─────────────────┘
```

## Coverage Targets

| النطاق | Target | السبب |
|---|---|---|
| `src/lib/auto-journal.ts` | 100% | محاسبي حرج |
| `src/lib/zatca-*.ts` | 100% | gov compliance |
| `src/lib/*-engine.ts` (accounting) | 95% | financial integrity |
| `src/lib/depreciation*.ts` | 100% | accuracy critical |
| `src/lib/numbering*.ts` | 100% | gap-free sequences |
| `src/lib/eos-*.ts` | 100% | Saudi labor law |
| `src/lib/wps-generator.ts` | 100% | bank file integrity |
| `src/lib/*-engine.ts` (rest) | 85% | core domain |
| `src/app/api/**/route.ts` | 80% | contracts |
| `src/app/**/page.tsx` | 60% | E2E covers more |
| `src/components/**` | 70% | reusable |

## Unit Tests

### مثال — auto-journal balance

```typescript
// src/lib/__tests__/auto-journal.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { postJournal } from '../auto-journal';
import { mockTx, mockAccount } from './_helpers';

describe('auto-journal', () => {
  let tx: any;
  beforeEach(() => { tx = mockTx(); });

  it('rejects unbalanced lines', async () => {
    await expect(postJournal(tx, {
      scenario: 'MANUAL',
      tenantId: 't1',
      sourceDocumentId: 's1',
      sourceDocumentType: 'Manual',
      date: new Date(),
      lines: [
        { accountId: 'cash', debit: 100, credit: 0 },
        { accountId: 'ar', debit: 0, credit: 99 },  // imbalance
      ],
    })).rejects.toThrow('Unbalanced');
  });

  it('accepts within tolerance 0.01', async () => {
    const je = await postJournal(tx, {
      scenario: 'MANUAL',
      tenantId: 't1',
      sourceDocumentId: 's1',
      sourceDocumentType: 'Manual',
      date: new Date(),
      lines: [
        { accountId: 'cash', debit: 100.005, credit: 0 },
        { accountId: 'ar', debit: 0, credit: 100.00 },
      ],
    });
    expect(je.status).toBe('POSTED');
  });

  it('blocks manual posting to control account', async () => {
    mockAccount(tx, 'receivables-control', { isControl: true });
    await expect(postJournal(tx, {
      scenario: 'MANUAL',
      tenantId: 't1', sourceDocumentId: 's1', sourceDocumentType: 'Manual',
      date: new Date(),
      lines: [
        { accountId: 'receivables-control', debit: 100, credit: 0 },
        { accountId: 'revenue', debit: 0, credit: 100 },
      ],
    })).rejects.toThrow('control account');
  });

  it('blocks posting to closed period', async () => {
    // mock period as CLOSED
    await expect(postJournal(tx, {
      scenario: 'MANUAL',
      tenantId: 't1', sourceDocumentId: 's1', sourceDocumentType: 'Manual',
      date: new Date('2026-01-15'),  // closed period
      lines: [
        { accountId: 'cash', debit: 100, credit: 0 },
        { accountId: 'revenue', debit: 0, credit: 100 },
      ],
    })).rejects.toThrow('Period closed');
  });

  it('builds SALES_INVOICE journal correctly', async () => {
    const je = await postJournal(tx, {
      scenario: 'SALES_INVOICE',
      tenantId: 't1', sourceDocumentId: 'inv1', sourceDocumentType: 'SalesInvoice',
      date: new Date(),
      lines: buildSalesInvoiceJELines({
        subtotal: 10000, vat: 1500, cogs: 6000, inventory: 6000,
      }),
    });
    expect(sum(je.lines, 'debit')).toBe(17500);
    expect(sum(je.lines, 'credit')).toBe(17500);
    expect(je.lines.find(l => l.accountId === 'AR')?.debit).toBe(11500);
    expect(je.lines.find(l => l.accountId === 'VAT_OUTPUT')?.credit).toBe(1500);
  });
});
```

### مثال — depreciation

```typescript
describe('depreciation-engine', () => {
  it('straight-line monthly', () => {
    const result = computeDepreciation({
      cost: 12000, residual: 0, lifeMonths: 60, method: 'STRAIGHT_LINE',
      asOfMonth: 12,
    });
    expect(result.monthlyAmount).toBe(200);
    expect(result.accumulated).toBe(2400);
    expect(result.netBookValue).toBe(9600);
  });

  it('declining-balance 2x', () => {
    const r1 = computeDepreciation({ cost: 10000, residual: 0, lifeMonths: 60, method: 'DECLINING_2X', asOfMonth: 1 });
    // year 1: 40% * 10000 / 12 = 333.33
    expect(r1.monthlyAmount).toBeCloseTo(333.33, 1);
  });

  it('units-of-production', () => {
    const r = computeDepreciation({
      cost: 100000, residual: 10000, totalUnits: 1000000,
      method: 'UNITS', actualUnitsThisPeriod: 5000,
    });
    expect(r.periodAmount).toBe(450); // (100K-10K)/1M * 5K
  });
});
```

### مثال — EOS calculator

```typescript
describe('eos-calculator', () => {
  it('< 2 years = 0', () => {
    expect(computeEOS({
      basicSalary: 5000, hireDate: '2024-01-01', endDate: '2025-06-01',
      reason: 'TERMINATION',
    })).toBe(0);
  });

  it('2-5 years: half month per year', () => {
    expect(computeEOS({
      basicSalary: 6000, hireDate: '2023-01-01', endDate: '2026-01-01',
      reason: 'TERMINATION',
    })).toBe(9000); // 3 years * 0.5 * 6000
  });

  it('> 5 years: half × 5 + full × (years - 5)', () => {
    expect(computeEOS({
      basicSalary: 6000, hireDate: '2018-01-01', endDate: '2026-01-01',
      reason: 'TERMINATION',
    })).toBe(33000); // 5*0.5*6000 + 3*1*6000 = 15000 + 18000
  });

  it('resignation reduces benefit per Saudi Labor Law', () => {
    // Resigned after 4 years: gets 1/3 of half-month-per-year
    expect(computeEOS({
      basicSalary: 6000, hireDate: '2022-01-01', endDate: '2026-01-01',
      reason: 'RESIGNATION',
    })).toBeCloseTo(4000, 0); // 4 * 0.5 * 6000 * 1/3
  });
});
```

## Integration Tests

```typescript
// src/__tests__/integration/sales-invoice-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestTenant, cleanupTestTenant } from './_helpers';

describe('Sales Invoice Flow (integration)', () => {
  let tenant: any;
  beforeAll(async () => { tenant = await setupTestTenant(); });
  afterAll(async () => { await cleanupTestTenant(tenant.id); });

  it('creates invoice → posts JE → updates AR → reflects on aging', async () => {
    const customer = await createCustomer(tenant.id, { name: 'Test', creditLimit: 50000 });
    const product = await createProduct(tenant.id, { code: 'P1', cost: 30, price: 100 });
    
    // 1. Create invoice
    const invoice = await api.post('/api/sales/invoices', {
      customerId: customer.id,
      invoiceDate: new Date().toISOString(),
      lines: [{ productId: product.id, qty: 5, unitPrice: 100 }],
    }, { tenantId: tenant.id });
    
    expect(invoice.status).toBe('POSTED');
    expect(invoice.grandTotal).toBe(575); // 500 + 75 VAT
    
    // 2. Verify journal
    const je = await prisma.journalEntry.findFirst({
      where: { tenantId: tenant.id, sourceDocumentId: invoice.id },
      include: { lines: true },
    });
    expect(je).toBeTruthy();
    expect(sumDebit(je!.lines)).toBe(sumCredit(je!.lines));
    
    // 3. AR balance updated
    const ar = await getCustomerBalance(tenant.id, customer.id);
    expect(ar).toBe(575);
    
    // 4. Aging report shows it
    const aging = await api.get(`/api/reports/aging?customerId=${customer.id}`);
    expect(aging.data[0].current).toBe(575);
    
    // 5. Stock reduced
    const stock = await getProductStock(tenant.id, product.id);
    expect(stock.qty).toBe(-5);
    
    // 6. COGS in GL
    const cogsLine = je!.lines.find(l => l.account?.code === '5101'); // COGS
    expect(cogsLine?.debit).toBe(150); // 5 × 30
  });
});
```

## E2E Tests (Playwright)

```typescript
// e2e/sales-invoice-create.spec.ts
import { test, expect } from '@playwright/test';

test('Sales rep creates invoice end-to-end', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'sales@test.sa');
  await page.fill('[name=password]', 'test123');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL(/\/dashboard/);
  
  await page.click('text=المبيعات');
  await page.click('text=فاتورة جديدة');
  
  await page.fill('[data-testid=customer-search]', 'ABC');
  await page.click('text=ABC Trading Co.');
  
  await page.click('[data-testid=add-line]');
  await page.fill('[data-testid=product-search-0]', 'P-001');
  await page.click('text=P-001 — Widget');
  await page.fill('[data-testid=qty-0]', '10');
  await page.fill('[data-testid=unit-price-0]', '100');
  
  await expect(page.locator('[data-testid=grand-total]')).toHaveText('1,150.00 ر.س');
  
  await page.click('text=حفظ');
  await expect(page.locator('text=تم إنشاء الفاتورة بنجاح')).toBeVisible();
  await expect(page).toHaveURL(/\/sales\/invoices\/inv_/);
  
  // ZATCA QR code should appear within 30s
  await expect(page.locator('[data-testid=zatca-qr]')).toBeVisible({ timeout: 30000 });
});

test('CFO closes month and trial balance is zero', async ({ page }) => {
  await loginAs(page, 'cfo@test.sa');
  await page.goto('/accounting/period-close');
  
  await page.selectOption('[name=year]', '2026');
  await page.selectOption('[name=month]', '3');
  await page.click('text=بدء الإقفال');
  
  // Wait for all checklist items to be green
  const items = page.locator('[data-testid=checklist-item]');
  await expect(items).toHaveCount(13);
  await expect(items.locator('[data-status=success]')).toHaveCount(13, { timeout: 120000 });
  
  // Trial balance must be zero
  await page.goto('/accounting/trial-balance?period=2026-03');
  const diff = await page.locator('[data-testid=tb-diff]').textContent();
  expect(parseFloat(diff!.replace(/,/g, ''))).toBeCloseTo(0, 2);
});
```

## Performance Tests (k6)

```javascript
// k6/sales-invoice-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // ramp up
    { duration: '5m', target: 100 },  // stay
    { duration: '2m', target: 500 },  // surge
    { duration: '5m', target: 500 },
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({
    customerId: 'cus_demo',
    invoiceDate: new Date().toISOString(),
    lines: [{ productId: 'prod_demo', qty: 1, unitPrice: 100 }],
  });
  
  const res = http.post('https://staging.namasoft.sa/api/sales/invoices', payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TOKEN}`,
      'X-Tenant-Id': __ENV.TENANT_ID,
    },
  });
  
  check(res, {
    'status is 201': (r) => r.status === 201,
    'has invoice id': (r) => JSON.parse(r.body).id?.startsWith('inv_'),
  });
  
  sleep(1);
}
```

## Mutation Testing (Stryker)

```yaml
# stryker.conf.json (موجود)
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "vitest",
  "mutate": [
    "src/lib/auto-journal.ts",
    "src/lib/depreciation-engine.ts",
    "src/lib/eos-engine.ts",
    "src/lib/wps-generator.ts",
    "src/lib/zatca-signer.ts",
    "src/lib/numbering-engine.ts"
  ],
  "thresholds": { "high": 90, "low": 80, "break": 75 }
}
```

## Accounting Validation Tests (Daily Cron)

```typescript
// src/__tests__/accounting/invariants.test.ts
// Run nightly per tenant
describe('Accounting Invariants', () => {
  it('trial balance is zero', async () => {
    const tb = await computeTrialBalance(tenantId, { asOf: new Date() });
    expect(Math.abs(tb.totalDebit - tb.totalCredit)).toBeLessThan(0.01);
  });

  it('AR control = sum of customer balances', async () => {
    const arGL = await getAccountBalance(tenantId, 'AR_CONTROL');
    const arSubLedger = await sumCustomerOpenBalances(tenantId);
    expect(Math.abs(arGL - arSubLedger)).toBeLessThan(0.01);
  });

  it('inventory GL = sum of stock × cost', async () => {
    const invGL = await getAccountBalance(tenantId, 'INVENTORY');
    const invSL = await sumStockValuation(tenantId);
    expect(Math.abs(invGL - invSL)).toBeLessThan(0.01);
  });

  it('bank balance = last reconciled + unreconciled', async () => {
    for (const bank of await listBanks(tenantId)) {
      const glBalance = await getBankGLBalance(tenantId, bank.id);
      const reconciled = await getLastReconciledBalance(tenantId, bank.id);
      const unreconciled = await getUnreconciledTransactionsSum(tenantId, bank.id);
      expect(Math.abs(glBalance - (reconciled + unreconciled))).toBeLessThan(0.01);
    }
  });

  it('ZATCA ICV is gap-free', async () => {
    const icvs = await prisma.zATCARecord.findMany({
      where: { tenantId },
      orderBy: { icv: 'asc' },
      select: { icv: true },
    });
    for (let i = 0; i < icvs.length; i++) {
      expect(icvs[i].icv).toBe(i + 1);
    }
  });
});
```

## Test Data Strategy

- **Fixtures:** `src/__tests__/fixtures/*.json` (small, deterministic)
- **Factories:** `src/__tests__/factories/*.ts` (programmatic, randomized)
- **Seeders:** `scripts/seed-*.ts` (large, demo)
- **Snapshots:** `__snapshots__/` (UI + API contracts)

## CI Failure Triage

```
Failed test → automatic Sentry ticket → assigned to PR author
If flake (failed 2x in retry) → moved to .flaky.list → fix within 1 week
If blocks main → revert + post-mortem
```
