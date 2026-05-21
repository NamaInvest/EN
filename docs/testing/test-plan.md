# Test Plan — Namasoft ERP

> **آخر تحديث:** 2026-05-10
> **حالة:** 309/309 unit tests passing (commit `c1179cb1`)

---

## 1. Test Pyramid

```
                ╱╲
               ╱E2╲              5%   — Playwright (golden paths)
              ╱────╲
             ╱ INT  ╲            15%  — Integration (API + DB)
            ╱────────╲
           ╱   UNIT   ╲          50%  — Jest / Vitest (logic)
          ╱────────────╲
         ╱  CONTRACT    ╲        20%  — Zod schemas + OpenAPI
        ╱────────────────╲
       ╱   STATIC ANALYSIS ╲    10%  — TS + ESLint + tsc --noEmit
      ──────────────────────
```

---

## 2. Test Categories

| Layer | Tool | Location | Run |
|-------|------|----------|-----|
| Static | TypeScript + ESLint | repo-wide | `npm run typecheck && npm run lint` |
| Unit | Jest + Vitest | `src/**/__tests__/`, `src/**/*.test.ts` | `npm run test:unit` |
| Contract | Zod + OpenAPI | `src/lib/schemas/**` | `npm run audit:zod` |
| Integration | Jest + Testcontainers | `tests/integration/**` | `npm run test` |
| E2E | Playwright | `e2e/**` | `npm run test:e2e` |
| Load | k6 | `k6/**` | `k6 run k6/script.js` |
| Security | OWASP ZAP, npm audit | CI | `npm audit && zap-baseline` |
| Visual | Playwright snapshots | `e2e/visual/**` | `npm run test:visual` |

---

## 3. Coverage Targets

| Module | Lines | Branches | Why |
|--------|-------|----------|-----|
| `src/lib/auto-journal.ts` | **95%** | 90% | Money path; bugs are catastrophic |
| `src/lib/costing.ts` | 90% | 85% | FIFO/LIFO/Avg correctness |
| `src/lib/zatca/**` | 95% | 90% | Compliance |
| `src/lib/payroll/**` | 90% | 85% | GOSI / WPS / EOS |
| `src/app/api/**` | 70% | 60% | Hitting 80% via integration |
| `src/components/**` | 50% | n/a | UI churn high |

Enforced via `jest --coverage` thresholds in [jest.config.js](../../jest.config.js).

---

## 4. Critical Test Suites

### 4.1 Multi-tenant isolation (سلامة العزل)

```ts
// src/middleware/__tests__/tenant-isolation.test.ts
test('tenant A cannot read tenant B invoices', async () => {
  await withTenant('a', () => prisma.salesInvoice.create({ data: { ... } }));
  const result = await withTenant('b', () => prisma.salesInvoice.findMany());
  expect(result).toHaveLength(0);
});
```

### 4.2 Auto-Journal balance invariant (التوازن المحاسبي)

```ts
// كل قيد متوازن: Σ debits === Σ credits (tolerance 0.01)
test.each(allAutoJournalScenarios)('JE balanced for %s', async (scenario) => {
  const je = await postAutoJournal(scenario);
  expect(sumDr(je) - sumCr(je)).toBeCloseTo(0, 2);
});
```

### 4.3 ZATCA chain integrity

```ts
// ICV متسلسل + PIH متسلسل
test('ZATCA chain has no gaps', async () => {
  const invoices = await fetchZatcaInvoices(tenant);
  invoices.forEach((inv, i) => {
    expect(inv.icv).toBe(i + 1);
    if (i > 0) expect(inv.pih).toBe(invoices[i - 1].hash);
  });
});
```

### 4.4 Period close idempotency

```ts
test('closing same period twice does not double-post', async () => {
  await closePeriod('2026-01');
  const before = await sumGL();
  await expect(closePeriod('2026-01')).rejects.toThrow('PERIOD_CLOSED');
  const after = await sumGL();
  expect(after).toEqual(before);
});
```

---

## 5. E2E Golden Paths (مسارات حرجة)

| ID | Flow | Owner |
|----|------|-------|
| E2E-01 | Tenant signup → workspace ready → first login | Onboarding |
| E2E-02 | Create customer → quote → SO → invoice → ZATCA cleared → payment | Sales |
| E2E-03 | RFQ → PO → GRN → vendor invoice → 3-way match → payment | Purchases |
| E2E-04 | New employee → contract → first payslip → GOSI export | HR/Payroll |
| E2E-05 | BOM → MO → backflush → finished good → cost accuracy | Manufacturing |
| E2E-06 | Open POS session → 5 sales → close session → cash variance reconciled | POS |
| E2E-07 | Bank statement import → reconcile 100 lines → unreconciled = 0 | Treasury |
| E2E-08 | Period close (Jan) → trial balance → P&L → balance sheet | Reports |

Each suite re-run on every PR to `main`.

---

## 6. Test Data

- Factory pattern: `src/tests/factories/{customer,invoice,...}.ts`
- Reset DB per test file (Testcontainers `restoreSnapshot`).
- Seeded reference data: chart of accounts (SOCPA), tax codes, currencies.
- See [seed-data.md](../data/seed-data.md).

---

## 7. Acceptance Criteria Template (per User Story)

```gherkin
Feature: Sales invoice posting

Scenario: Post a draft invoice
  Given a draft invoice with 2 lines totaling 1,150 SAR (incl. 15% VAT)
  When the user clicks "Post"
  Then the invoice status is "POSTED"
  And a journal entry exists with Dr Receivables 1,150 / Cr Sales 1,000 / Cr VAT Output 150
  And ZATCA submission is queued
  And the invoice number increments the tenant counter
```

See [user-stories/](../user-stories/sample-user-stories.md).

---

## 8. CI Test Gates

| Gate | Block on | Severity |
|------|----------|----------|
| TypeScript errors | any | 🔴 |
| ESLint errors (rule level) | any error rule | 🔴 |
| Unit test failures | any | 🔴 |
| Integration failures | any in PR target | 🔴 |
| E2E golden paths | regression | 🔴 |
| Coverage drop > 2% | overall | 🟠 |
| `npm audit high` | new high vulnerability | 🟠 |
| Visual snapshot diff | unreviewed | 🟡 |

---

## 9. Manual Test Checklist (per release)

- [x] Login (web + desktop + PWA)
- [x] Subdomain switching
- [x] Mobile RTL render check
- [x] Bilingual print templates (Arabic + English)
- [x] ZATCA sandbox submission
- [x] WPS SIF export → bank validator
- [x] Backup → restore → row counts match
- [x] Tenant suspend → access blocked

---

## 10. Performance Benchmarks (k6)

| Endpoint | Target |
|----------|--------|
| `GET /api/sales/invoices` (page=1) | p95 < 250ms @ 100 RPS |
| `POST /api/sales/invoices` | p95 < 500ms @ 50 RPS |
| `GET /api/reports/pnl` | p95 < 2s @ 10 RPS |
| `POST /api/zatca/xml` | p95 < 800ms @ 20 RPS |

Scripts: [k6/](../../k6/).

---

## 11. References

- [src/middleware/__tests__/tenant-isolation.test.ts](../../src/middleware/__tests__/tenant-isolation.test.ts)
- [src/lib/auto-journal.test.ts](../../src/lib/auto-journal.test.ts)
- [e2e/](../../e2e/)
- [k6/](../../k6/)
- [User Stories](../user-stories/sample-user-stories.md)

