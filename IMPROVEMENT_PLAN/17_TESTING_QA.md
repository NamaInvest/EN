# 1️⃣7️⃣ Testing & QA | الاختبار وضبط الجودة

## 🔍 الحالة الحالية

### الإحصائيات
- **571 ملف اختبار**
- محركات GOSI, WPS, EOS, ZATCA, IFRS9, FX مغطّاة
- ai-stack.test.ts: 11/11 passing

### 🔴 الفجوات الكاملة
| الفجوة | الخطورة |
|--------|--------|
| **0 E2E tests** (Playwright) | 🔴🔴 |
| لا coverage reporting | 🔴 |
| لا mutation testing | 🟠 |
| لا load/stress testing (k6) | 🟠 |
| لا security testing (OWASP ZAP) | 🟠 |
| لا accessibility testing (axe-core) | 🟠 |
| لا visual regression | 🟡 |
| لا contract testing | 🟡 |
| Multi-tenant isolation غير مغطّي | 🔴 |

---

## 🎯 إستراتيجية الاختبار الشاملة

### الهرم (Test Pyramid)
```
                  /\
                 /  \  E2E (10-20)
                /----\
               /      \  Integration (200+)
              /--------\
             /          \  Unit (1000+)
            /____________\
```

### Coverage Targets
| النوع | الهدف |
|------|------|
| Unit tests | 80% |
| Integration tests | 60% |
| E2E tests | 25 critical flows |
| Security scans | كل PR |
| Performance tests | weekly |

---

## 🎯 الخطة التفصيلية

تفاصيل كل نوع في الملفات التالية:
- [Unit Testing](18_UNIT_TESTING.md)
- [Integration Testing](19_INTEGRATION_TESTING.md)

### المرحلة 17.1 — Test Strategy Document (يومين)

```markdown
# Namasoft Test Strategy

## مستويات الاختبار

### 1. Unit Tests (Vitest)
- يختبر دالة/كلاس واحد
- لا يصل لـ DB حقيقي (mocks)
- سريع: < 100ms per test
- يعمل على كل push

### 2. Integration Tests (Vitest + Test Containers)
- يختبر تفاعل عدة components
- يستخدم real PostgreSQL + Redis (test containers)
- متوسط: < 5s per test
- يعمل على كل PR

### 3. E2E Tests (Playwright)
- يختبر الـ user flow كامل
- browser حقيقي + DB حقيقي
- بطيء: < 30s per test
- يعمل nightly + قبل الـ deploy

### 4. Smoke Tests (Playwright subset)
- يختبر النقاط الحرجة فقط
- يعمل بعد كل deploy
- < 5 دقائق total

### 5. Load Tests (k6)
- يقيس قدرة الـ API تحت ضغط
- يعمل weekly
- يكشف bottlenecks

### 6. Security Tests
- CodeQL على كل PR
- Snyk على كل PR
- OWASP ZAP weekly
- Manual pentest كل ربع
```

---

### المرحلة 17.2 — Test Data Factories (3 أيام)

```typescript
// src/test/factories/index.ts
import { faker } from '@faker-js/faker/locale/ar';
import { Decimal } from '@prisma/client/runtime/library';

export const factories = {
  tenant: (overrides = {}) => ({
    id: cuid(),
    name: faker.company.name(),
    plan: 'pro' as const,
    ...overrides,
  }),

  user: (overrides = {}) => ({
    id: cuid(),
    tenantId: 'test-tenant',
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'user',
    ...overrides,
  }),

  customer: (overrides = {}) => ({
    id: cuid(),
    tenantId: 'test-tenant',
    name: faker.company.name(),
    nameEn: faker.company.name(),
    vatNumber: '300' + faker.string.numeric(11) + '03',
    creditLimit: new Decimal(faker.number.int({ min: 10_000, max: 1_000_000 })),
    ...overrides,
  }),

  product: (overrides = {}) => ({
    id: cuid(),
    tenantId: 'test-tenant',
    name: faker.commerce.productName(),
    sku: faker.string.alphanumeric(10).toUpperCase(),
    buyPrice: new Decimal(faker.number.float({ min: 1, max: 1000, fractionDigits: 2 })),
    sellPrice: new Decimal(faker.number.float({ min: 10, max: 2000, fractionDigits: 2 })),
    taxRate: new Decimal('15'),
    ...overrides,
  }),

  salesInvoice: (overrides = {}) => ({
    id: cuid(),
    tenantId: 'test-tenant',
    invoiceNo: 'SI-' + faker.string.numeric(6),
    customerId: cuid(),
    date: faker.date.recent(),
    subtotal: new Decimal('1000.00'),
    taxValue: new Decimal('150.00'),
    total: new Decimal('1150.00'),
    status: 'draft',
    ...overrides,
  }),

  journalEntry: (overrides = {}) => ({
    id: cuid(),
    tenantId: 'test-tenant',
    entryNo: 'JE-' + faker.string.numeric(6),
    entryDate: faker.date.recent(),
    narration: faker.lorem.sentence(),
    totalDebit: new Decimal('1000.00'),
    totalCredit: new Decimal('1000.00'),
    status: 'draft',
    ...overrides,
  }),

  // Builder pattern للحالات المعقّدة
  buildSalesInvoiceWithLines(itemCount = 3, overrides = {}) {
    const items = Array.from({ length: itemCount }, () => ({
      productId: cuid(),
      quantity: new Decimal(faker.number.int({ min: 1, max: 10 })),
      price: new Decimal(faker.number.float({ min: 10, max: 1000, fractionDigits: 2 })),
      taxRate: new Decimal('15'),
    }));

    const subtotal = items.reduce((sum, item) =>
      sum.add(item.quantity.mul(item.price)), new Decimal(0));
    const tax = subtotal.mul('0.15');
    const total = subtotal.add(tax);

    return {
      ...factories.salesInvoice({ subtotal, taxValue: tax, total, ...overrides }),
      details: items,
    };
  },
};

// Usage
const invoice = factories.buildSalesInvoiceWithLines(5, { status: 'posted' });
```

