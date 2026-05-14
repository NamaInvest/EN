# 40 - الاختبارات والجودة (Tests & Quality)

> Jest + Playwright + Testcontainers + A11y + Type checking + Linting

---

## 🧪 إطار الاختبارات

### الـ Frameworks:
- **Jest** 30.4.2 — Unit + Integration tests
- **Playwright** 1.59.1 — E2E + A11y tests
- **Testcontainers** 11.14.0 — DB + Redis في tests
- **Vitest** 4.1.5 — Alternative (للـ migration)
- **React Testing Library** 16.3.2 — Component tests
- **fast-check** 4.7.0 — Property-based testing

---

## 📁 هيكل الاختبارات

```
tests/                          ← Root tests
├── a11y/                        ← Accessibility tests (Playwright)
├── financial-integration/       ← Integration tests (heavy)
└── unit/                        ← Unit tests (Jest)

src/lib/__tests__/              ← Tests داخل lib
  ├── auto-journal.test.ts
  ├── bnpl.test.ts
  ├── document-state-machine.test.ts
  ├── field-audit.test.ts
  ├── money.test.ts
  ├── quotaGuard.test.ts
  ├── validations.test.ts
  ├── zatca.test.ts
  ├── usePagePermission.test.ts
```

---

## 📦 Scripts

```bash
# Unit tests
npm run test:unit
# = jest --testPathIgnorePatterns=financial-integration

# E2E tests
npm run test:e2e
# = cross-env TEST_BASE_URL=http://localhost:3000 jest --testPathPattern=financial-integration --runInBand

# Coverage
npm run test:cov
# = jest --coverage

# Domain tests
npm run test:domain
# = jest --testPathPattern=tests/

# Full validation
npm run validate
# = typecheck + lint + tests
```

---

## ✅ Unit Tests (Jest)

### مثال: `auto-journal.test.ts`
```typescript
describe('auto-journal', () => {
    let prisma;
    
    beforeAll(async () => {
        // Setup test DB (Testcontainers)
        prisma = await getTestPrisma();
    });
    
    afterAll(async () => {
        await prisma.$disconnect();
    });
    
    beforeEach(async () => {
        await prisma.journalEntry.deleteMany();
    });
    
    it('should post a balanced journal entry', async () => {
        const entry = await postSalesInvoice({
            invoiceId: 1,
            customerId: 10,
            amount: 100,
            vat: 15
        });
        
        expect(entry.totalDebit).toBe(115);
        expect(entry.totalCredit).toBe(115);
        expect(entry.status).toBe('POSTED');
    });
    
    it('should reject unbalanced entry', async () => {
        await expect(
            createJournalEntry({
                lines: [
                    { account: 'CASH', debit: 100 },
                    { account: 'REVENUE', credit: 90 }  // Unbalanced!
                ]
            })
        ).rejects.toThrow('Imbalance');
    });
});
```

### مثال: `money.test.ts`
```typescript
describe('Money', () => {
    it('should handle decimal precision', () => {
        const result = Money.add(0.1, 0.2);
        expect(result.toNumber()).toBe(0.3);  // not 0.30000000004
    });
    
    it('should round to 2 decimals', () => {
        const total = Money.multiply(100, 0.15);
        expect(Money.round(total).toNumber()).toBe(15.00);
    });
});
```

### مثال: `document-state-machine.test.ts`
```typescript
describe('Document State Machine', () => {
    const sm = new DocumentStateMachine('SalesInvoice', {
        DRAFT: ['SUBMITTED', 'CANCELLED'],
        SUBMITTED: ['POSTED', 'REJECTED'],
        POSTED: ['REVERSED'],
        REVERSED: []
    });
    
    it('should allow valid transitions', () => {
        expect(() => sm.transition('DRAFT', 'SUBMITTED')).not.toThrow();
    });
    
    it('should reject invalid transitions', () => {
        expect(() => sm.transition('DRAFT', 'POSTED')).toThrow();
    });
});
```

---

## 🌐 E2E Tests (Playwright)

### مثال: `financial-integration/sales-flow.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Sales Flow E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('[name="username"]', 'admin');
        await page.fill('[name="password"]', 'admin7773');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
    });
    
    test('should create and post sales invoice', async ({ page }) => {
        await page.goto('/sales');
        await page.click('button:has-text("فاتورة جديدة")');
        
        await page.fill('[name="customer"]', 'العميل النقدي');
        await page.click('button:has-text("إضافة منتج")');
        await page.fill('[name="product"]', 'PROD-001');
        await page.fill('[name="quantity"]', '10');
        await page.fill('[name="price"]', '50');
        
        await page.click('button:has-text("حفظ")');
        
        await expect(page.locator('text=تم الحفظ')).toBeVisible();
        await expect(page.locator('text=500.00')).toBeVisible();  // Subtotal
        await expect(page.locator('text=75.00')).toBeVisible();   // VAT
        await expect(page.locator('text=575.00')).toBeVisible();  // Total
    });
});
```

### تشغيل:
```bash
npm run test:e2e
# يتطلب TEST_BASE_URL يشير لخادم running
```

---

## ♿ A11y Tests (Accessibility)

### في `tests/a11y/`:
```typescript
import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
    test('Dashboard has no a11y violations', async ({ page }) => {
        await page.goto('/dashboard');
        
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        
        expect(results.violations).toEqual([]);
    });
    
    test('Login form is keyboard navigable', async ({ page }) => {
        await page.goto('/login');
        
        await page.keyboard.press('Tab');
        await expect(page.locator('[name="username"]')).toBeFocused();
        
        await page.keyboard.press('Tab');
        await expect(page.locator('[name="password"]')).toBeFocused();
        
        await page.keyboard.press('Tab');
        await expect(page.locator('button[type="submit"]')).toBeFocused();
    });
});
```

---

## 🐳 Testcontainers (DB + Redis)

### Setup:
```typescript
// tests/setup.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';

