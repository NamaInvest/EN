# Global UI Runtime Error Scan Report

## 1. Current Mode
* **STANDBY_MODE**
* **SCAN + PLAN ONLY**
* **Read-only** (No code modifications have been made to any source files)
* **No DB/Prisma Changes** (Database schemas remain completely pristine)
* **No Production Touch** (No PM2 reloads, PM2 restarts, or deployments)
* **No Git Changes** (No git add, commit, or push operations performed)

---

## 2. Scope
The scope of this scan was a proactive, comprehensive audit of Next.js 16 and Prisma ORM architectures across all interfaces to detect critical runtime, hydration, server/client boundary, and database mismatches. Specifically, the audit focused on:
1. Identifying **Client-side Hook boundary violations** (`useTranslation()`) mistakenly invoked inside Server Components.
2. Checking **Dynamic dynamic route unwrapping** under Next.js 15/16 (`params` and `searchParams` Promise handling) across Client Components.
3. Investigating **Background worker database schema crashes**—specifically the `SystemReconciliationWorker` database column crash (`deleted_at` column absent on trial/free tenants).
4. Local baseline compilation verification via strict compilers (`tsc` and Next.js Turbopack).

---

## 3. Commands Executed
We executed the following diagnostic utilities and validation suites locally:

1. **Custom `useTranslation` AST Scanner**:
   * Command: `node scratch/find_use_translation_server_components.js`
   * Result: Identifed **7 files** violating the client/server boundary by importing and executing client hooks within Server Components.
2. **Custom Dynamic Route Params Promise Scanner**:
   * Command: `node scratch/find_dynamic_params_issues.js`
   * Result: Checked all 17 dynamic layout/page routes. Zero active dynamic params promise bugs exist (all client dynamic components utilize async `useEffect` unwrapping via `.then()`).
3. **TypeScript Typecheck**:
   * Command: `npm run typecheck`
   * Result: **PASS** (Zero compile-time static type errors across the entire project).
4. **Prisma Schema Validation**:
   * Command: `npx prisma validate`
   * Result: **PASS** (Unified Prisma schema is fully valid and compliant).
5. **Next.js Production Build**:
   * Command: `npm run build`
   * Result: **PASS** (Compiled all 787 static/dynamic pages perfectly under Next.js Turbopack Optimizer with zero compilation errors).

---

