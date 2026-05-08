# 1️⃣9️⃣ Integration Testing | اختبار التكامل

## 🔍 الحالة الحالية

### ✅ الموجود
- بعض tests التكامل في `tests/` و `__tests__/`
- Vitest يشغّلها

### 🔴 الفجوات
| الفجوة | الخطورة |
|--------|--------|
| لا Test Containers (PostgreSQL/Redis حقيقي) | 🔴 |
| Multi-tenant isolation غير مغطّى | 🔴 |
| ZATCA flow الكامل غير مختبر | 🔴 |
| Payroll run الكامل غير مختبر | 🔴 |
| Approval workflow غير مختبر | 🟠 |
| Period close غير مختبر | 🟠 |
| Bank reconciliation غير مختبر | 🟠 |
| **0 E2E tests** (لا Playwright) | 🔴🔴 |
| لا load testing | 🟠 |

---

## 🎯 الخطة التفصيلية

### المرحلة 19.1 — Test Containers Setup (3 أيام)

```typescript
// src/test/integration/setup.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

export class IntegrationTestContext {
  postgres!: StartedPostgreSqlContainer;
  redis!: StartedRedisContainer;
  prisma!: PrismaClient;
  redisClient!: Redis;

  async setup() {
    this.postgres = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('namasoft_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    this.redis = await new RedisContainer('redis:7-alpine').start();

    process.env.DATABASE_URL = this.postgres.getConnectionUri();
    process.env.REDIS_URL = this.redis.getConnectionUrl();

    this.prisma = new PrismaClient({
      datasources: { db: { url: this.postgres.getConnectionUri() } },
    });

    // Apply migrations
    await this.applyMigrations();

    // Seed
    await this.seedTestData();

    this.redisClient = new Redis(this.redis.getConnectionUrl());
  }

  async teardown() {
    await this.prisma.$disconnect();
    await this.redisClient.quit();
    await this.postgres.stop();
    await this.redis.stop();
  }

  async applyMigrations() {
    const { execSync } = await import('child_process');
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: this.postgres.getConnectionUri() },
    });
  }

  async seedTestData() {
    await seed(this.prisma);
  }

  async resetDatabase() {
    // Truncate all tables
    const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;

    for (const { tablename } of tables) {
      if (tablename !== '_prisma_migrations') {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
      }
    }

    await this.seedTestData();
  }
}

// Use globally
let testContext: IntegrationTestContext;

beforeAll(async () => {
  testContext = new IntegrationTestContext();
  await testContext.setup();
});

afterAll(async () => {
  await testContext.teardown();
});

beforeEach(async () => {
  await testContext.resetDatabase();
});

export { testContext };
```

---

### المرحلة 19.2 — ZATCA Full Flow Test (5 أيام)

