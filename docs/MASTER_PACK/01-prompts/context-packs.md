---
version: 1.0
last_updated: 2026-05-12
---

# Context Packs

> حزم سياق محقونة في برومنت AI حسب نوع المهمة. تقلل الـ hallucinations بشكل كبير.

## استراتيجية الـ Context

كل AI agent يستقبل **3 طبقات** من السياق:

```
┌─────────────────────────────────────┐
│ Layer 1: Master System Prompt       │  ← دائماً موجود
│   (rules, stack, compliance)        │
├─────────────────────────────────────┤
│ Layer 2: Domain Context Pack        │  ← حسب الميزة
│   (auto-journal, ZATCA, payroll...) │
├─────────────────────────────────────┤
│ Layer 3: Retrieved Context (RAG)    │  ← مرتجع من vector store
│   (relevant code, docs, schema)     │
└─────────────────────────────────────┘
```

## Context Pack 1 — Auto-Journal

```text
You are working with src/lib/auto-journal.ts.

## SCENARIOS SUPPORTED
- SALES_INVOICE: AR DR / Revenue CR + VAT Output CR; COGS DR / Inventory CR
- SALES_RETURN: reverse of SALES_INVOICE
- PURCHASE_INVOICE: Expense/Inventory DR + VAT Input DR / AP CR
- PAYMENT_RECEIPT: Bank DR / AR CR
- PAYMENT_DISBURSEMENT: AP DR / Bank CR
- WAGE_PAYROLL: Wage Expense DR / Wages Payable CR + GOSI CR + WHT CR
- DEPRECIATION: Depreciation Expense DR / Accum. Depreciation CR
- FX_REVALUATION: Realized/Unrealized FX Gain/Loss DR or CR
- INVENTORY_ADJUSTMENT: Inventory Variance DR/CR / Inventory CR/DR
- WIP_TRANSFER: WIP DR / Raw Materials CR; FG DR / WIP CR

## INVARIANTS
- Returns JournalEntry with status=DRAFT until post()
- Lines sum: |Σdebit - Σcredit| < 0.01
- Cost center mandatory if account.requires_cc=true
- Profit center mandatory for revenue/expense accounts
- VAT line creation automatic if header tax_code is set

## DO NOT
- Bypass postJournal() — even for internal flows
- Hard-code account codes — always resolve via AccountMapping
- Generate JE without source_document_id linkage
- Skip currency revaluation step on FX transactions
```

## Context Pack 2 — ZATCA

```text
You are working with ZATCA Phase 2 e-invoicing.

## OBLIGATIONS
- Every B2B invoice MUST be cleared before delivery
- B2C invoices reported within 24h
- XML signed with X.509 certificate (CSID from ZATCA)
- QR code embedded (TLV format) on PDF

## FLOW
1. SalesInvoice → generate UBL 2.1 XML
2. Compute hash + PIH chain
3. Call ZATCA Clearance API (production or sandbox per Settings.zatca_environment)
4. On 200: save XML + signature + cleared_at
5. On error: queue + alert (do NOT block sale)

## ICV & PIH
- ICV starts at 1 and never resets, never gaps
- PIH for invoice N = sha256(canonical XML of invoice N-1)
- First invoice PIH = "0000...0" (64 zeros)

## FILES TO TOUCH
- src/lib/zatca-fatoora.ts: main orchestrator
- src/lib/zatca-signer.ts: XML signing
- src/lib/zatca-counter-service.ts: ICV/PIH
- src/lib/zatca-vault.ts: cert storage (KMS)
- src/app/api/zatca/route.ts: webhook
```

## Context Pack 3 — Payroll (Saudi)

```text
You are working with Saudi payroll.

## CALCULATIONS PER EMPLOYEE/MONTH
- Gross = Basic + Allowances + Overtime - Unpaid Leave Deduction
- GOSI Employee (Saudi only) = min(BasicSalary, 45000) × 9%
- GOSI Employer (Saudi only) = min(BasicSalary, 45000) × 9% + 2% SANED
- WHT (foreign employees only, specific cases): per service contract type
- Income Tax: 0 in Saudi for individuals (excluded)
- Net = Gross - GOSI Employee - Loans Deduction - Garnishments

## EOS (End of Service)
- < 2 years: 0
- 2-5 years: half month per year
- > 5 years: half × 5 + full × (years - 5)
- Cap: as per latest Saudi Labor Law Article 84-85
- Triggered on termination, resignation (different rules), retirement, death

## WPS (Wage Protection System)
- Generate SIF file (text format) monthly
- Submit to bank (NCB, AlRajhi, SAB, etc.)
- File matches: employee count, total amount, GOSI summary
- Mudad API integration available
```

## Context Pack 4 — Inventory Costing

```text
You are working with inventory costing.

## METHODS SUPPORTED
- WEIGHTED_AVERAGE (default for most tenants)
- FIFO
- LIFO (allowed by SOCPA but discouraged)
- STANDARD_COST (with variance accounts)
- SPECIFIC_IDENTIFICATION (for serialized/lot items)

## ENGINE: src/lib/costing.ts
- recordReceipt(productId, warehouseId, qty, unitCost) → updates layers
- recordIssue(productId, warehouseId, qty) → returns cost based on method
- revalueInventory(productId, warehouseId, newCost) → variance entry

## INVARIANT
- Sum of stock layer quantities × cost = Inventory account balance per GL
- Verified by reconcile-inventory-gl cron nightly
```

## Context Pack 5 — Multi-Tenant Safety

```text
You are writing code that touches tenant data.

## MANDATORY
- Every Prisma query receives tenantId from middleware
- Use prisma-soft-delete + tenant guard pattern:
  ```typescript
  const data = await prisma.salesInvoice.findMany({
    where: { tenantId, deletedAt: null, ...filters },
  });
  ```
- Aggregations: SUM/COUNT must include tenantId
- Cross-tenant queries: forbidden EXCEPT in:
  - Master DB admin tools
  - Tenant-export jobs
  - Platform analytics (anonymized)

## TESTING REQUIREMENT
- Every test creates 2 tenants and asserts isolation
- Negative test: try to fetch other tenant's data → expect not found
```

## كيف تختار Context Pack

```typescript
// src/lib/prompts/context-selector.ts
export function selectContextPacks(task: string): string[] {
  const packs: string[] = ['master-system-prompt'];
  if (/journal|accounting|posting|gl/i.test(task)) packs.push('auto-journal');
  if (/zatca|invoice|clearance/i.test(task)) packs.push('zatca');
  if (/payroll|salary|gosi|wps|eos/i.test(task)) packs.push('payroll');
  if (/inventory|stock|costing|fifo|wac/i.test(task)) packs.push('inventory-costing');
  if (/tenant|multi-tenant|isolation/i.test(task)) packs.push('multi-tenant-safety');
  return packs;
}
```
