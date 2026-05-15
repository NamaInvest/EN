# DOMAIN MAP

## 1. Accounting & Finance
- **Purpose:** Core ledger, AR/AP, Treasury, asset depreciation.
- **APIs:** `/api/accounting/*`, `/api/treasury/*`
- **Rules:** Immutable journals. Use `runFinancialTx`.

## 2. Sales & POS
- **Purpose:** B2B/B2C sales, offline POS, recurring billing.
- **APIs:** `/api/sales/*`, `/api/pos/*`
- **Rules:** Invoices must integrate with ZATCA Phase 2.

## 3. Purchases & Inventory
- **Purpose:** Procure-to-pay, WMS, stocktake, landed costs.
- **APIs:** `/api/purchases/*`, `/api/inventory/*`, `/api/stock/*`
- **Rules:** Use `runInventoryTx`. FIFO valuation.

## 4. HR & Payroll
- **Purpose:** Employee lifecycle, WPS, GOSI, attendance.
- **APIs:** `/api/hr/*`, `/api/salaries/*`
- **Rules:** Salary generation must atomically post to Treasury & GL.

## 5. ZATCA
- **Purpose:** KSA Phase 1 & 2 e-invoicing.
- **Rules:** Cryptographic hash chaining. Do not alter generated XMLs.

## 6. Tenant Management (ICE)
- **Purpose:** SaaS subscription and licensing.
- **APIs:** `/api/master-panel/*`
- **Rules:** Subdomain routing and module limiting.
