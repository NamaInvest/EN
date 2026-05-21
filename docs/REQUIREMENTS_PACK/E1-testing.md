# E1 — Testing & QA (Unit + Integration)

## الحالة الحالية
- 382 test nodes في graphify
- `tests/` + `e2e/critical-paths.spec.ts`
- Jest configured
- Playwright e2e setup
- لا coverage badge منشور
- لا mutation testing
- 13 صفحة Enterprise جديدة بدون tests (debt جديد)

## الفجوة (مقابل SAP 80% coverage standard)
- Coverage % غير معروف
- لا mutation testing على hubs
- لا visual regression
- لا performance budgets per page

## 🎯 Ready Prompt

```
المهمة: نظام testing شامل ومُقاس.

السياق:
- Jest + Playwright موجودون
- ~382 test files
- 13 Enterprise pages جديدة بلا tests
- src/lib/auto-journal.ts critical (مطلوب 100% coverage)

المخرجات:
1) Run coverage:
   npm test -- --coverage --coverageReporters=json-summary html lcov
   ↓
   scripts/coverage-report.ts:
   - Parse coverage/coverage-summary.json
   - Group by module
   - Identify hotspots (low coverage + high churn)
   Output: docs/testing/COVERAGE_BY_MODULE.md

2) CI gates .github/workflows/ci.yml:
   - coverage must not drop > 2 points
   - critical files MUST have 100% (auto-journal, withRoute, prisma)
   - new files must have ≥ 70% coverage

3) Mutation testing on critical:
   npm i -D @stryker-mutator/core
   stryker.conf.js targeting:
   - src/lib/auto-journal.ts
   - src/lib/api/with-route.ts
   - src/lib/prisma.ts
   - src/lib/governance/tenant-guard.ts
   - src/lib/decimal-utils.ts
   - src/lib/financial-statements-engine.ts
   - src/lib/credit-check-engine.ts
   - src/lib/pdpl-engine.ts
   - src/lib/wht-engine.ts
   Mutation score ≥ 80%

4) Tests for 13 new Enterprise pages:
   tests/api/pdpl-breaches.test.ts
   tests/api/pdpl-dsr.test.ts
   tests/api/admin-siem.test.ts
   tests/api/credit-check.test.ts
   tests/api/cfo-dashboard.test.ts
   tests/api/vat-categories.test.ts
   tests/api/wht-form14.test.ts
   tests/api/rebates.test.ts
   tests/api/mudad-compliance.test.ts
   tests/api/qiwa-contracts.test.ts
   tests/api/saudization.test.ts
   tests/api/cpq.test.ts
   tests/api/pharmacy-drugs.test.ts

   e2e/critical-paths/
   ├── auth-login-mfa.spec.ts
   ├── invoice-create-post-je.spec.ts
   ├── payroll-run.spec.ts
   ├── period-close.spec.ts
   ├── pdpl-breach-72h.spec.ts
   └── mudad-bulk-update.spec.ts

5) Performance budgets:
   tests/perf/lighthouse-budgets.json:
   - homepage: LCP < 2s, TTI < 3s
   - dashboard: LCP < 1.5s
   - reports: TTI < 5s (allow heavy data)
   lighthouse CI on PR

6) Visual regression:
   Chromatic + Storybook (from C3)

7) Load testing:
   tests/load/k6/
   ├── auth.js (100 RPS for 5 min)
   ├── invoice-creation.js (50 RPS)
   └── reports.js (20 RPS)
   .github/workflows/load-test.yml manual trigger

8) Test data factories:
   tests/factories/
   ├── customer.factory.ts
   ├── invoice.factory.ts
   ├── employee.factory.ts
   ├── jeur factory.ts
   ↓
   Use in all tests for clean fixtures:
   const customer = await customerFactory({ tier: 'gold' });

القيود:
- TypeScript strict في tests
- 1 test = 1 specific behavior
- Tests must run in any order (no test interdependence)
- DB cleanup between tests (transaction rollback)
```

## السيناريو

PR من مطور جديد يغيّر `auto-journal.ts`:

1. PR opened
2. CI starts:
   - Lint ✓
   - Typecheck ✓
   - Unit tests ✓ (current 78% coverage)
   - Mutation tests on auto-journal:
     - **mutation score: 76%** ❌ (was 82%, dropped > 2 points)
3. CI fails ❌
4. PR comment: "Mutation testing dropped from 82% to 76%. Killed mutants list: [...]"
5. Developer adds 3 more test cases covering edge cases
6. CI re-runs ✓ — mutation score back to 84%
7. PR merges

Developer adds new page `/finance/expense-report`:
1. CI detects new page
2. Coverage check on new file: 45% ❌ (below 70% threshold)
3. CI fails
4. Developer adds page tests
5. Coverage 78% ✓ — passes

## Data Flow

```
[CI test flow]
PR opened
   ↓
.github/workflows/ci.yml
   ↓
Job 1: Lint + Typecheck
   ↓
Job 2: Unit Tests
   ├→ npm test -- --coverage
   └→ Upload coverage to Codecov
   ↓
Job 3: Mutation Test (critical files only)
   ├→ npx stryker run
   └→ Compare to previous score
   ↓
Job 4: E2E Tests (Playwright)
   ├→ Start dev server
   ├→ Run smoke tests
   └→ Record video on failure
   ↓
Job 5: Visual Regression
   ├→ Build Storybook
   └→ Chromatic upload + compare
   ↓
Job 6: Lighthouse
   ├→ Build + start
   └→ Run lighthouse CI
   ↓
All pass? → PR ready to merge
Any fail? → Block merge + comment

[Coverage reporting flow]
Daily @ 02:00 UTC
   ↓
Run full test suite with coverage
   ↓
scripts/coverage-report.ts:
   Parse coverage-summary.json
   ↓
   For each module:
     calculate line/branch/function coverage
     identify low-coverage files
     track churn (git log frequency)
   ↓
Generate docs/testing/COVERAGE_BY_MODULE.md
   ↓
Update README badge (shields.io)
   ↓
Slack notification if dropped > 1 point

[Mutation testing flow]
Weekly OR on critical-file changes
   ↓
stryker run --files src/lib/auto-journal.ts
   ↓
For each line:
   apply mutation (e.g. > becomes <)
   run tests
   if all pass → mutant survived (BAD)
   if any fail → mutant killed (GOOD)
   ↓
Score = killed / total
   ↓
Generate stryker report (HTML)
   ↓
Upload to /admin/mutation-reports
```

## ملفات المُنتَج

- `scripts/coverage-report.ts`
- `docs/testing/COVERAGE_BY_MODULE.md` (auto-generated)
- `stryker.conf.js`
- `tests/api/<endpoint>.test.ts` × 13 (new)
- `e2e/critical-paths/*.spec.ts` × 6 (new)
- `tests/perf/lighthouse-budgets.json`
- `tests/load/k6/*.js`
- `tests/factories/*.factory.ts`
- `.github/workflows/ci.yml` (enhanced)
- `.github/workflows/load-test.yml`