```typescript
// tests/integration/zatca-full-flow.test.ts
import { describe, it, expect } from 'vitest';
import { testContext } from '@/test/integration/setup';

describe('ZATCA Full Flow', () => {
  it('completes invoice → sign → submit → clearance → archive', async () => {
    const { prisma } = testContext;

    // 1. Create customer with VAT
    const customer = await prisma.customer.create({
      data: factories.customer({ vatNumber: '300123456700003' }),
    });

    // 2. Create invoice
    const invoice = await prisma.salesInvoice.create({
      data: {
        ...factories.salesInvoice({ customerId: customer.id }),
        details: { create: [factories.invoiceLine()] },
      },
    });

    // 3. Generate ZATCA XML
    const xml = await zatcaService.generateXML(invoice.id);
    expect(xml).toContain('<Invoice');
    expect(xml).toContain(customer.vatNumber);

    // 4. Sign XML
    const signed = await zatcaService.signXML(xml);
    expect(signed).toContain('<ds:Signature');

    // 5. Generate ICV (counter)
    const previousIcv = await prisma.salesInvoice.findFirst({
      where: { tenantId: invoice.tenantId, icv: { not: null } },
      orderBy: { icv: 'desc' },
    });
    const expectedIcv = (previousIcv?.icv || 0) + 1;

    // 6. Submit to ZATCA (sandbox)
    const submission = await zatcaService.submit({
      invoiceId: invoice.id,
      signedXml: signed,
      icv: expectedIcv,
    });

    expect(submission.status).toBe('cleared');
    expect(submission.clearanceUuid).toBeDefined();

    // 7. Verify DB state
    const updated = await prisma.salesInvoice.findUnique({ where: { id: invoice.id } });
    expect(updated?.cleared).toBe(true);
    expect(updated?.icv).toBe(expectedIcv);
    expect(updated?.zatcaQr).toBeDefined();

    // 8. Verify next invoice's PIH = previous's hash
    const nextInvoice = await createInvoice();
    const nextSubmission = await zatcaService.submit({
      invoiceId: nextInvoice.id,
      previousHash: updated?.zatcaHash,
    });

    expect(nextSubmission.icv).toBe(expectedIcv + 1);
  });

  it('handles ZATCA rejection gracefully', async () => {
    // Invoice with invalid VAT
    const invoice = await createInvoiceWithInvalidVAT();

    const result = await zatcaService.submit({ invoiceId: invoice.id });
    expect(result.status).toBe('rejected');

    // Verify DB still has original state
    const updated = await prisma.salesInvoice.findUnique({ where: { id: invoice.id } });
    expect(updated?.cleared).toBe(false);
  });

  it('maintains ICV continuity even with failures', async () => {
    // Create 5 invoices, fail 2nd
    const invoices = await Promise.all([1, 2, 3, 4, 5].map(() => createInvoice()));

    // Force failure on 2nd
    mockZATCA.failOnce();

    for (const inv of invoices) {
      try { await zatcaService.submit({ invoiceId: inv.id }); }
      catch { /* expected for one */ }
    }

    const cleared = await prisma.salesInvoice.findMany({
      where: { cleared: true },
      orderBy: { icv: 'asc' },
    });

    // ICVs should be consecutive (1, 2, 3, 4) -- 5th continues
    const icvs = cleared.map(c => c.icv);
    expect(icvs).toEqual([1, 2, 3, 4]);  // 4 cleared, 1 failed in middle, then continued
  });
});
```

---

### المرحلة 19.3 — Payroll Full Run Test (5 أيام)

```typescript
// tests/integration/payroll-full-run.test.ts
describe('Payroll Full Run', () => {
  it('processes complete monthly payroll', async () => {
    const { prisma } = testContext;

    // Setup: 50 employees with various salaries
    const employees = await Promise.all(
      Array.from({ length: 50 }).map(() =>
        prisma.employee.create({ data: factories.employee() })
      )
    );

    // 1. Validate attendance (all present)
    const month = '2026-05';
    for (const emp of employees) {
      await prisma.attendance.createMany({
        data: Array.from({ length: 22 }).map((_, i) => ({
          employeeId: emp.id,
          date: new Date(`2026-05-${i + 1}`),
          status: 'present',
        })),
      });
    }

    // 2. Run payroll
    const run = await payrollService.runMonthly({ month, tenantId: 'test-tenant' });

    expect(run.status).toBe('completed');
    expect(run.salaries).toHaveLength(50);

    // 3. Verify GOSI
    for (const salary of run.salaries) {
      const employee = employees.find(e => e.id === salary.employeeId)!;
      const expectedGosi = new Decimal(employee.salary).mul('0.09'); // 9%
      expect(salary.gosiDeduction).toEqual(expectedGosi);
    }

    // 4. Verify WPS file generated
    const wpsFile = await wpsService.generateSIF(run.id);
    expect(wpsFile).toContain('100,'); // SIF header
    expect(wpsFile.split('\n').length).toBeGreaterThan(50);

    // 5. Verify journal entry posted
    const je = await prisma.journalEntry.findFirst({
      where: { reference: `PAYROLL-${run.id}` },
      include: { lines: true },
    });

    expect(je).toBeDefined();
    expectJournalBalanced(je!);

    // Salary expense debit
    const salaryExpense = je!.lines.find(l => l.accountCode === '5101');
    const totalGross = run.salaries.reduce((sum, s) =>
      sum.add(new Decimal(s.basicSalary).add(s.additions)), new Decimal(0));
    expect(salaryExpense?.debit).toEqual(totalGross);

    // GOSI payable credit
    const gosiPayable = je!.lines.find(l => l.accountCode === '2210');
    const totalGosi = run.salaries.reduce((sum, s) => sum.add(s.gosiDeduction), new Decimal(0));
    expect(gosiPayable?.credit).toEqual(totalGosi);
  });

  it('handles Saudi vs non-Saudi differently', async () => {
    // Saudi: GOSI 9% + 9% employer
    // Non-Saudi: GOSI 2% only (occupational hazards)
    // ...
  });

  it('handles end-of-service for terminated employee', async () => {
    // EOS calculation per Saudi labor law
    // ...
  });
});
```

