# 07 — Test Strategy & Plan
**Frameworks:** Vitest (unit/integration), Playwright (E2E), k6 (load), Stryker (mutation)

---

## 1. Test Pyramid

```
       E2E (Playwright)              5%
      ──────────────────
     Integration (Vitest + DB)       15%
    ──────────────────────────
   Unit (Vitest, mocked I/O)         80%
```

**Targets:**
- Unit coverage: ≥ 80% statements, ≥ 75% branches
- Integration: every API route + every engine
- E2E: critical user journeys (15-20 flows)
- Mutation score: ≥ 70% on critical engines (auto-journal, costing, EOS)

---

## 2. Unit Testing

### 2.1 Scope
- Pure functions in `src/lib/`
- Engines tested with mocked Prisma + external APIs
- React components with React Testing Library

### 2.2 Mandatory Unit Tests
| File | Test Coverage |
|------|---------------|
| auto-journal.ts | balanced, multi-tenant, dimensions, control account block |
| costing.ts | FIFO/LIFO/Avg correctness over multi-batch |
| saudi-eos-engine.ts | Art. 84-85 first-5y vs full, resignation factor |
| gosi-engine.ts | Saudi/GCC/Expat rates, ceiling 45K, SANED |
| zatca-signer.ts | XML hash, QR generation, ICV chain |
| numbering-engine.ts | zero-gap, period reset, format prefix |
| document-state-machine.ts | invalid transitions blocked |
| period-close-engine.ts | checklist completion, lock enforcement |
| fx-revaluation.ts | realized/unrealized, multi-currency |
| budget-engine.ts | encumbrance, over-budget block |
| three-way-match.ts | tolerance edge cases |
| dunning-engine.ts | level escalation, holds |
| cash-application.ts | FIFO/LIFO/manual match |
| wht-engine.ts | treaty rates, certificate generation |
| pdpl-engine.ts | DSR SLA 30d, breach 72h |
| hijri.ts | conversion accuracy ± 1 day |
| money.ts | decimal rounding, currency conversion |
| validations.ts | Zod schemas |

### 2.3 Test Pattern
```typescript
// src/lib/__tests__/saudi-eos-engine.test.ts
import { describe, it, expect } from 'vitest'
import { calcEosLiability } from '../saudi-eos-engine'

describe('saudi-eos-engine', () => {
  it('first 5 years: half month per year (Art. 84)', () => {
    const result = calcEosLiability({
      lastSalary: 10000,
      hireDate: new Date('2021-01-01'),
      terminationDate: new Date('2026-01-01'), // 5 years
      reason: 'TERMINATION'
    })
    // 5 × 0.5 × 10000 = 25000
    expect(result.amount).toBe(25000)
  })

  it('after 5 years: full month per year for years 6+', () => {
    const result = calcEosLiability({
      lastSalary: 10000,
      hireDate: new Date('2018-01-01'),
      terminationDate: new Date('2026-01-01'), // 8 years
      reason: 'TERMINATION'
    })
    // 5 × 0.5 × 10000 + 3 × 1 × 10000 = 25000 + 30000 = 55000
    expect(result.amount).toBe(55000)
  })

  it('resignation: tier-based factor (Art. 85)', () => {
    // 2-5 years resign: 1/3 of full EOS
    const result = calcEosLiability({
      lastSalary: 10000,
      hireDate: new Date('2023-01-01'),
      terminationDate: new Date('2026-01-01'), // 3 years
      reason: 'RESIGNATION'
    })
    // 3 × 0.5 × 10000 × 1/3 = 5000
    expect(result.amount).toBe(5000)
  })
})
```

---

## 3. Integration Testing

### 3.1 Scope
- API routes end-to-end with real DB (test Postgres)
- Engines with real Prisma transactions
- Saga / multi-step workflows

### 3.2 Setup
- Use Testcontainers or local Postgres seeded per test
- Database resets between tests (transaction rollback)
- Or use unique tenant per test (faster than reset)
- Mock external APIs (ZATCA, Mudad, etc) via MSW

