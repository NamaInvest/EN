# Scan Report (Pre-Implementation) - Nama Invest ERP P1 Remediation

## 1. الملفات التي قرأتها (Files Read)
- `docs/reports/full-project-audit/P1_FIX_PLAN.md`
- `prisma/schema.prisma`
- `src/lib/prisma.ts`
- `src/lib/mfa-engine.ts`
- `src/lib/governance/period-lock.ts`
- `src/app/api/cron/daily-audit/route.ts`
- `src/app/api/cron/zatca-batch-submit/route.ts`
- `src/app/api/cron/vat-return-reminder/route.ts`
- `src/app/api/cron/fx-revaluation/route.ts`
- `src/app/api/stocktake/route.ts`
- `src/app/api/stock/adjustments/route.ts`
- `src/app/api/inventory/stocktake/route.ts`

## 2. الملفات المرشحة للتعديل (Candidate Files to Modify)
- `src/app/api/cron/daily-audit/route.ts`
- `src/app/api/cron/zatca-batch-submit/route.ts`
- `src/app/api/cron/vat-return-reminder/route.ts`
- `src/app/api/cron/fx-revaluation/route.ts`
- `src/app/api/auth/mfa/recovery/route.ts` (NEW)
- `src/app/api/stocktake/route.ts`
- `src/app/api/stock/adjustments/route.ts`
- `src/app/api/inventory/stocktake/route.ts`

## 3. الدومينات المتأثرة (Affected Domains)
- **Multi-Tenancy / Cron Services**: Isolation of background workers.
- **Identity & Security (MFA)**: Recovery protocol for MFA resetting.
- **Financial Compliance (Inventory & Period Lock)**: Restricting post-dated physical inventory actions.

## 4. المخاطر (Risks)
- Tenant routing errors if header resolves to default `n11` instead of parameterized `tenantId`. Resolved by wrapping DB calls explicitly in `withTenant` blocks.
- Security circumvention if only single Officer details are verified. Resolved by state-machine verification in `/api/auth/mfa/recovery` and checking `officer1Id !== officer2Id`.
- Bypassing period write validations with retroactive dates. Resolved by validating actual transaction dates in `assertPeriodWritable`.

## 5. خطة التنفيذ (Implementation Plan)
- Apply `withTenant` wrapper to database logic in relevant cron files.
- Implement the comprehensive new router `/api/auth/mfa/recovery` with GET & POST dual-approver workflows.
- Integrate correct date checks into `assertPeriodWritable` calls for inventory endpoints.

## 6. خطة الاختبار (Test Plan)
- Write target Vitest suites under `tests/unit/p1-fixes/` covering all three components.
- Run typecheck and schema validation locally to confirm stability.