---

### المرحلة 19.4 — Approval Workflow Test (4 أيام)

```typescript
describe('Approval Workflow', () => {
  it('routes JE > 100K to Manager + CFO', async () => {
    const je = await createJE({ totalDebit: new Decimal('150000') });

    // Submit
    await approvalService.submit({ documentId: je.id, documentType: 'JE' });

    // Verify 2 approval steps
    const steps = await prisma.approvalStep.findMany({ where: { requestId: je.id } });
    expect(steps).toHaveLength(2);
    expect(steps.map(s => s.role)).toEqual(['MANAGER', 'CFO']);

    // Manager approves
    await approvalService.approve(steps[0].id, managerUserId);

    // Still pending CFO
    const updated = await prisma.approvalStep.findMany({ where: { requestId: je.id } });
    expect(updated.find(s => s.role === 'CFO')!.status).toBe('PENDING');

    // CFO approves
    await approvalService.approve(steps[1].id, cfoUserId);

    // Final action: post JE
    const finalJE = await prisma.journalEntry.findUnique({ where: { id: je.id } });
    expect(finalJE!.status).toBe('posted');
  });

  it('escalates after 24h timeout', async () => {
    const je = await createJE({ totalDebit: new Decimal('150000') });
    await approvalService.submit({ documentId: je.id, documentType: 'JE' });

    // Fast-forward time
    vi.useFakeTimers();
    vi.advanceTimersByTime(25 * 60 * 60 * 1000); // 25 hours

    await approvalService.processEscalations();

    const step = await prisma.approvalStep.findFirst({ where: { requestId: je.id } });
    expect(step?.escalatedAt).toBeDefined();
    expect(step?.approverId).not.toBe(originalApproverId); // غير شخص آخر
  });

  it('allows recall before approval', async () => { /* ... */ });
  it('rejects with reason updates document state', async () => { /* ... */ });
});
```

---

### المرحلة 19.5 — Playwright E2E (8 أيام)