### 3.3 Mandatory Integration Tests
| Flow | Tests |
|------|-------|
| Sales Invoice Lifecycle | Create → Approve → Post → ZATCA submit → Receive payment → Apply |
| Purchase Cycle (P2P) | PR → Approve → RFQ → Award → PO → GRN → Invoice → 3WM → Pay |
| Production (M2P) | BOM → MRP → MO → Issue materials → Operations → Complete → WIP JE |
| Payroll | Setup employees → Run → Approve → Post to GL → Generate WPS → Provisions |
| Period Close | Sub-ledger close → Inventory valuation → FX revaluation → Period lock |
| Year-End Close | All closes → P&L close → Retained earnings → Open new year |
| ZATCA Submission | Build XML → Sign → Submit → Handle response → Update invoice |
| Cash Application | Bank statement upload → Auto-match → Manual review → Apply |
| Bank Reconciliation | Statement → Match → Exception handle → Recon report |
| Multi-currency | Transaction → JE in book + foreign → FX reval at month-end |
| Multi-tenant Isolation | Create 2 tenants → Insert data → Assert no cross-leak |

### 3.4 Test Pattern
```typescript
// src/app/api/__tests__/invoice-flow.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setupTestTenant, cleanupTestTenant } from '@/test/helpers'

describe('Sales Invoice Lifecycle (integration)', () => {
  let tenantId: string
  let customerId: string
  
  beforeEach(async () => {
    tenantId = await setupTestTenant()
    customerId = await createTestCustomer(tenantId)
  })
  
  afterEach(async () => {
    await cleanupTestTenant(tenantId)
  })

  it('creates invoice, posts JE, submits to ZATCA', async () => {
    // Create invoice via API
    const res = await fetch('/api/sales/invoices', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenantId },
      body: JSON.stringify({
        customerId,
        date: '2026-05-09',
        lines: [{ productId: 'p1', qty: 2, unitPrice: 100 }]
      })
    })
    expect(res.status).toBe(201)
    const { data: invoice } = await res.json()
    
    // Post
    const postRes = await fetch(`/api/sales/invoices/${invoice.id}/post`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    expect(postRes.status).toBe(200)
    const { journalEntryId, zatcaSubmissionId } = await postRes.json()
    
    // Verify JE exists and is balanced
    const je = await prisma.journalEntry.findUnique({ where: { id: journalEntryId }, include: { lines: true } })
    const debits = je.lines.reduce((s, l) => s + Number(l.debit), 0)
    const credits = je.lines.reduce((s, l) => s + Number(l.credit), 0)
    expect(debits).toBe(credits)
    expect(debits).toBe(230) // 200 + 15% VAT
    
    // Verify ZATCA submission
    const zatca = await prisma.zatcaSubmission.findUnique({ where: { id: zatcaSubmissionId } })
    expect(zatca.status).toBe('SUBMITTED')
    expect(zatca.qr).toBeDefined()
  })
})
```

---

## 4. E2E Testing (Playwright)

### 4.1 Critical User Journeys
1. **Tenant Onboarding** — sign up → setup wizard → first invoice
2. **Invoice to Cash** — quote → order → invoice → ZATCA → payment receipt
3. **Procure to Pay** — PR → approval → PO → GRN → invoice → 3WM → payment
4. **Hire to Pay** — recruit → onboard → run payroll → WPS → payslip
5. **Production** — release MO → issue materials → complete → close
6. **Period Close** — month-end close → financial statements → year-end
7. **POS Sale** — open session → ring up sale → multi-tender → close session
8. **POS Offline** — disconnect → sale → reconnect → sync
9. **CRM Pipeline** — capture lead → convert to opportunity → win → invoice
10. **Bank Recon** — upload statement → auto-match → resolve exceptions
11. **Customer Portal** — login → view orders → request return → track refund
12. **Vendor Portal** — login → view PO → submit invoice → see payment status
13. **ZATCA Cleared Invoice** — generate → submit → cleared → printable QR
14. **Approval Workflow** — submit → manager queue → approve → posted
15. **Reports** — generate BS/IS/CF → export PDF
16. **i18n Switch** — toggle AR/EN, RTL/LTR works
17. **MFA Setup** — enable TOTP → login with MFA
18. **Backup & Restore** — initiate backup → restore to staging
19. **PDPL DSR** — submit access request → fulfill within 30 days
20. **Audit Trail** — make change → view audit log → export

