# E2 — Test Cases & Test Plan

## الحالة الحالية
- `docs/MASTER_PACK/13-test-cases/` (1 ملف)
- `docs/user-stories/sample-user-stories.md` يحوي 192 BDD scenario
- لا coverage matrix story → test
- لا formal test plan document

## الفجوة (مقابل ISTQB / TMMi standards)
- Test cases غير مرتبطة بـ user stories
- لا test data management plan
- لا regression suite formal
- لا UAT signoff process

## 🎯 Ready Prompt

```
المهمة: Test cases formal مرتبطة بـ user stories + acceptance criteria.

السياق:
- 192 BDD stories في docs/user-stories/
- 382 test files موجودة
- لا mapping بين الاثنين

المخرجات:
1) Story → Test mapping:
   scripts/map-stories-to-tests.ts:
   - Read docs/user-stories/<module>.md
   - Extract story IDs (US-<module>-<NN>)
   - Search test files for matching IDs in describe/it strings
   - Output: docs/MASTER_PACK/13-test-cases/COVERAGE_MATRIX.csv
   Format:
   | StoryID | StoryTitle | TestFile | TestCount | Coverage |
   | US-sales-01 | Create sales invoice | tests/api/sales-invoice.test.ts | 5 | ✅ |
   | US-sales-02 | Apply VAT 15% | (none) | 0 | ❌ |

2) Generate missing tests:
   For each story without tests, generate stub:
   tests/<module>/<story-id>.test.ts:

   describe('US-sales-02: Apply VAT 15%', () => {
     it('GIVEN customer is VAT-registered', () => { ... });
     it('WHEN invoice is created', () => { ... });
     it('THEN VAT 15% line is added', () => { ... });
     // Edge cases from story
     it('handles zero-rated items', () => { ... });
     it('handles exempt items', () => { ... });
   });

3) Test Plan Document:
   docs/MASTER_PACK/13-test-cases/TEST_PLAN.md:
   - Test strategy (pyramid: unit/integration/e2e ratio)
   - Test environments (dev/staging/prod-mirror)
   - Test data management (fixtures, factories, anonymized prod data)
   - Test execution schedule
   - UAT process + signoff template
   - Regression suite (smoke tests run on every deploy)
   - Performance test schedule
   - Security test schedule

4) UAT Signoff Process:
   docs/MASTER_PACK/13-test-cases/UAT_SIGNOFF_TEMPLATE.md:
   - Per release tag
   - Test scenarios + actual results
   - Issues found + severity
   - Stakeholder signature
   - Go/no-go decision
   Store: docs/MASTER_PACK/13-test-cases/uat-history/<version>.md

5) Risk-based testing:
   docs/MASTER_PACK/13-test-cases/RISK_MATRIX.md:
   - Per feature: impact × likelihood
   - High-risk features get MORE tests (auto-journal, ZATCA, payroll)
   - Low-risk features get smoke tests only

6) Test reporting:
   src/app/(dashboard)/admin/test-coverage/page.tsx:
   - Coverage trends (line chart)
   - Stories without tests
   - Flaky tests (failure rate)
   - Avg test execution time

القيود:
- كل story جديدة MUST have tests قبل merge
- naming convention: tests follow story IDs
- test data: factories, never random
```

## السيناريو

PM يحضّر UAT لـ release v2.5:

1. يفتح `docs/MASTER_PACK/13-test-cases/COVERAGE_MATRIX.csv`
2. يفلتر بـ "release v2.5 stories"
3. كل story له status:
   - ✅ tests passing
   - ⚠️ tests exist but flaky
   - ❌ no tests
4. يدعو CFO + Sales Manager + Compliance Officer لـ UAT meeting
5. يفتح `UAT_SIGNOFF_TEMPLATE.md` ويعبئه
6. كل stakeholder يجرّب الـ stories في staging
7. يوقّعون
8. PR ينتقل لـ production deploy

Developer يضيف feature جديد:
1. PM يكتب 5 stories: US-payroll-12 through 16
2. Developer يبدأ بالكتابة
3. CI hook: قبل commit, يكتشف stories جديدة بدون tests
4. ❌ Block: "US-payroll-12 has no test file"
5. Developer ينشئ `tests/api/payroll/US-payroll-12.test.ts`
6. CI passes ✓

## Data Flow

```
[Story-test mapping flow]
docs/user-stories/<module>.md (source of truth)
   ↓
scripts/map-stories-to-tests.ts (daily cron)
   ↓
Parse markdown:
   - Find ## US-XXX-NN headers
   - Extract story metadata
   ↓
Search tests/**/*.test.ts:
   - grep describe/it for US-XXX-NN
   - count matching tests
   ↓
Generate CSV with status
   ↓
Update README badge: "Story Coverage: 87%"

[Test execution flow]
PR opened
   ↓
CI runs full suite
   ↓
For each test:
   - record duration
   - record pass/fail
   - record story ID if in description
   ↓
On completion:
   POST results to /api/test-runs
   ↓
Update test-runs table
   ↓
Dashboard /admin/test-coverage shows trends

[UAT flow]
PM creates UAT session
   ↓
Selects release tag v2.5
   ↓
System fetches all stories in release
   ↓
Generates UAT checklist
   ↓
Stakeholders run through manually in staging
   ↓
Each checks: pass / fail / blocked
   ↓
Sign off (or list issues)
   ↓
Stored in uat-history/v2.5.md
   ↓
If all signed → tag eligible for production
```

## ملفات المُنتَج

- `scripts/map-stories-to-tests.ts`
- `docs/MASTER_PACK/13-test-cases/COVERAGE_MATRIX.csv`
- `docs/MASTER_PACK/13-test-cases/TEST_PLAN.md`
- `docs/MASTER_PACK/13-test-cases/RISK_MATRIX.md`
- `docs/MASTER_PACK/13-test-cases/UAT_SIGNOFF_TEMPLATE.md`
- `docs/MASTER_PACK/13-test-cases/uat-history/<version>.md`
- `tests/<module>/US-<id>.test.ts` (auto-stubbed)
- `src/app/(dashboard)/admin/test-coverage/page.tsx`
- `src/app/api/test-runs/route.ts`
- `prisma/schema.prisma` — TestRun model (new)
