# Agent Scan Report — F-06 Three-Way Match & Tolerance Controls

## 1. الملفات التي قرأتها (Files Scanned)
- [src/lib/three-way-match-tolerance-engine.ts](file:///d:/namasoft9-3-main/src/lib/three-way-match-tolerance-engine.ts)
- [src/app/api/purchases/route.ts](file:///d:/namasoft9-3-main/src/app/api/purchases/route.ts)
- [prisma/schema.prisma](file:///d:/namasoft9-3-main/prisma/schema.prisma) (Read-only reference)
- [src/lib/numbering.ts](file:///d:/namasoft9-3-main/src/lib/numbering.ts)
- [src/app/api/finance/controls/route.ts](file:///d:/namasoft9-3-main/src/app/api/finance/controls/route.ts)

## 2. الملفات المرشحة للتعديل (Candidate Files to Modify)
- [MODIFY] [src/lib/three-way-match-tolerance-engine.ts](file:///d:/namasoft9-3-main/src/lib/three-way-match-tolerance-engine.ts) — Extended status mappings (`MATCHED`, `QTY_DISCREPANCY`, `PRICE_DISCREPANCY`, `PENDING_APPROVAL`, `BLOCKED`) and added fallback for new settings keys.
- [MODIFY] [src/app/api/purchases/route.ts](file:///d:/namasoft9-3-main/src/app/api/purchases/route.ts) — Added pre-transaction matching checks to reject variance exceeding tolerance with 422 HTTP, and integrated matching engine inside the posting transaction.
- [NEW] [tests/integration/procurement/three-way-match.test.ts](file:///d:/namasoft9-3-main/tests/integration/procurement/three-way-match.test.ts) — Implemented comprehensive integration tests.

## 3. الدومينات المتأثرة (Affected Domains)
- **Procurement & Accounts Payable (AP)**: Purchase Orders, GRNs, and Purchase Invoices flows.
- **Financial Controls**: Automatic period-lock checks, settings-based purchase tolerances, and transaction isolation.

## 4. المخاطر (Risks)
- Circular dependencies or dynamic import issues in API routes. *Mitigation: Dynamically imported `ThreeWayMatchEngine` inside the handler block.*
- Uncommitted previous files. *Mitigation: Preserved all uncommitted local modifications and isolated our changes purely to local procurement logic.*

## 5. خطة التنفيذ (Implementation Plan)
1. Add settings check fallbacks (`PURCHASE_TOLERANCE_PERCENT`, `PURCHASE_TOLERANCE_AMOUNT`, `PURCHASE_TOLERANCE_REQUIRE_APPROVAL`) and action blocks to `ThreeWayMatchEngine`.
2. Add a pre-transaction check in `purchases/route.ts` _POST.
3. Rewrite transaction persistence block to store exact engine output in `threeWayMatch` table.
4. Add robust mocked integration tests in `tests/integration/procurement/three-way-match.test.ts`.

## 6. خطة الاختبار (Testing Plan)
- Run `npx vitest run tests/integration/procurement/three-way-match.test.ts` (All 6/6 tests passed).
- Run `npx prisma validate` (Successfully validated).
- Run `npm run typecheck` (Completed successfully with 0 errors).
- Run `eslint` check on modified files (Completed successfully with 0 errors).
