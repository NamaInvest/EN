# Enterprise Scan + Plan Report

## 1. Current Mode
- STANDBY_MODE
- SCAN + PLAN ONLY
- No Code Changes
- No DB/Prisma Changes
- No Production Touch
- No Git Commit/Push

---

## 2. Target Scope
- **Domain**: Sales Returns API
- **Primary File**: `src/app/api/sales-returns/route.ts`
- **Objective**: Modernize the Sales Returns (Credit Note) API, securing it against cross-tenant data leakage and injecting period-lock safeguards to enforce SOCPA monthly and annual closing compliance.

---

## 3. Files Reviewed
* `src/app/api/sales-returns/route.ts` (Active document / Primary target of security scan)
* `src/app/api/sales/route.ts` (Stabilized sales route used as security and period-lock reference)
* `src/app/api/purchases/route.ts` (Stabilized purchases route reference)
* `src/lib/governance/tenant-guard.ts` (Tenant context verification helper reference)
* `src/lib/governance/period-lock.ts` (Fiscal closing and locking validation reference)
* `src/lib/validations.ts` (Standard Zod validation schemas reference)
* `src/lib/tax-validation.ts` (Standard tax rate validation reference)
* `AI_PROJECT_MEMORY.md` (Project core modernization record and memory log)
* `docs/ai-brain/operational_roadmap_20_gaps.md` (ERP Gap Analysis and strategic priority matrix)

---

## 4. Current Implementation Summary
The Sales Returns API route `src/app/api/sales-returns/route.ts` handles:
- **GET**: Lists sales returns, supporting pagination and date range filters (`from`/`to`). It performs a direct `prisma.salesReturn.findMany` and `count` without checking or applying any `tenantId` isolation constraint.
- **POST**: Initializes a sales return (Credit Note). It checks ZATCA tax rate validity, verifies the existence of the original sales invoice, calculates totals, and executes a database transaction (`runFinancialTx`) to:
  1. Create a `SalesReturn` document record.
  2. Restore product inventory (`Product` and `ProductStock` current stock increments).
  3. Create an incoming `StockMovement` history record.
  4. Post a treasury outgoing cash entry via `TreasuryPostingService.createTreasuryEntry` (for cash returns).
  5. Post an automatic reversed double-entry accounting journal via `postSalesReturn` engine.

---

## 5. Confirmed Findings

### CRITICAL

#### 1. Unsecured Tenant Resolution via Client-Controlled Header
- **File**: `src/app/api/sales-returns/route.ts`
- **Line / Snippet**: Line 231-232:
  ```typescript
  const tenantId = req.headers.get('x-tenant-id') || 'public';
  return withIdempotency(req as NextRequest, 'POST /api/sales-returns', async () => _POST(req as any, auth, tenantId as string));
  ```
- **Description**: The API route manually extracts the `x-tenant-id` header to obtain the tenant context and bypasses the secure `tenant` parameter resolved by the `withRoute` wrapper.
- **Reason**: Headers are completely client-controlled. A standard API should never trust client headers for security boundaries.
- **Security Impact**: Critical. Allows arbitrary tenant impersonation.
- **Financial Impact**: Extreme. Enables unauthorized credit note creations, reverse cash transactions, and tax modifications on other tenants.
- **Tenant Isolation Impact**: Complete failure of isolation boundaries.
- **ZATCA Impact**: High (invalid cryptographic invoices created on wrong tenants).
- **Accounting Impact**: Severe ledger cross-contamination.
- **Inventory Impact**: Severe (arbitrary inventory stock additions on other companies).
- **Status**: **CONFIRMED** (100% verified in code).

#### 2. Cross-Tenant Database Modifications (Unfiltered Mutations)
- **File**: `src/app/api/sales-returns/route.ts`
- **Line / Snippet**:
  - Line 109-111: `prisma.salesInvoice.findUnique({ where: { id: body.originalInvoiceId } })`
  - Line 154-157: `tx.product.update({ where: { id: item.productId }, data: { currentStock: { increment: item.quantity } } })`
  - Line 161-165: `(tx as any).productStock.upsert({ ... })`
  - Line 167-179: `tx.stockMovement.create({ data: { ... } })` (without a `tenantId` field provided)
