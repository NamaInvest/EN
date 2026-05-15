# Nama Invest ERP - Full Architecture Scan Report

## 1. Executive Summary
This architectural scan analyzes the entire backend API (`src/app/api`) and core business logic (`src/lib`) to detect transaction boundary violations, direct database mutations, missing tenant isolation, and lack of webhook idempotency.

## 2. Critical Risks
- **Direct $transaction found:** Found 111 raw transaction usage(s). Should use runFinancialTx/runInventoryTx.
- **Mixed Boundaries:** Found 3 files mixing inventory & financial without proper boundaries.
- **Missing Idempotency:** Found 12 webhooks lacking idempotency keys.
- **Possible Tenant Leakage:** Found 387 files with Many queries but no visible tenantId filtering in file context.

## 3. Financial Domain Findings
- **Journal Entries:** 40 direct `journalEntry.create` calls found.
  - src\app\api\accounting\banks\recon\create-je\route.ts:36
  - src\app\api\accounting\payment-runs\[id]\post-journal\route.ts:37
  - src\app\api\finance\auto-ecl\route.ts:44
  - src\app\api\fixed-assets\[id]\depreciate\route.ts:71
  - src\app\api\hr\payroll\generate\route.ts:135
  - src\app\api\hr\payroll\run\route.ts:134
  - src\app\api\manufacturing\shopfloor\route.ts:120
  - src\app\api\pharmacy\insurance\journal\route.ts:45
  - src\lib\allocation-engine.ts:125
  - src\lib\auto-journal.test.ts:46
  - ...and 30 more.
- **Treasury Writes:** 10 direct `treasury.create` calls found.
  - src\app\api\banks\[id]\transactions\route.ts:93
  - src\app\api\bookings\route.ts:56
  - src\app\api\expenses\route.ts:84
  - src\app\api\salaries\route.ts:61
  - src\app\api\webhooks\salla\route.ts:187
  - src\lib\payment-run-engine.ts:244
  - src\lib\services\treasury-posting.service.ts:28
  - src\lib\telegram-bot.ts:189
  - src\lib\telegram-bot.ts:198
  - src\lib\telegram-bot.ts:333
## 4. Inventory Domain Findings
- **Product Stock:** 46 direct `productStock` mutations found.
  - src\app\api\adjustments\route.ts:133
  - src\app\api\adjustments\route.ts:179
  - src\app\api\grn\route.ts:143
  - src\app\api\inventory\clear-all\route.ts:12
  - src\app\api\manufacturing\orders\route.ts:143
  - src\app\api\manufacturing\orders\route.ts:162
  - src\app\api\manufacturing\orders\route.ts:204
  - src\app\api\manufacturing\work-orders\route.ts:158
  - src\app\api\manufacturing\work-orders\route.ts:283
  - src\app\api\pos\route.ts:129
  - ...and 36 more.
- **Stock Movements:** 23 direct `stockMovement.create` calls found.
  - src\app\api\batches\route.ts:62
  - src\app\api\manufacturing\scrap\route.ts:88
  - src\app\api\manufacturing\work-orders\route.ts:165
  - src\app\api\manufacturing\work-orders\route.ts:290
  - src\app\api\pos\route.ts:136
  - src\app\api\products\route.ts:189
  - src\app\api\purchase-returns\route.ts:102
  - src\app\api\purchases\grn\route.ts:128
  - src\app\api\purchases\route.ts:162
  - src\app\api\sales\delivery-notes\route.ts:104
  - ...and 13 more.

## 5. Purchases Domain Findings
- 0 raw transactions found in Purchases.
## 6. Sales/POS Domain Findings
- 0 raw transactions found in Sales/POS.

## 7. Webhooks Findings
- Webhooks without Idempotency keys:
  - src\app\api\crm\whatsapp\webhook\route.ts
  - src\app\api\platform\webhooks\route.ts
  - src\app\api\telegram\webhook\route.ts
  - src\app\api\webhooks\route.ts
  - src\app\api\webhooks\salla\route.ts
  - src\app\api\webhooks\zid\route.ts
  - src\app\api\webhooks\[id]\rotate-secret\route.ts
  - src\app\api\webhooks\[id]\route.ts
  - src\lib\webhook-engine.ts
  - src\lib\webhook-guard.ts
  - src\lib\webhooks\manager.ts
  - src\lib\webhooks.ts

