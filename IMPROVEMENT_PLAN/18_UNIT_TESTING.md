# 1️⃣8️⃣ Unit Testing | اختبار الوحدات

## 🔍 الحالة الحالية

### ✅ الموجود (571 test file)
- محركات مغطّاة:
  - GOSI engine
  - WPS generator
  - EOS calculator (Saudi)
  - ZATCA EOS engine
  - IFRS9 engine
  - FX revaluation
  - Budget engine
  - Leave engine
- `ai-stack.test.ts`: 11/11 passing

### 🔴 الفجوات
| الفجوة | الموقع |
|--------|--------|
| لا coverage measurement | Vitest config |
| auto-journal.ts غير مختبر بالكامل | [src/lib/auto-journal.ts](../src/lib/auto-journal.ts) |
| لا mutation testing | — |
| لا property-based testing للحسابات | — |
| Multi-tenant guards غير مختبرة | — |
| State machine transitions غير مختبرة | — |

---

## 🎯 الخطة التفصيلية

### المرحلة 18.1 — Coverage Activation (1 يوم)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '__tests__/**/*.{test,spec}.ts',
      'tests/**/*.{test,spec}.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.d.ts',
        'src/scripts/**',
        'src/test/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        // Critical paths require higher coverage
        'src/lib/auto-journal.ts': { lines: 95 },
        'src/services/accounting/**': { lines: 90 },
        'src/services/payroll/**': { lines: 90 },
        'src/lib/state-machine/**': { lines: 90 },
      },
    },
  },
});
```

---

### المرحلة 18.2 — Auto-Journal Tests Comprehensive (5 أيام)

```typescript
// src/lib/__tests__/auto-journal.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';
import { postSalesInvoice, postPurchaseInvoice, postPayroll } from '../auto-journal';
import { factories } from '@/test/factories';
import { createMockPrisma } from '@/test/mocks/prisma';

describe('Auto-Journal', () => {
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  describe('postSalesInvoice', () => {
    it('creates balanced journal entry for cash sale', async () => {
      const invoice = factories.salesInvoice({
        subtotal: new Decimal('1000'),
        taxValue: new Decimal('150'),
        total: new Decimal('1150'),
        paymentMethod: 'cash',
      });

      const je = await postSalesInvoice(invoice, prisma);

      // Debit Cash 1150
      expect(je.lines.find(l => l.account === '1010')?.debit).toEqual(new Decimal('1150'));
      // Credit Sales Revenue 1000
      expect(je.lines.find(l => l.account === '4001')?.credit).toEqual(new Decimal('1000'));
      // Credit VAT Payable 150
      expect(je.lines.find(l => l.account === '2110')?.credit).toEqual(new Decimal('150'));

      const totalDebit = je.lines.reduce((sum, l) => sum.add(l.debit || 0), new Decimal(0));
      const totalCredit = je.lines.reduce((sum, l) => sum.add(l.credit || 0), new Decimal(0));
      expect(totalDebit).toEqual(totalCredit);
    });

    it('creates balanced journal entry for credit sale', async () => {
      const invoice = factories.salesInvoice({ paymentMethod: 'credit' });
      const je = await postSalesInvoice(invoice, prisma);

      expect(je.lines.find(l => l.account === '1130')?.debit).toBeDefined(); // AR
      expectJournalBalanced(je);
    });

    it('handles zero VAT correctly', async () => {
      const invoice = factories.salesInvoice({
        subtotal: new Decimal('1000'),
        taxValue: new Decimal('0'),
        total: new Decimal('1000'),
      });

      const je = await postSalesInvoice(invoice, prisma);
      expect(je.lines.find(l => l.account === '2110')).toBeUndefined();
      expectJournalBalanced(je);
    });

    it('handles discount correctly', async () => {
      const invoice = factories.salesInvoice({
        subtotal: new Decimal('1000'),
        discountValue: new Decimal('100'),
        taxValue: new Decimal('135'),
        total: new Decimal('1035'),
      });

      const je = await postSalesInvoice(invoice, prisma);
      expectJournalBalanced(je);
    });

    it('handles foreign currency with exchange rate', async () => {
      const invoice = factories.salesInvoice({
        currency: 'USD',
        exchangeRate: new Decimal('3.75'),
        subtotal: new Decimal('1000'),  // USD
        total: new Decimal('1150'),     // USD
      });

      const je = await postSalesInvoice(invoice, prisma);
      // Debit/Credit في SAR
      expect(je.lines[0].debit).toEqual(new Decimal('4312.50')); // 1150 * 3.75
      expectJournalBalanced(je);
    });

    it('rejects negative amounts', async () => {
      const invoice = factories.salesInvoice({ total: new Decimal('-100') });
      await expect(postSalesInvoice(invoice, prisma)).rejects.toThrow('Negative');
    });

    it('rejects when fiscal period is closed', async () => {
      // ...
    });
  });

  describe('postPurchaseInvoice', () => {
    it('creates GR/IR entry on goods receipt', async () => { /* ... */ });
    it('reverses GR/IR on invoice match', async () => { /* ... */ });
    // ...
  });

  describe('postPayroll', () => {
    it('handles GOSI deduction correctly', async () => { /* ... */ });
    it('handles WHT for foreign employees', async () => { /* ... */ });
    // ...
  });

  describe('Edge Cases', () => {
    it('handles very large amounts (Decimal precision)', async () => {
      const invoice = factories.salesInvoice({
        subtotal: new Decimal('999999999999.9999'),
        total: new Decimal('1149999999999.9999'),
      });

      const je = await postSalesInvoice(invoice, prisma);
      expectJournalBalanced(je);
    });

    it('handles rounding correctly', async () => {
      const invoice = factories.salesInvoice({
        subtotal: new Decimal('100.333'),
        taxValue: new Decimal('15.05'),
        total: new Decimal('115.383'),
      });

      const je = await postSalesInvoice(invoice, prisma);
      expectJournalBalanced(je);
    });
  });
});
```

---

### المرحلة 18.3 — Property-Based Testing (3 أيام)

```typescript
// src/lib/__tests__/decimal-arithmetic.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { Decimal } from '@prisma/client/runtime/library';