- **Description**: The database reads and writes find and update records blindly by ID without filtering on `tenantId`.
- **Reason**: The queries only match the primary key `id` without checking ownership by the authenticated tenant.
- **Security Impact**: Critical data tampering.
- **Financial Impact**: High. Disrups accounting ledgers and balance sheets across companies.
- **Tenant Isolation Impact**: Complete failure of database-level boundaries.
- **ZATCA Impact**: High (returns can be posted against invoices from different companies).
- **Accounting Impact**: Generates reverse ledgers on wrong entities.
- **Inventory Impact**: Alters physical stock levels of wrong warehouses.
- **Status**: **CONFIRMED** (100% verified in code).

#### 3. Complete Absence of Period Lock Safeguards
- **File**: `src/app/api/sales-returns/route.ts`
- **Line / Snippet**: Whole `_POST` request.
- **Description**: The Sales Returns API does not import `assertPeriodWritable` nor call it before committing transactions.
- **Reason**: Legacy code remained unintegrated during the initial transaction locking phases.
- **Security Impact**: Low.
- **Financial Impact**: High. Allows backdated sales returns and reversed cash posting into closed and reported fiscal months or years, creating massive compliance issues under SOCPA.
- **Tenant Isolation Impact**: None directly, but bypasses tenant locked periods.
- **ZATCA Impact**: Extreme (backdated credit notes generated in locked tax periods).
- **Accounting Impact**: Reverses general ledger balances on finalized periods.
- **Inventory Impact**: Changes historic stock values in closed months.
- **Status**: **CONFIRMED** (100% verified in code).

---

### HIGH

#### 4. Complete Tenant Leakage on GET Listing Route
- **File**: `src/app/api/sales-returns/route.ts`
- **Line / Snippet**: Line 59-71 inside `_GET`:
  ```typescript
  const [returns, total] = await Promise.all([
    prisma.salesReturn.findMany({ where, ... }),
    prisma.salesReturn.count({ where })
  ]);
  ```
- **Description**: The listing query does not append `tenantId` to the where clause.
- **Reason**: Lack of isolation filter on `_GET` method.
- **Security Impact**: High (unauthorized data disclosure).
- **Financial Impact**: Low.
- **Tenant Isolation Impact**: Severe read leakage.
- **ZATCA Impact**: None.
- **Accounting Impact**: Low.
- **Inventory Impact**: Low.
- **Status**: **CONFIRMED** (100% verified in code).

---

### MEDIUM / LOW

#### 5. Weak Sequence / Numbering Guard
- **File**: `src/app/api/sales-returns/route.ts`
- **Line / Snippet**: Line 122-123:
  ```typescript
  const lastReturn = await prisma.salesReturn.findFirst({ orderBy: { id: 'desc' } }).catch(() => null);
  const returnNo = (lastReturn?.returnNo || 0) + 1;
  ```
- **Description**: Generates return sequential numbers globally instead of per-tenant.
- **Reason**: Sequential query missing the `tenantId` filter.
- **Security Impact**: Low.
- **Financial Impact**: Medium (compliance numbering gaps).
- **Tenant Isolation Impact**: Medium.
- **ZATCA Impact**: Medium.
- **Accounting Impact**: Low.
- **Inventory Impact**: Low.
- **Status**: **CONFIRMED** (100% verified in code).

---

## 6. Root Cause Analysis
The root cause is a legacy design pattern within the `sales-returns` route. When it was written, it relied on global client-controlled headers (`x-tenant-id`) rather than the centralized security context provided by `withRoute` and standard governance guards. The lack of standard period-locking integrations occurred because the route was left un-modernized during the initial Period Lock Enforcement phase, making it a critical architectural gap.

---

## 7. Proposed Safe Fix Plan

The proposed plan is strictly **Code-Only**, requiring **zero database changes**, **zero schema modifications**, and **zero alterations** to core accounting equations or ZATCA signing mechanics.

### Step 1: Secure Route Wrapper & Tenant Extraction
- Modify `POST` and `GET` exports in `sales-returns/route.ts` to destructure and consume the secure, authenticated `tenant` parameter resolved by `withRoute`:
  ```typescript
  export const POST = withRoute(async ({ req, auth, tenant }) => {
    const { withIdempotency } = await import('@/lib/idempotency');
    return withIdempotency(req as NextRequest, 'POST /api/sales-returns', async () => _POST(req as any, auth, tenant));
  }, { rateLimit: 'FINANCIAL', module: 'sales', permission: 'add' });
  ```