### 4.2 Test Pattern
```typescript
// e2e/invoice-flow.spec.ts
import { test, expect } from '@playwright/test'

test('user can create and post invoice with ZATCA clearance', async ({ page }) => {
  await page.goto('/sign-in')
  await page.fill('[name=email]', 'cfo@test-tenant.sa')
  await page.fill('[name=password]', 'TestPass123!')
  await page.click('button[type=submit]')
  
  await page.waitForURL('/dashboard')
  await page.click('text=المبيعات')  // Sales menu (Arabic)
  await page.click('text=فاتورة جديدة')
  
  await page.fill('[name=customer]', 'عميل التجربة')
  await page.click('text=عميل التجربة')  // select from dropdown
  
  await page.click('text=إضافة سطر')
  await page.fill('[name=lines.0.productId]', 'منتج 1')
  await page.fill('[name=lines.0.qty]', '2')
  await page.fill('[name=lines.0.unitPrice]', '100')
  
  await page.click('text=حفظ')
  await expect(page.locator('text=تم إنشاء الفاتورة')).toBeVisible()
  
  await page.click('text=ترحيل')
  await page.click('text=تأكيد')
  
  await expect(page.locator('text=ZATCA Cleared')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('img[alt="ZATCA QR"]')).toBeVisible()
})
```

### 4.3 Cross-browser
- Chrome (default)
- Firefox
- Safari (via WebKit on CI)
- Mobile: iPhone 14, Galaxy S22 (POS responsive)

---

## 5. Performance Testing (k6)

### 5.1 Scenarios
| Scenario | Target |
|----------|--------|
| Homepage load | 1000 RPS |
| Invoice creation | 100 RPS |
| ZATCA submission | 50 RPS (rate-limited by upstream) |
| Reports generation | 20 concurrent |
| POS sale | 200 RPS during peak |
| Search | 500 RPS |

### 5.2 Test Pattern (k6/script.js)
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    http_req_failed: ['rate<0.01']
  }
}