describe('Decimal arithmetic properties', () => {
  it('addition is commutative', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1e9, noNaN: true }),
        fc.float({ min: 0, max: 1e9, noNaN: true }),
        (a, b) => {
          const x = new Decimal(a).add(b);
          const y = new Decimal(b).add(a);
          return x.equals(y);
        }
      )
    );
  });

  it('multiplication distributes over addition', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000, noNaN: true }),
        fc.float({ min: 0, max: 1000, noNaN: true }),
        fc.float({ min: 0, max: 1000, noNaN: true }),
        (a, b, c) => {
          const x = new Decimal(a).mul(new Decimal(b).add(c));
          const y = new Decimal(a).mul(b).add(new Decimal(a).mul(c));
          return x.minus(y).abs().lte('0.0001');
        }
      )
    );
  });
});

// Property-based test for journal balance
describe('Journal entry properties', () => {
  it('any sale produces balanced journal entry', () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          subtotal: fc.float({ min: 0.01, max: 1e6, noNaN: true }),
          taxRate: fc.float({ min: 0, max: 0.20, noNaN: true }),
          discountRate: fc.float({ min: 0, max: 0.50, noNaN: true }),
        }),
        async ({ subtotal, taxRate, discountRate }) => {
          const sub = new Decimal(subtotal);
          const discount = sub.mul(discountRate);
          const afterDiscount = sub.sub(discount);
          const tax = afterDiscount.mul(taxRate);
          const total = afterDiscount.add(tax);

          const invoice = factories.salesInvoice({
            subtotal: sub,
            discountValue: discount,
            taxValue: tax,
            total,
          });

          const je = await postSalesInvoice(invoice, mockPrisma);
          expectJournalBalanced(je);
        }
      )
    );
  });
});
```

---

### المرحلة 18.4 — State Machine Tests (3 أيام)

```typescript
// src/lib/state-machine/__tests__/enforcer.test.ts
describe('State Machine Enforcer', () => {
  describe('SalesInvoice transitions', () => {
    it('allows DRAFT → POSTED', async () => {
      const invoice = factories.salesInvoice({ status: 'draft' });
      const result = await stateMachine.transition(invoice.id, 'draft', 'posted', 'POST', ctx);
      expect(result.success).toBe(true);
    });

    it('rejects DRAFT → ARCHIVED (skip step)', async () => {
      const invoice = factories.salesInvoice({ status: 'draft' });
      await expect(
        stateMachine.transition(invoice.id, 'draft', 'archived', 'ARCHIVE', ctx)
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('rejects POSTED → POSTED (idempotency)', async () => {
      const invoice = factories.salesInvoice({ status: 'posted' });
      await expect(
        stateMachine.transition(invoice.id, 'posted', 'posted', 'POST', ctx)
      ).rejects.toThrow();
    });

    it('logs transition to audit trail', async () => {
      // ...
    });

    it('runs guards before transition', async () => {
      // مثال: لا يمكن posting بدون رقم فاتورة
    });

    it('runs effects after transition', async () => {
      // مثال: posting يطلق ZATCA submission
    });
  });

  describe('Concurrent transitions', () => {
    it('serializes concurrent transition attempts', async () => {
      const invoice = factories.salesInvoice({ status: 'draft' });

      const [r1, r2] = await Promise.allSettled([
        stateMachine.transition(invoice.id, 'draft', 'posted', 'POST', ctx),
        stateMachine.transition(invoice.id, 'draft', 'posted', 'POST', ctx),
      ]);

      // واحد ينجح، الثاني يفشل
      const successes = [r1, r2].filter(r => r.status === 'fulfilled');
      expect(successes.length).toBe(1);
    });
  });
});
```

---

### المرحلة 18.5 — Multi-Tenant Isolation Tests (4 أيام)

```typescript
// src/middleware/__tests__/tenant-isolation.test.ts
describe('Multi-tenant isolation', () => {
  let prismaA: PrismaClient;
  let prismaB: PrismaClient;

  beforeAll(async () => {
    prismaA = await getPrisma('tenant-a');
    prismaB = await getPrisma('tenant-b');
  });

  it('tenant A cannot see tenant B data', async () => {
    await prismaB.salesInvoice.create({
      data: factories.salesInvoice({ tenantId: 'tenant-b' }),
    });

    const found = await prismaA.salesInvoice.findMany();
    expect(found.every(inv => inv.tenantId === 'tenant-a')).toBe(true);
  });

  it('cannot create record with wrong tenantId', async () => {
    await expect(
      prismaA.salesInvoice.create({
        data: factories.salesInvoice({ tenantId: 'tenant-b' }),
      })
    ).rejects.toThrow();  // Validator should reject
  });

  it('audit log is tenant-scoped', async () => {
    // ...
  });
});
```

---

### المرحلة 18.6 — Mutation Testing (4 أيام)

```bash
# Install
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
```

```javascript
// stryker.conf.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "reporters": ["html", "clear-text", "progress"],
  "testRunner": "vitest",
  "checkers": ["typescript"],
  "tsconfigFile": "tsconfig.json",
  "mutate": [
    "src/lib/auto-journal.ts",
    "src/lib/state-machine/**",
    "src/services/accounting/**",
    "src/services/payroll/**"
  ],
  "thresholds": { "high": 80, "low": 60, "break": 50 }
}
```

```bash
# تشغيل
npx stryker run

# يكشف tests ضعيفة (TestStrength)
# مثال: لو اختبار يمر حتى عند تغيير `>` إلى `<`، الـ test ضعيف
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Test files | 571 | 800+ |
| Coverage measurement | لا | متفعّل |
| Coverage % | غير معلوم | 80%+ |
| auto-journal coverage | جزئي | 95%+ |
| Property-based tests | 0 | 20+ |
| State machine tests | 0 | شامل |
| Multi-tenant tests | لا | شامل |
| Mutation score | غير معلوم | > 80% |

---

## ⏱️ الجدول الزمني
- **المدة:** 20 يوم عمل
- **الفريق:** 1 QA + 1 backend
- **الأولوية:** 🟠 عالية (يحمي المنطق المحاسبي)

---

## ✅ معايير القبول
- [ ] Coverage report يظهر في كل PR
- [ ] Coverage > 80% (إجمالي)
- [ ] Coverage > 95% للملفات الحرجة
- [ ] Property tests على decimal arithmetic
- [ ] State machine transitions كلها مختبرة
- [ ] Multi-tenant isolation tests شاملة
- [ ] Mutation score > 80% للمحركات الحرجة
