# AI AGENT RULES

## Core Mandate
This project is a highly complex, multi-tenant enterprise ERP with extreme financial and medical data sensitivities. Any AI agent operating within this codebase must adhere strictly to the following rules.

## 1. Safe Modification Rules (The "Scan First" Rule)
- **DEEP SCAN LEVEL 3**: You must NEVER modify a file based on a single grep or search result. You must analyze the Domain, the Database schema, the APIs involved, the downstream impacts (like accounting ledgers), and the tenant contexts before writing a single line of code.
- **Incremental Consistency Audit**: Always treat previously hardened phases (like Treasury Phase A, Sales Returns Atomicity, FX Gains) as **Baseline Stable**. Do not propose "fixes" to them unless a true regression is found in the current HEAD.

## 2. Forbidden Actions
- **DO NOT** use raw `prisma.$transaction` inside API routes.
- **DO NOT** omit `tenantId` from ANY Prisma query (unless operating in the ICE admin boundary).
- **DO NOT** use `Float` types for financial calculations.
- **DO NOT** modify or delete `POSTED` journal entries.
- **DO NOT** leak PII/PHI (patient names, national IDs) into the `OutboxEvent` table. Use sanitizers (e.g., `PharmacyPayloadSanitizer`).

## 3. Required Validations & Safeguards
- **Transaction Requirements**: Any operation touching Inventory and Accounting simultaneously must be wrapped in `runFinancialTx` or `runInventoryTx`.
- **Idempotency**: All `POST` / `PUT` operations involving financial movement or inventory deduction MUST validate against an `x-idempotency-key` header to prevent duplicate processing.
- **Tenant Context**: Use `withTenant` for background jobs and `requireTenantId` for API requests.

## 4. Definition of Done
A task is only complete when:
1. The code modification is minimal and safe.
2. `npx tsc --noEmit` passes with 0 errors.
3. Tests (`npm run test:financial` or equivalent) pass.
4. The AI_PROJECT_MEMORY.md and `/docs/ai-brain/` files are updated to reflect the new state.

## 5. Documentation Obligation
After EVERY successful implementation, you MUST update this `docs/ai-brain` folder. The brain must never drift from reality.
