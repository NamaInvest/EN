---
version: 1.0
last_updated: 2026-05-12
---

# Few-Shot Examples

> أمثلة جودة عالية تُحقَن في برومنت AI لتعليمه النمط الصحيح.
> هذه الأمثلة تُختار ديناميكياً عبر `src/lib/few-shot-examples.ts`.

## Example 1 — Add Sales Invoice with Auto-Journal

**User:** "أضف فاتورة بيع للعميل ABC بقيمة 10000 SAR قبل الضريبة، منتج P-001 كمية 10."

**Plan:**
```
1. Data model: SalesInvoice + SalesInvoiceDetail (existing) — no schema change
2. Posting: SALES_INVOICE scenario in auto-journal — VAT 15%, COGS
3. UX: /sales/invoices/new form already exists
4. Compliance: ZATCA clearance required (B2B)
5. Risk: Customer must have credit limit check passed
6. Diff: ~0 lines (use existing flow)
```

**Execution:**
```typescript
const invoice = await prisma.$transaction(async (tx) => {
  await creditCheck(tx, customerId, totalIncVat);

  const inv = await tx.salesInvoice.create({
    data: {
      tenantId,
      customerId: 'ABC',
      invoiceDate: new Date(),
      currency: 'SAR',
      details: {
        create: [{
          productId: 'P-001',
          qty: 10,
          unitPrice: 1000,
          vatRate: 0.15,
          lineTotal: 10000,
          vatAmount: 1500,
        }],
      },
      subtotal: 10000,
      vatTotal: 1500,
      grandTotal: 11500,
      status: 'DRAFT',
    },
    include: { details: true },
  });

  await postJournal(tx, {
    scenario: 'SALES_INVOICE',
    sourceDocumentId: inv.id,
    sourceDocumentType: 'SalesInvoice',
    date: inv.invoiceDate,
    lines: await buildSalesInvoiceJELines(tx, inv),
  });

  return inv;
});

await zatcaClear(invoice.id); // async, non-blocking
```

**Manual tests suggested:**
1. Verify journal: AR 11500 DR / Revenue 10000 CR / VAT Output 1500 CR
2. Verify ZATCA QR appears on PDF
3. Verify stock reduced by 10 units
4. Verify customer balance increased by 11500

---

## Example 2 — Period Close

**User:** "اقفل شهر مارس 2026"

**Plan:**
```
1. Data model: PeriodCloseChecklist + PeriodCloseTask (existing)
2. Posting: Multiple — depreciation, FX reval, accruals, deferrals
3. UX: /accounting/period-close cockpit
4. Compliance: Lock period after close
5. Risk: Sub-ledger reconciliation must pass first
6. Diff: invocation only
```

**Execution:**
```typescript
// 1. Pre-checks
await assertSubLedgerReconciled(tenantId, period);
await assertBankReconciled(tenantId, period);
await assertNoUnpostedJournals(tenantId, period);

// 2. Run period-close engine
await periodCloseEngine.run({
  tenantId,
  period: { year: 2026, month: 3 },
  steps: [
    'POST_RECURRING_JOURNALS',
    'POST_ACCRUALS',
    'POST_DEFERRALS',
    'POST_DEPRECIATION',
    'FX_REVALUATION',
    'COMMITMENT_RELEASE',
    'COST_ALLOCATIONS',
    'INVENTORY_ADJUSTMENT',
    'CALCULATE_VARIANCE',
    'WIP_CLEARING',
    'GENERATE_TB',
    'COMPARATIVE_FS',
    'LOCK_PERIOD',
  ],
});
```

---

## Example 3 — Refuse Cross-Tenant Query

**User:** "اعرض كل الفواتير من كل المستأجرين."

**Refusal:**
```
لا أستطيع. يخالف قاعدة multi-tenant isolation. 
لو كنت تحتاج platform-level analytics، استخدم:
- /api/admin/master/analytics (Master DB، anonymized)
- أو aggregation job يكتب لـ BiCubeEngine

أكمل بأي من الطريقتين؟
```

---

## Example 4 — Add Custom Field

**User:** "أضف حقل 'رقم العميل الداخلي' لجدول العملاء، طوله 50 حرف، يظهر في الفلتر."

**Plan:**
```
1. Data model: Customer.internalCode String? @db.VarChar(50)
2. Posting: none
3. UX: form field + table column + filter
4. Compliance: indexed if used in WHERE
5. Risk: backfill default for existing rows
6. Diff: ~25 lines (schema + migration + form + filter)
```

**Execution:**
- Edit `prisma/schema.prisma` (add field with index)
- Run `npm run prisma:migrate dev --name add_customer_internal_code`
- Update `/customers` form + table + filter
- Add Zod schema
- Add to RoleFieldPermission seed (read/write per role)

---

## Example 5 — Reverse a Posted Journal

**User:** "ألغي قيد JV-2026-04-1234 لأنه دبل."

**Plan:**
```
1. Cannot delete POSTED journal
2. Create reversal: same lines, dr↔cr swapped
3. Link reversal to original
4. Audit log both
```

**Execution:**
```typescript
const original = await prisma.journalEntry.findUniqueOrThrow({
  where: { id: 'JV-2026-04-1234' },
  include: { lines: true },
});

if (original.status !== 'POSTED') throw new Error('Only POSTED can be reversed');

const reversal = await postJournal(prisma, {
  scenario: 'MANUAL_REVERSAL',
  sourceDocumentId: original.id,
  sourceDocumentType: 'JournalEntry',
  date: new Date(),
  lines: original.lines.map(l => ({
    accountId: l.accountId,
    debit: l.credit,   // swap
    credit: l.debit,   // swap
    costCenterId: l.costCenterId,
    profitCenterId: l.profitCenterId,
    memo: `Reversal of ${original.code}`,
  })),
});

await fieldAuditLog({
  entity: 'JournalEntry',
  entityId: original.id,
  action: 'REVERSED_BY',
  newValue: reversal.id,
});
```

---

## How These Are Used

```typescript
// src/lib/few-shot-examples.ts
export function pickFewShot(task: string): string[] {
  const examples: string[] = [];
  if (/invoice|sale/i.test(task)) examples.push('example-1');
  if (/period close|close month/i.test(task)) examples.push('example-2');
  if (/cross.tenant|other tenant/i.test(task)) examples.push('example-3');
  if (/custom field|add column/i.test(task)) examples.push('example-4');
  if (/reverse|cancel.*journal|undo/i.test(task)) examples.push('example-5');
  return examples;
}
```