```bash
npm install --save-dev @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html'], ['junit', { outputFile: 'test-results.xml' }]],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
    { name: 'rtl', use: { ...devices['Desktop Chrome'], locale: 'ar-SA' } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

```typescript
// tests/e2e/golden-paths/01-create-sales-invoice.spec.ts
import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Golden Path: Create Sales Invoice', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'sales-user');
  });

  test('user can create + post sales invoice', async ({ page }) => {
    // 1. Navigate
    await page.goto('/sales/invoices/new');

    // 2. Select customer
    await page.getByLabel('العميل').click();
    await page.getByText('عميل تجريبي').click();

    // 3. Add product line
    await page.getByRole('button', { name: 'إضافة منتج' }).click();
    await page.getByLabel('المنتج').click();
    await page.getByText('منتج 1').click();
    await page.getByLabel('الكمية').fill('5');

    // 4. Verify auto-calculation
    await expect(page.getByLabel('الإجمالي')).toHaveValue('575.00'); // 5 * 100 * 1.15

    // 5. Save as draft
    await page.getByRole('button', { name: 'حفظ كمسودة' }).click();
    await expect(page.getByText('تم الحفظ')).toBeVisible();

    // 6. Post
    await page.getByRole('button', { name: 'ترحيل' }).click();
    await page.getByRole('button', { name: 'تأكيد' }).click();

    // 7. Verify ZATCA submission
    await expect(page.getByText('تمت المصادقة من ZATCA')).toBeVisible({ timeout: 30_000 });

    // 8. Verify QR code visible
    await expect(page.locator('[data-qr-code]')).toBeVisible();

    // 9. Print
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'طباعة' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/);
  });

  test('validation errors prevent submission', async ({ page }) => {
    await page.goto('/sales/invoices/new');
    await page.getByRole('button', { name: 'حفظ' }).click();

    await expect(page.getByText('يجب اختيار العميل')).toBeVisible();
    await expect(page.getByText('يجب إضافة منتج واحد على الأقل')).toBeVisible();
  });
});
```

```typescript
// tests/e2e/golden-paths/02-payroll-run.spec.ts
test('CFO can run monthly payroll end-to-end', async ({ page }) => {
  await loginAs(page, 'cfo');
  await page.goto('/payroll/run');

  await page.getByLabel('الشهر').selectOption('2026-05');
  await page.getByRole('button', { name: 'بدء التشغيل' }).click();

  // Wait for processing
  await expect(page.getByText('جاري المعالجة')).toBeVisible();
  await expect(page.getByText('اكتمل التشغيل')).toBeVisible({ timeout: 120_000 });

  // Verify counts
  await expect(page.getByText(/تم معالجة \d+ موظف/)).toBeVisible();

  // Download WPS file
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'تحميل ملف WPS' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/wps.*\.sif/);
});
```

---

### المرحلة 19.6 — 25 Golden Path Tests (متضمن في 19.5)

#### القائمة:
1. ✅ Create + post sales invoice + ZATCA
2. ✅ Run monthly payroll
3. Create + receive purchase order (3-way match)
4. Process bank reconciliation
5. Run period close
6. Approve journal entry > 100K (workflow)
7. Generate financial reports (P&L, BS, CF)
8. Manage employee (hire → leave → terminate → EOS)
9. Run inventory stocktake
10. Process credit note
11. Manufacturing order (BOM → produce → QC)
12. Asset depreciation run
13. FX revaluation
14. Customer credit check
15. Vendor payment + check
16. Multi-tenant data isolation
17. Login + 2FA
18. Permissions (role-based access)
19. Search + filter + export
20. AI Copilot conversation
21. AI CFO daily report
22. RAG knowledge query
23. POS terminal operation
24. Mobile responsiveness (golden paths)
25. Backup + restore (admin)

---

### المرحلة 19.7 — Load Testing (4 أيام)

```javascript
// k6/scenarios/erp-load.js
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  scenarios: {
    sales_create: {
      executor: 'constant-arrival-rate',
      rate: 10, // 10 invoices/sec
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 50,
    },
    reports_query: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
    },
  },
  thresholds: {
    'http_req_duration{group:::sales-create}': ['p(95)<2000'],
    'http_req_duration{group:::reports}': ['p(95)<5000'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  group('sales-create', () => {
    const res = http.post('https://staging.namasoft.com/api/v1/sales',
      JSON.stringify({ /* ... */ }),
      { headers: { Authorization: `Bearer ${__ENV.TOKEN}` } }
    );
    check(res, { 'status 201': r => r.status === 201 });
  });

  group('reports', () => {
    const res = http.get('https://staging.namasoft.com/api/v1/accounting/balance-sheet',
      { headers: { Authorization: `Bearer ${__ENV.TOKEN}` } }
    );
    check(res, { 'status 200': r => r.status === 200 });
  });

  sleep(1);
}
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Test Containers | لا | PostgreSQL + Redis |
| Integration tests | جزئي | 200+ |
| Multi-tenant tests | لا | شامل |
| ZATCA full flow | لا | مغطّى |
| Payroll full run | لا | مغطّى |
| Approval workflow | لا | مغطّى |
| E2E tests | 0 | 25+ golden paths |
| Mobile E2E | لا | في كل golden path |
| Load tests | لا | weekly k6 runs |
| Visual regression | لا | optional |

---

## ⏱️ الجدول الزمني
- **المدة:** 32 يوم عمل
- **الفريق:** 2 QA + dev support
- **الأولوية:** 🔴 عالية (E2E خاصة)

---

## ✅ معايير القبول
- [ ] Test Containers يعمل في CI
- [ ] 25 golden paths كلها تمر
- [ ] ZATCA full flow مختبر
- [ ] Payroll full run مختبر
- [ ] Multi-tenant isolation مختبر
- [ ] Load test weekly مع report
- [ ] E2E يعمل على mobile + desktop + RTL
