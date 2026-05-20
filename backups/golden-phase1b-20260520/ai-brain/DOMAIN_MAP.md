# DOMAIN MAP

## 1. Accounting & General Ledger
- **Purpose**: The core financial backbone of the system. Ensures double-entry accounting integrity and immutable financial history.
- **Responsibilities**: Journal entry creation, ledger posting, trial balances, account reconciliation.
- **Main Files**: `src/services/accounting/`, `src/services/gl/`.
- **APIs**: `/api/accounting/**`, `/api/gl/**`
- **Database Models**: `AccountingBook`, `AccountMapping`, `JournalEntry`, `Ledger`.
- **Dependencies**: Depends on Inventory, Sales, and HR for automated postings.
- **Rules**: Immutable once posted. Must use `runFinancialTx`.

## 2. Sales & Point of Sale (POS)
- **Purpose**: Handle customer orders, invoicing, and POS terminal sessions.
- **Responsibilities**: B2B Sales Invoicing, Retail POS, Quotations, Subscriptions.
- **Main Files**: `src/services/sales/`, `src/services/ar/`.
- **APIs**: `/api/sales/**`, `/api/pos/**`
- **Database Models**: `SalesInvoice`, `SalesReturn`, `PosSession`, `RetailPOSOrder`.
- **Dependencies**: Accounting (for revenue/AR posting), Inventory (for stock deduction).
- **Rules**: Must emit ZATCA reporting events via Outbox for B2B.

## 3. Purchases & Accounts Payable (AP)
- **Purpose**: Supplier management and expense tracking.
- **Responsibilities**: Purchase orders, receiving, vendor billing.
- **Main Files**: `src/services/purchases/`, `src/services/ap/`.
- **APIs**: `/api/purchases/**`, `/api/ap/**`
- **Database Models**: `PurchaseOrder`, `PurchaseInvoice`, `VendorBid`.
- **Rules**: Idempotency is crucial for supplier payments.

## 4. Inventory & Warehousing (WMS)
- **Purpose**: Track physical stock and valuations across multiple locations.
- **Responsibilities**: Stock counts, movements, ATP (Available-To-Promise) checks, batch tracking.
- **Main Files**: `src/services/inventory/`.
- **APIs**: `/api/inventory/**`
- **Database Models**: `Stock`, `ProductStock`, `InventoryBin`, `WmsWave`.
- **Dependencies**: Accounting for COGS (Cost of Goods Sold).
- **Rules**: Must use `runInventoryTx` for stock mutations.

## 5. Human Resources & Payroll
- **Purpose**: Manage the employee lifecycle and calculate salaries.
- **Responsibilities**: Leave requests, attendance punching, payroll calculation, Mudad/GOSI sync.
- **Main Files**: `src/services/hr/`, `src/services/payroll/`.
- **APIs**: `/api/hr/**`, `/api/payroll/**`
- **Database Models**: `LeaveBalance`, `Payroll`, `AttendancePunch`, `EmployeeCompetency`.
- **Rules**: Extremely sensitive data. Strict tenant isolation. Outbox used for GOSI/Mudad sync.

## 6. Manufacturing & Production
- **Purpose**: Transform raw materials into finished goods.
- **Responsibilities**: BOM management, Work Orders, Shop Floor tracking.
- **Main Files**: `src/services/manufacturing/`.
- **APIs**: `/api/manufacturing/**`
- **Database Models**: `ManufacturingBOM`, `MasterProductionSchedule`, `ScheduledOperation`.
- **Rules**: Must use `runInventoryTx` for material consumption and finished goods receiving.

## 7. Medical & Pharmacy
- **Purpose**: Clinical records and pharmacy dispensing.
- **Responsibilities**: Prescriptions, lab tests, secure drug dispensing.
- **Main Files**: `src/app/api/pharmacy/**`, `src/lib/services/pharmacy.service.ts`.
- **APIs**: `/api/pharmacy/**`, `/api/clinic/**`
- **Database Models**: `ClinicPatientRecord`, `ClinicPrescription`, `Medication`.
- **Security Risks**: HIPAA compliance required. PII/PHI leakage.
- **Rules**: Outbox payloads must be scrubbed of Patient/Doctor names via `PharmacyPayloadSanitizer`.

## 8. ZATCA Compliance
- **Purpose**: Saudi Arabian e-Invoicing integration (Phase 1 & Phase 2).
- **Responsibilities**: XML generation, cryptographic signing, API submission to ZATCA FATOORA portal.
- **Main Files**: `src/lib/zatca/`, `src/services/zatca/`.
- **Database Models**: `ZatcaAssessment`.
- **Rules**: Handled entirely asynchronously via the Outbox Relay worker (`ZATCA_REPORT_JOB`).

## 9. Tenant & System Administration (ICE)
- **Purpose**: Global master administration.
- **Responsibilities**: Tenant provisioning, multi-tenant billing, quotas.
- **Database Models**: `IceAdmin`, `IceTenantSubscription`.
- **Rules**: Only accessible by ICE Admins (Super Admins). No tenant isolation required here.