### Step 2: Enforce Strict Period Lock Guards
- Import `assertPeriodWritable` and `PeriodLockViolation` from `@/lib/governance/period-lock`.
- Inside `_POST`, compute document date (`today`) and invoke the transaction safeguard:
  ```typescript
  const today = body.date || new Date().toISOString().split('T')[0];
  const returnDate = new Date(today);

  // Period Lock Enforcement
  try {
      await assertPeriodWritable({
          tenantId,
          postingDate: returnDate,
          operationType: 'CREATE_SALES_RETURN',
          module: 'sales',
          actor: String(auth?.userId || 'SYSTEM'),
          overrideContext
      });
  } catch (err) {
      if (err instanceof PeriodLockViolation) {
          return NextResponse.json({ error: err.message, code: err.code }, { status: err.code === 'LOCKED' ? 409 : 422 });
      }
      throw err;
  }
  ```

### Step 3: Implement Database Multi-Tenant Filters
- **GET Route**: Inject `tenantId` into the `where` filter object:
  ```typescript
  const where: any = { tenantId };
  ```
- **Invoice Lookup**: Verify original invoice belongs exclusively to the active tenant:
  ```typescript
  const originalInvoice = await prisma.salesInvoice.findFirst({
      where: { id: body.originalInvoiceId, tenantId }
  });
  ```
- **Sequential Numbering**: Calculate `returnNo` filtered strictly by tenant:
  ```typescript
  const lastReturn = await prisma.salesReturn.findFirst({
      where: { tenantId },
      orderBy: { id: 'desc' }
  });
  ```
- **Inventory & Stock Updates**: Inject `tenantId` into `Product` checks, `ProductStock` upserts, and `StockMovement` creation:
  ```typescript
  // Verify product belongs to tenant before incrementing stock
  const productExists = await tx.product.findFirst({
      where: { id: item.productId, tenantId }
  });
  if (!productExists) throw new Error('Product not found inside tenant boundary');

  // Upsert ProductStock inside tenant
  await tx.productStock.upsert({
      where: { productId_stockId: { productId: item.productId, stockId: stockTarget } },
      create: { tenantId, productId: item.productId, stockId: stockTarget, quantity: item.quantity },
      update: { quantity: { increment: item.quantity } }
  });

  // Create StockMovement with tenantId
  await tx.stockMovement.create({
      data: {
          tenantId,
          productId: item.productId,
          stockId: stockTarget,
          type: 'in',
          quantity: item.quantity,
          referenceType: 'sales_return',
          referenceId: ret.id,
          userId: auth?.userId || null,
          notes: `مرتجع مبيعات #${returnNo}`
      }
  });
  ```

---

## 8. Files Proposed To Change Later
- `src/app/api/sales-returns/route.ts` (Core modernization implementation)
- `src/__tests__/sales-returns-governance.test.ts` (New integration test suite)

---

## 9. Test Plan
We will write Jest integration tests under `src/__tests__/sales-returns-governance.test.ts` to verify the following behaviors:
- **Tenant Isolation Tests**: Attempt to list or query sales returns of another tenant (Should be completely hidden/rejected).
- **Cross-tenant Rejection Tests**: Post a sales return referencing Tenant B's invoice, products, or stock from Tenant A context (Should throw HTTP 404 or boundary error and rollback database transaction).
- **Period Lock Tests**: Post returns in `HARD_LOCKED` periods (HTTP 409) and `SOFT_LOCKED` periods without override (HTTP 422), and successfully post in `OPEN` periods.
- **Lint & Build Verifications**:
  - Run `npm run typecheck`
  - Run `npx prisma validate`
  - Run the Jest suite

---

## 10. Risk Assessment

| Risk Vector | Before Fix | After Fix (Expected) |
| :--- | :--- | :--- |
| **Security Risk** | **EXTREME** (Active write/read leaks) | **NEGLIGIBLE** (Token-locked parameters) |
| **Financial Risk** | **HIGH** (Post to closed periods) | **NEGLIGIBLE** (Centralized closing guard) |
| **Tenant Isolation Risk** | **EXTREME** (Cross-company data mix) | **NEGLIGIBLE** (Strict query filtering) |
| **Production Risk** | **LOW** (Unprotected execution) | **LOW** (Code-only, zero schema delta) |
| **DB Risk** | **LOW** (Unrestricted query space) | **NEGLIGIBLE** (Zero schema mutations) |
| **ZATCA/Compliance Risk** | **HIGH** (Backdated tax records) | **NEGLIGIBLE** (Fiscal locking verified) |

---

## 11. Execution Approval Gate
> [!IMPORTANT]
> **CRITICAL RULE**: No source code modifications, database schema edits, or git staging/commit operations will be initiated under F-04C until explicit owner approval is granted for this scan report and execution plan.

---