---

### المرحلة 17.3 — Mocks & Stubs (2 أيام)

```typescript
// src/test/mocks/prisma.ts
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

export type MockedPrisma = MockProxy<PrismaClient>;

export function createMockPrisma(): MockedPrisma {
  return mockDeep<PrismaClient>();
}

// src/test/mocks/redis.ts
export class MockRedis {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async setex(key: string, ttl: number, value: string): Promise<'OK'> {
    this.store.set(key, value);
    setTimeout(() => this.store.delete(key), ttl * 1000);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

// src/test/mocks/llm.ts
export class MockLLM {
  responses: Map<string, string> = new Map();

  setResponse(promptPattern: string, response: string) {
    this.responses.set(promptPattern, response);
  }

  async invoke(prompt: string): Promise<{ content: string }> {
    for (const [pattern, response] of this.responses) {
      if (prompt.includes(pattern)) return { content: response };
    }
    return { content: 'default mock response' };
  }
}
```

---

### المرحلة 17.4 — Test Utilities (2 أيام)

```typescript
// src/test/utils/setup.ts
export async function setupTestDb(): Promise<PrismaClient> {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  // Reset
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
  // ... etc

  // Seed
  await seedTestData(prisma);

  return prisma;
}

export async function teardownTestDb(prisma: PrismaClient) {
  await prisma.$disconnect();
}

// src/test/utils/auth.ts
export async function authenticatedRequest(
  app: any,
  options: { role?: string; tenantId?: string } = {}
): Promise<{ headers: Record<string, string> }> {
  const token = jwt.sign(
    { userId: 'test-user', tenantId: options.tenantId || 'test-tenant', role: options.role || 'user' },
    process.env.JWT_SECRET!
  );

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-tenant-id': options.tenantId || 'test-tenant',
    },
  };
}

// src/test/utils/assertions.ts
import { Decimal } from '@prisma/client/runtime/library';

export function expectJournalBalanced(entry: { totalDebit: Decimal; totalCredit: Decimal }) {
  const diff = entry.totalDebit.sub(entry.totalCredit).abs();
  expect(diff.lte(new Decimal('0.01'))).toBe(true);
}

export function expectArrayEqualUnordered<T>(actual: T[], expected: T[]) {
  expect([...actual].sort()).toEqual([...expected].sort());
}
```

---

### المرحلة 17.5 — Performance Testing (3 أيام)

```javascript
// k6/scenarios/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '30s', target: 500 },
        { duration: '1m', target: 100 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://staging.namasoft.com/api/health', {
    headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}` },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

### المرحلة 17.6 — Security Testing (3 أيام)

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on:
  schedule: [{ cron: '0 0 * * 0' }]  # Weekly

jobs:
  zap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: ZAP Scan
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: 'https://staging.namasoft.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

      - name: Upload report
        uses: actions/upload-artifact@v4
        with: { name: zap-report, path: report_html.html }
```

---

### المرحلة 17.7 — Visual Regression (2 أيام — اختياري)

```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
});

// tests/visual/dashboard.visual.ts
test('dashboard visual', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('dashboard.png', { fullPage: true });
});
```

---

## 📊 المخرجات الإجمالية

| المقياس | قبل | بعد |
|---------|-----|-----|
| Unit test coverage | غير معلوم | 80%+ |
| Integration tests | جزئي | 200+ |
| E2E tests | 0 | 25+ |
| Coverage reporting | لا | codecov |
| Mutation testing | لا | محركات حرجة |
| Load testing | لا | weekly |
| Security testing | لا | weekly + كل PR |
| Visual regression | لا | optional |
| Test data factories | لا | كاملة |

---

## ⏱️ الجدول الزمني
- **المدة:** 17 يوم عمل + Unit/Integration (في الملفات المخصصة)
- **الفريق:** 1-2 QA + dev support
- **الأولوية:** 🟠 عالية

---

## ✅ معايير القبول العامة
- [ ] Strategy doc موثّق
- [ ] Factories لكل model رئيسي
- [ ] Mocks لـ Prisma, Redis, LLM
- [ ] Test utilities موحّدة
- [ ] Coverage > 80% للكود الجديد
- [ ] CI fail لو coverage decreased
- [ ] Weekly security + load reports