export default function () {
  const res = http.post(
    'https://staging.namasoft.sa/api/sales/invoices',
    JSON.stringify({ customerId: '...', lines: [...] }),
    { headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` } }
  )
  check(res, { 'status 201': (r) => r.status === 201 })
  sleep(1)
}
```

### 5.3 Schedule
- Run nightly on staging
- Run before each major release
- Alert if regression > 10% from baseline

---

## 6. Mutation Testing (Stryker)

### 6.1 Scope
- Critical engines only (cost: time)
- auto-journal.ts, costing.ts, saudi-eos-engine.ts, gosi-engine.ts, three-way-match.ts, period-close-engine.ts, zatca-signer.ts

### 6.2 Config (`stryker.conf.json`)
```json
{
  "packageManager": "npm",
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/lib/auto-journal.ts",
    "src/lib/costing.ts",
    "src/lib/saudi-eos-engine.ts",
    "src/lib/gosi-engine.ts",
    "src/lib/three-way-match.ts",
    "src/lib/zatca-signer.ts"
  ],
  "thresholds": { "high": 80, "low": 70, "break": 65 }
}
```

### 6.3 Schedule
- Weekly on main branch
- Block merge if mutation score drops > 5%

---

## 7. Multi-Tenant Isolation Tests (CI mandatory)

```typescript
// src/test/multi-tenant-isolation.test.ts
describe('Multi-tenant isolation', () => {
  it('queries from tenant A cannot return tenant B data', async () => {
    const tenantA = await setupTestTenant()
    const tenantB = await setupTestTenant()
    
    await createCustomerInTenant(tenantA, { fullName: 'Customer A' })
    await createCustomerInTenant(tenantB, { fullName: 'Customer B' })
    
    const aResults = await fetchCustomers(tenantA)
    const bResults = await fetchCustomers(tenantB)
    
    expect(aResults).toHaveLength(1)
    expect(aResults[0].fullName).toBe('Customer A')
    expect(bResults).toHaveLength(1)
    expect(bResults[0].fullName).toBe('Customer B')
    
    // Direct DB attempt to cross-leak
    expect(async () => await fetchCustomerById(tenantA, bResults[0].id))
      .rejects.toThrow(/not found|tenant mismatch/i)
  })
})
```

Run on every PR. Block merge if fails.

---

## 8. Accessibility Tests

- **Tool:** axe-playwright
- **Run:** every E2E suite
- **Standard:** WCAG 2.1 AA
- **Block on:** any "critical" or "serious" violations

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('dashboard is accessible', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  })
})
```

---

## 9. Security Tests

### 9.1 Static Analysis
- ESLint security plugin
- Semgrep (custom Saudi rules: don't log Iqama, don't store salary in plaintext, etc.)

### 9.2 Dynamic
- ZAP baseline scan (weekly)
- Dependency scanning (Snyk + npm audit) on every PR

### 9.3 Secrets Scanning
- Gitleaks pre-commit + CI
- TruffleHog on PR

---

## 10. Compliance Tests

### 10.1 ZATCA
- Validate XML against ZATCA schemas
- Validate ICV continuity (no gaps)
- Validate PIH chain
- Sandbox-only smoke test on PR

### 10.2 SOCPA
- Use accounting-validator agent on auto-journal code changes
- Test JE balance enforcement
- Test control-account direct-post block

### 10.3 PDPL
- DSR fulfillment within SLA test
- Breach 72h SDAIA notification mock

### 10.4 Saudi Labor Law
- EOS calculation Art. 84-85 across various tenures
- Leave entitlement Art. 109 (21 vs 30 days threshold)
- Maternity 10 weeks, Iddah 130 days
- Iqama renewal alerts

---

## 11. Data Integrity Tests

### 11.1 Invariants
- Sum of debits = Sum of credits in every JE
- TB balanced as of any date
- Customer.balance = sum(invoices) - sum(payments) at any time
- StockBalance = sum(StockMovements) at any time
- Period closed → no new JEs in that period

### 11.2 Pattern
```typescript
describe('Data integrity invariants', () => {
  it('TB always balances', async () => {
    const tb = await trialBalance(tenantId, new Date())
    const totalDebits = tb.reduce((s, r) => s.plus(r.debits), Decimal(0))
    const totalCredits = tb.reduce((s, r) => s.plus(r.credits), Decimal(0))
    expect(totalDebits.toString()).toBe(totalCredits.toString())
  })
})
```

Run nightly + on every JE post.

---

## 12. Snapshot Tests

- Print templates (PDF render → snapshot)
- Email templates (HTML output → snapshot)
- Generated reports (BS/IS structure)
- ZATCA XML structure
- WPS SIF file format

---

## 13. Test Data Strategy

### 13.1 Factories
- `src/test/factories/` — typed factories per entity
- Realistic Saudi data (Arabic names, valid Iqama format, real bank IBANs from test banks)

### 13.2 Seed Sets
- `seeds/test-minimal.json` — 1 tenant, 5 employees, 10 customers, 50 transactions
- `seeds/test-medium.json` — for integration scenarios (1 year of data)
- `seeds/test-stress.json` — 10K customers, 100K transactions for perf

### 13.3 Anonymization
- Production data NEVER in dev/staging
- Anonymizer script for support debugging on real-shaped data

---

## 14. CI Configuration

`.github/workflows/test.yml`:
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
        ports: [5432:5432]
      redis:
        image: redis:7
        ports: [6379:6379]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit -- --coverage
      - run: npm run test:integration
      - run: npm run test:isolation
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v4
```

---

## 15. Test Quality Gates (block merge)

- [ ] All tests pass
- [ ] Coverage ≥ 80% (overall) / ≥ 90% (changed files)
- [ ] No high/critical Snyk findings
- [ ] No Semgrep critical findings
- [ ] Multi-tenant isolation test passes
- [ ] Data integrity invariants pass
- [ ] Accessibility (axe) no critical
- [ ] TypeScript strict no errors
- [ ] ESLint clean

---

## 16. Test Plan (per Module)

For each new module, the developer MUST produce a `06-test-cases.md` file in `BUILD_PACK/modules/<module>/` listing:

1. Unit cases (happy path + edge cases + error paths)
2. Integration cases (DB-touching)
3. E2E cases (UI flows)
4. Performance scenarios
5. Security checks
6. Saudi compliance specifics
7. Multi-tenant isolation specifics

Template:
```markdown
## Test Cases — <Module Name>

### Unit Tests
- [ ] U1: <case>
- [ ] U2: ...

### Integration Tests
- [ ] I1: ...

### E2E Tests
- [ ] E1: ...

### Performance
- [ ] P1: ...

### Security
- [ ] S1: ...

### Compliance
- [ ] C1: ZATCA...
- [ ] C2: SOCPA...

### Multi-tenant
- [ ] M1: ...
```
