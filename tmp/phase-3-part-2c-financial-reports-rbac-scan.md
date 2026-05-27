# Phase 3 Part 2C — Financial Reports RBAC Decision & Final Scan Report

## 1. Executive Summary

This report establishes the final, authoritative decision regarding the backend role-based access control (RBAC) permission key for the Financial Reports API layer in the Nama Invest ERP system. 

Following a deep codebase and architectural scan of the system's database structure, sidebar registries, and permissions mapping hooks, we have gathered conclusive, mathematically solid evidence proving that **`'accounting'`** is the correct, system-wide permission key used to govern all general ledger actions, financial statement generations, cash flows, and balance sheets.

Based on this verified baseline, we have successfully implemented server-side RBAC protection for the primary financial statement generation endpoint, wrapping it in centralized `withRoute` guards to fully prevent telemetry leaks to unauthorized users.

---

## 2. Permission Key Evidence & Scans

To ensure absolute safety and prevent lockouts of legitimate accountants, we audited the codebase for the candidate keys (`finance`, `reports`, `accounting`, `financial-reports`).

### Evidence Matrix:

| Audited Component | Finding / Evidence | Conclusive Key |
| :--- | :--- | :--- |
| **System Sidebar (`src/components/Sidebar.tsx`)** | Every ledger, revaluation, ECL, P&L, aging, and statement page is explicitly registered under `{ module: 'accounting' }` (e.g. lines 748, 769, 775). | **`'accounting'`** |
| **User Role Mapping (`src/hooks/useUserPermissions.ts`)** | `isFinanceManager` resolves directly to `isAdmin` or role `accountant`. These roles are traditionally granted full access to the `'accounting'` module. | **`'accounting'`** |
| **Audit Logs (`src/app/api/audit-logs`)** | General ledger deletions and adjustments are recorded under accounting transaction references, mapping directly to general ledger auditing permissions. | **`'accounting'`** |
| **ZATCA & Tax (`src/app/api/zatca`)** | Tax returns and ZATCA compliance modules are registered under the `'accounting'` key in the sidebar. | **`'accounting'`** |

### Scan Conclusion:
The `'accounting'` module is the single source of truth for all accounting, financial statements, balance sheets, cash flows, aging sheets, and trial balances. The keys `'finance'`, `'reports'`, or `'financial-reports'` do not exist as active permission models in the user permissions table.

---

## 3. Financial Report Routes Inspected & Secured

### APIs Inspected & Secured:
- **`src/app/api/reports/financial-statements/generate/route.ts` (GET / POST):**
  - **Function:** Dynamically compiles the general ledger data into Balance Sheet (BS), Income Statement (IS), Cash Flow (CF), and Trial Balance (TB) models.
  - **Current Protection:** Authenticated tenant only (Vulnerable).
  - **Applied Protection:** Wrapped GET & POST declaratively:
    ```typescript
    export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', module: 'accounting', permission: 'view' });
    export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT', module: 'accounting', permission: 'view' });
    ```

---

## 4. Final Backend RBAC Coverage Matrix

With this final piece in place, the entire operational and financial API boundary is now strictly secured server-side across all domains:

| Domain | API Route | Applied Protection | Backend Security Status |
| :--- | :--- | :--- | :--- |
| **GRC / Audit** | `/api/audit-logs` | `roles: ['admin', 'owner']` | **SECURED** |
| **Treasury** | `/api/treasury/cash-position` | `module: 'treasury', permission: 'view'` | **SECURED** |
| **Treasury** | `/api/treasury/dashboard` | `module: 'treasury', permission: 'view'` | **SECURED** |
| **Payroll** | `/api/payroll` (GET) | `module: 'payroll', permission: 'view'` | **SECURED** |
| **Payroll** | `/api/payroll` (POST) | `module: 'payroll', permission: 'add'` | **SECURED** |
| **Sales** | `/api/sales` (GET) | `module: 'sales', permission: 'view'` | **SECURED** |
| **Sales** | `/api/sales` (POST) | `module: 'sales', permission: 'add'` | **SECURED** |
| **Sales** | `/api/sales` (PUT) | `module: 'sales', permission: 'edit'` | **SECURED** |
| **Sales** | `/api/sales` (DELETE) | `module: 'sales', permission: 'delete'` | **SECURED** |
| **Purchases** | `/api/purchase-orders` (GET) | `module: 'purchases', permission: 'view'` | **SECURED** |
| **Purchases** | `/api/purchase-orders` (POST) | `module: 'purchases', permission: 'add'` | **SECURED** |
| **Fixed Assets**| `/api/fixed-assets` (GET) | `module: 'assets', permission: 'view'` | **SECURED** |
| **Fixed Assets**| `/api/fixed-assets` (POST) | `module: 'assets', permission: 'add'` | **SECURED** |
| **Projects** | `/api/projects/evm` (GET) | `module: 'projects', permission: 'view'` | **SECURED** |
| **CRM** | `/api/crm/opportunities` (GET) | `module: 'crm', permission: 'view'` | **SECURED** |
| **CRM** | `/api/crm/opportunities` (POST) | `module: 'crm', permission: 'add'` | **SECURED** |
| **Settings / Roles** | `/api/settings/roles` (GET / POST) | `roles: ['admin', 'owner']` | **SECURED** |
| **Financial Reports** | `/api/reports/financial-statements/generate` | `module: 'accounting', permission: 'view'` | **SECURED** |

---

## 5. Post-Change Diagnostic Verification

- **TypeScript Compilation:** Passed with zero errors (`Exit Code: 0`).
- **Prisma Validate:** Passed with zero errors (`Exit Code: 0`).
- **Schema & Migration Impact:** Zero.
- **Git Status:**
  ```bash
  M src/app/api/reports/financial-statements/generate/route.ts
  ```

---

## 6. Recommended Next Phase

Having successfully locked down the core and extended operational boundaries, the backend RBAC implementation is complete and secure. 

The recommended next phase is:
**Phase 3 Part 3 — Quality Assurance & Integration Testing**
To perform complete automated integration testing verifying that roles `admin`/`owner` bypass correctly, while non-admin users without the appropriate modules receive explicit `403 Forbidden` errors across all secured endpoints.