let pgContainer;
let redisContainer;

beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer('postgres:18-alpine')
        .withDatabase('test_db')
        .withUsername('test_user')
        .withPassword('test_password')
        .start();
    
    process.env.DATABASE_URL = pgContainer.getConnectionUri();
    
    redisContainer = await new RedisContainer('redis:7-alpine').start();
    process.env.REDIS_URL = redisContainer.getConnectionUri();
    
    // Apply Prisma schema
    execSync('npx prisma db push', { env: process.env });
});

afterAll(async () => {
    await pgContainer?.stop();
    await redisContainer?.stop();
});
```

### Benefits:
- ✅ Tests isolated من production DB
- ✅ Cleanup تلقائي
- ✅ Parallel tests
- ✅ Reproducible

---

## 🎲 Property-Based Testing (fast-check)

```typescript
import * as fc from 'fast-check';

describe('Tax Calculation', () => {
    it('should always produce valid VAT for any amount', () => {
        fc.assert(
            fc.property(
                fc.float({ min: 0, max: 1000000 }),
                (amount) => {
                    const vat = calculateVAT(amount, 0.15);
                    expect(vat).toBeGreaterThanOrEqual(0);
                    expect(vat).toBeLessThanOrEqual(amount * 0.16); // tolerance
                }
            )
        );
    });
});
```

---

## 📊 Coverage Goals

### Current Status:
- ✅ **Critical engines:** auto-journal, money, validations, ZATCA, state-machine
- 🟡 **Most engines:** ~30-50% coverage
- ❌ **UI components:** اختبارات قليلة
- ❌ **E2E:** scenarios محدودة

### Targets:
- **Unit tests:** 80%+ coverage
- **Integration tests:** All critical flows
- **E2E:** Happy paths لكل module
- **A11y:** WCAG 2.1 AA compliance

---

## 🔍 Type Checking

### الـ Command:
```bash
npm run typecheck
# = npx tsc --noEmit
```

### الـ Config (`tsconfig.json`):
```json
{
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "alwaysStrict": true,
        "esModuleInterop": true
    }
}
```

### الـ Rules:
- ❌ **لا `any`** — استخدم `unknown` ثم تحقق
- ✅ **Type narrowing** قبل الاستخدام
- ✅ **Discriminated unions** للحالات

---

## 🧹 Linting (ESLint)

### الـ Command:
```bash
npm run lint
# = eslint
```

### Pre-commit hook:
```bash
# .husky/pre-commit
npm run lint
npm run typecheck
npm run test:unit -- --passWithNoTests
```

### Rules:
- no-unused-vars
- no-console (use logger)
- prefer-const
- no-var
- React hooks rules
- Next.js specific rules

---

## 🤖 CI/CD (Github Actions / GitLab CI — مقترح)

### `.github/workflows/ci.yml`:
```yaml
name: CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run build
  
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx prisma db push
      - run: npm run test:e2e
```

### Pre-deploy checks:
1. ✅ Lint passes
2. ✅ Typecheck passes
3. ✅ Unit tests pass
4. ✅ Build succeeds
5. ✅ E2E tests pass (للـ critical paths)

---

## 🐛 Bug Reproduction Workflow

### عند تقرير bug:
```
1. أنشئ failing test:
   tests/regressions/bug-{issue-id}.test.ts
   - يستنسخ الخطأ
   - يفشل initially
   
2. أصلح الكود
3. تأكد الـ test يمر
4. لا تحذف الـ test (للمستقبل)
5. وثّق في commit:
   fix(module): description (closes #{issue-id})
```

---

## 📋 Test Coverage Report

```bash
npm run test:cov
# يولّد coverage/index.html
```

### المعايير:
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

### مناطق حرجة (يجب 95%+):
- Accounting (auto-journal, posting)
- ZATCA signing
- Tax calculations
- Money arithmetic
- Security (auth, MFA)

---

## 🎯 Best Practices

1. ✅ **Test pyramid:** كثير Unit، أقل Integration، قليل E2E
2. ✅ **Tests independent** (لا تعتمد على بعض)
3. ✅ **Tests fast** (Unit < 100ms)
4. ✅ **Tests readable** (Given-When-Then)
5. ✅ **Mocks محدودة** — استخدم Testcontainers
6. ✅ **Snapshot tests للـ UI**
7. ❌ **لا tests** بدون assertions
8. ❌ **لا tests** مع `setTimeout` (use proper async)
9. ✅ **CI لكل PR**
10. ✅ **No deploy** بدون tests passing