## 4. Files Reviewed
We conducted a granular code review of the following critical files:
* **Quality Inspections**: [src/app/(dashboard)/quality/inspections/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/quality/inspections/page.tsx)
* **Purchase Orders**: [src/app/(dashboard)/purchases/orders/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/purchases/orders/page.tsx)
* **AI Cost Dashboard**: [src/app/(dashboard)/admin/prompts/cost/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/prompts/cost/page.tsx)
* **Compliance Posture**: [src/app/(dashboard)/admin/compliance-dashboard/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/compliance-dashboard/page.tsx)
* **Migration Cockpit**: [src/app/(dashboard)/admin/migration/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/migration/page.tsx)
* **Training compliance**: [src/app/(dashboard)/admin/training-compliance/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/training-compliance/page.tsx)
* **Learning Hub**: [src/app/(dashboard)/learn/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/learn/page.tsx)
* **Reconciliation Worker**: [src/workers/audit/reconciliation.worker.ts](file:///d:/namasoft9-3-main/src/workers/audit/reconciliation.worker.ts)
* **System Audit Library**: [src/lib/system-audit.ts](file:///d:/namasoft9-3-main/src/lib/system-audit.ts)
* **OLAP Cube Engine**: [src/lib/gaps/olap-cube-engine.ts](file:///d:/namasoft9-3-main/src/lib/gaps/olap-cube-engine.ts)
* **Database Schema**: [prisma/schema.prisma](file:///d:/namasoft9-3-main/prisma/schema.prisma)

---

## 5. Confirmed Findings

### 🔴 CRITICAL SEVERITY
#### 1. Inspections Page Client Hook Violation
* **File**: [src/app/(dashboard)/quality/inspections/page.tsx:L11-15](file:///d:/namasoft9-3-main/src/app/(dashboard)/quality/inspections/page.tsx#L11-15)
* **Error**: Client hook `useTranslation()` is executed inside an `async` Server Component.
* **Impact**: **FATAL CLIENT-SIDE EXCEPTION / SERVER-RENDER CRASH**. When accessed, this page triggers a full Next.js Edge runtime exception and fails to render.
* **Logs vs Scan**: Logged in `saas-app-error.log` (digest error), confirmed by scans.
* **Later Fix**: Yes, must be refactored to use `getServerLang()` from `@/lib/server-t`.

#### 2. AI Cost Page Client Hook Violation
* **File**: [src/app/(dashboard)/admin/prompts/cost/page.tsx:L6-15](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/prompts/cost/page.tsx#L6-15)
* **Error**: Client hook `useTranslation()` is executed inside an `async` Server Component.
* **Impact**: **FATAL CLIENT-SIDE EXCEPTION / SERVER-RENDER CRASH**. Accessing the AI Cost aggregation dashboard causes a full render failure.
* **Logs vs Scan**: Discovered proactively via AST Scanner.
* **Later Fix**: Yes, must be refactored to use `getServerLang()` from `@/lib/server-t`.

#### 3. Purchase Orders Page Client Hook Violation
* **File**: [src/app/(dashboard)/purchases/orders/page.tsx:L11-15](file:///d:/namasoft9-3-main/src/app/(dashboard)/purchases/orders/page.tsx#L11-15)
* **Error**: Client hook `useTranslation()` is executed inside an `async` Server Component.
* **Impact**: **FATAL CLIENT-SIDE EXCEPTION / SERVER-RENDER CRASH**. Accessing `/purchases/orders` fails immediately.
* **Logs vs Scan**: Discovered proactively via AST Scanner.
* **Later Fix**: Yes, must be refactored to use `getServerLang()` from `@/lib/server-t`.

---

### 🟡 HIGH SEVERITY
#### 4. Compliance Dashboard Hook Violation
* **File**: [src/app/(dashboard)/admin/compliance-dashboard/page.tsx:L3-6](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/compliance-dashboard/page.tsx#L3-6)
* **Error**: Synchronous Server Component invokes client hook `useTranslation()`.
* **Impact**: **FATAL CLIENT-SIDE EXCEPTION**. Accessing the page crashes with a React hook boundary error.
* **Later Fix**: Yes, must change component to `async` and use `getServerLang()`.

#### 5. Migration Cockpit Hook Violation
* **File**: [src/app/(dashboard)/admin/migration/page.tsx:L2-5](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/migration/page.tsx#L2-5)
* **Error**: Synchronous Server Component invokes client hook `useTranslation()`.
* **Impact**: **FATAL CLIENT-SIDE EXCEPTION**. Accessing the cockpit causes a render crash.
* **Later Fix**: Yes, must change component to `async` and use `getServerLang()`.

#### 6. Training Compliance Hook Violation
* **File**: [src/app/(dashboard)/admin/training-compliance/page.tsx:L3-6](file:///d:/namasoft9-3-main/src/app/(dashboard)/admin/training-compliance/page.tsx#L3-6)
* **Error**: Synchronous Server Component invokes client hook `useTranslation()`.
* **Impact**: **FATAL CLIENT-SIDE EXCEPTION**. Accessing the compliance page causes a render crash.
* **Later Fix**: Yes, must change component to `async` and use `getServerLang()`.

#### 7. Learning Hub Hook Violation
* **File**: [src/app/(dashboard)/learn/page.tsx:L2-5](file:///d:/namasoft9-3-main/src/app/(dashboard)/learn/page.tsx#L2-5)
* **Error**: Synchronous Server Component invokes client hook `useTranslation()`.
* **Impact**: **FATAL CLIENT-SIDE EXCEPTION**. Accessing `/learn` causes a render crash.
* **Later Fix**: Yes, must change component to `async` and use `getServerLang()`.

---

### 🟠 MEDIUM SEVERITY
#### 8. Reconciliation Worker Mapped Column DB Crash
* **File**: [src/workers/audit/reconciliation.worker.ts:L31-61](file:///d:/namasoft9-3-main/src/workers/audit/reconciliation.worker.ts#L31-61)
* **Error**: The background worker queries `salesInvoice` via Prisma ORM for all active tenants. Prisma attempts to select the `deletedAt` field, which is mapped to the `deleted_at` database column. Trial/experimental tenants (which run on separate, old databases) have not run recent migrations, so the database column `deleted_at` does not exist in their schemas.
* **Impact**: **BACKGROUND WORKER CRASH**. When processing trial tenant accounts, the database query fails and crashes the worker thread with the error `The column sales_invoices.deleted_at does not exist in the current database.`
* **Logs vs Scan**: Logged in `saas-app-error.log`, audited and confirmed via prisma maps.
* **Later Fix**: Yes, must filter out trial tenants and wrap the execution in a robust try-catch block.

---

## 6. Root Cause Analysis
1. **i18n Hook Boundary Mismatch**: The project utilizes standard next-intl-like client wrappers (`useTranslation` from `lib/i18n`). In Server Components, there is no React Context provider available. Calling `useTranslation()` inside components lacking `'use client'` invokes client-side hook logic inside a server execution thread, raising React Hook exceptions.
2. **Reconciliation Worker database Sync Lag**: During development, new fields like `deletedAt` were mapped to database columns (`@map("deleted_at")`) inside the unified Prisma schema. The matching database migrations were applied to the main system databases, but SaaS trial tenants run in dynamic, separate, lightweight databases which remain un-migrated. The worker attempts to aggregate sales data for all active tenants indiscriminately, triggering PostgreSQL column mismatch failures on these trial schemas.

---

## 7. Proposed Safe Fix Plan

### Part A: Standardizing Translations inside Server Components
We will replace all 7 client hook violations with standard async server-side translations.

1. **Refactor Async Server Components** (Inspections, Purchases Orders, AI Cost):
   ```typescript
   // FROM
   import { useTranslation } from "@/lib/i18n";
   const { lang } = useTranslation();
   const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

   // TO
   import { getServerLang } from "@/lib/server-t";
   const lang = await getServerLang();
   const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
   ```
2. **Refactor Synchronous Server Components** (Compliance, Migration, Training, Learning):
   * Add the `async` keyword to their default function declarations.
   * Fetch `getServerLang()` asynchronously and render standard bilingual options.

### Part B: hardening SystemReconciliationWorker
1. **Exclude Trial Tenants**: Update the tenant query filter to select active, paid non-trial subdomains only:
   ```typescript
   // Exclude plan: 'free' and subscriptionStatus: 'trial'
   const activeTenants = tenants
       .filter((t: any) => t.status === 'active' && t.plan !== 'free' && t.subscriptionStatus !== 'trial')
       .map((t: any) => t.subdomain);
   ```
2. **Database Schema Safeguards**: Wrap the system reconciliation execution block inside a resilient local `try-catch` statement to log database errors gracefully without halting the worker's processing of other paying clients.

---

## 8. Test Plan
* **Automated Tests**:
  * Run local compiler checks: `npm run typecheck`
  * Run schema validator: `npx prisma validate`
  * Run comprehensive Next.js build: `npm run build`
* **Manual Verification**:
  * Navigate to `/quality/inspections` and verify that the page renders correctly in Arabic and English without throwing Edge exceptions.
  * Access `/admin/prompts/cost` and `/purchases/orders` to ensure zero crash screens.
  * Inspect PM2 worker logs via `pm2 logs saas-app` to confirm `SystemReconciliationWorker` completes successfully with no database column crashes.

---

## 9. Risk Assessment
* **UI Crash Risk**: **HIGH** (The 7 files identified will continue to cause crash exceptions for users until fixed).
* **Production Deployment Risk**: **VERY LOW** (Refactoring translation hooks to server functions and adding tenant filters are standard, non-destructive Next.js/Prisma operations).
* **DB/Prisma Schema Risk**: **ZERO** (No schema updates, database resets, or table modifications required).
* **Tenant Isolation Risk**: **ZERO** (Excluding trial tenants in worker queries has zero impact on operational multi-tenant security boundaries).
* **Financial Risk**: **ZERO** (No ledger entries, invoices, payments, or transaction validation calculations are changed).

---

## 10. Execution Approval Gate
> [!IMPORTANT]
> **CRITICAL RULE**: In compliance with `AGENTS.md`, we are currently in `STANDBY_MODE` / `SCAN + PLAN ONLY`. No source files, databases, or environment configurations have been modified.
>
> **No changes will be executed until the project owner reviews this plan and provides explicit approval to proceed.**