## 8. HR/Payroll/Rent Findings
- 3 raw transactions found in HR/Payroll/Rent.

## 9. Tenant Isolation Findings
- Suspected files with missing `tenantId` constraints during Many operations (387):
  - src\app\api\accounting\accounts\route.ts
  - src\app\api\accounting\balance-sheet\route.ts
  - src\app\api\accounting\bank-statements\route.ts
  - src\app\api\accounting\cost-centers\route.ts
  - src\app\api\accounting\customer-statements\bulk\history\route.ts
  - src\app\api\accounting\customer-statements\bulk\preview\route.ts
  - src\app\api\accounting\customer-statements\bulk\run\route.ts
  - src\app\api\accounting\customer-statements\templates\route.ts
  - src\app\api\accounting\customer-statements\templates\[id]\route.ts
  - src\app\api\accounting\fiscal-periods\route.ts
  - src\app\api\accounting\fiscal-years\route.ts
  - src\app\api\accounting\governance-violations\route.ts
  - src\app\api\accounting\income-statement\route.ts
  - src\app\api\accounting\journal\route.ts
  - src\app\api\accounting\journal\[id]\route.ts
  - ...and 372 more.

## 10. Direct Prisma Usage Map
- Raw `prisma.$transaction` occurrences (111):
  - src\app\api\accounting\closing\route.ts:27
  - src\app\api\accounting\journal\[id]\route.ts:108
  - src\app\api\accounting\journal\[id]\route.ts:182
  - src\app\api\accounting\lc\route.ts:79
  - src\app\api\adjustments\route.ts:170
  - src\app\api\banks\[id]\transactions\route.ts:61
  - src\app\api\batches\[id]\route.ts:64
  - src\app\api\bookings\invoice\route.ts:61
  - src\app\api\categories\route.ts:64
  - src\app\api\cron\debts\route.ts:39
  - src\app\api\cron\hr\route.ts:37
  - src\app\api\documents\transition\route.ts:52
  - src\app\api\expenses\route.ts:71
  - src\app\api\expenses\route.ts:142
  - src\app\api\expenses\route.ts:187
  - ...and 96 more.

## 11. Transaction Boundary Violations
- Mixed Financial/Inventory operations outside Atomic Wrappers:
  - src\lib\subcontracting-engine.ts
  - src\lib\telegram-bot.ts
  - src\lib\__tests__\purchase-atomicity.test.ts

## 12. Suggested Fix Plan
1. **Replace** all `prisma.$transaction` with `runFinancialTx` or `runInventoryTx`.
2. **Extract** direct `journalEntry.create` into `accounting-engine.service.ts`.
3. **Extract** direct `stockMovement.create` into `inventory.service.ts`.
4. **Enforce** `x-idempotency-key` across all `/api/webhooks/*`.

## 13. Priority Matrix
- **P0 Critical:** Replace raw `prisma.$transaction` in active accounting endpoints.
- **P0 Critical:** Add tenant isolation to missing queries.
- **P1 High:** Fix idempotency on Salla/ZATCA webhooks.
- **P2 Medium:** Standardize `runInventoryTx` across manufacturing.
- **P3 Low:** Audit minor reporting queries.

## 14. Files That Need Refactor
- src\app\api\accounting\closing\route.ts
- src\app\api\accounting\journal\[id]\route.ts
- src\app\api\accounting\lc\route.ts
- src\app\api\adjustments\route.ts
- src\app\api\banks\[id]\transactions\route.ts
- src\app\api\batches\[id]\route.ts
- src\app\api\bookings\invoice\route.ts
- src\app\api\categories\route.ts
- src\app\api\cron\debts\route.ts
- src\app\api\cron\hr\route.ts
- src\app\api\documents\transition\route.ts
- src\app\api\expenses\route.ts
- src\app\api\finance\auto-ecl\route.ts
- src\app\api\finance\payment-run\[id]\confirm\route.ts
- src\app\api\finance\period-close\route.ts
- ...and 77 more.

## 15. Safe Execution Phases
Phase 1: Webhook Idempotency Validation
Phase 2: Inventory Wrapper Upgrades (`runInventoryTx`)
Phase 3: Financial Wrapper Upgrades (`runFinancialTx`)
Phase 4: Tenant Isolation Enforcement
