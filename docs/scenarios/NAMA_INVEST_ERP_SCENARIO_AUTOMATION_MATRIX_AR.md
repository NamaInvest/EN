# مصفوفة أتمتة السيناريوهات وفحص الفجوات (NAMA_INVEST_ERP_SCENARIO_AUTOMATION_MATRIX_AR)

توضح هذه المصفوفة حالة الأتمتة الحالية لكل سيناريو ومسارات الفحص المعتمدة والفجوات المكتشفة وتوصيات المعالجة.

---

### SCENARIO_ID: SCN-GL-001
MAIN_SECTION: General Ledger
SUB_SECTION: Journal Entries & Period Close
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
TEST_FILE: `tests/finance-isolated-db-smoke.test.ts`
TEST_COMMAND: `npx vitest run tests/finance-isolated-db-smoke.test.ts`
SAFE_TO_RUN_NOW: NO (Requires TEST_DATABASE_URL to be set by admin)
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Requires a real Postgres DB connection to test the actual Prisma insert and General Ledger ledger balancing.
RECOMMENDED_NEXT_ACTION: Request admin to configure TEST_DATABASE_URL and retry the readiness gate.

---

### SCENARIO_ID: SCN-GL-002
MAIN_SECTION: General Ledger
SUB_SECTION: Chart of Accounts (COA)
AUTOMATION_STATUS: NOT_STARTED
TEST_FILE: `tests/integration/accounting/coa.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/accounting/coa.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Missing integration test file for COA tree validation.
RECOMMENDED_NEXT_ACTION: Create `tests/integration/accounting/coa.test.ts` using mocked or isolated test DB.

---

### SCENARIO_ID: SCN-BANK-001
MAIN_SECTION: Cash & Banks
SUB_SECTION: Bank Reconciliation
AUTOMATION_STATUS: NOT_STARTED
TEST_FILE: `tests/integration/accounting/bank-recon.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/accounting/bank-recon.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: YES (Requires CSV statement import mock)
REQUIRES_ADMIN_ENV: YES
GAP: Missing reconciliation integration test file.
RECOMMENDED_NEXT_ACTION: Create reconciliation test.

---

### SCENARIO_ID: SCN-GL-003
MAIN_SECTION: Accounts Receivable
SUB_SECTION: Dunning Engine V2
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
TEST_FILE: `tests/integration/accounting/dunning.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/accounting/dunning.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: YES (Mock email/SMS client)
REQUIRES_ADMIN_ENV: YES
GAP: Blocked on test database availability.
RECOMMENDED_NEXT_ACTION: Implement test DB dunning runner.

---

### SCENARIO_ID: SCN-POS-001
MAIN_SECTION: Point of Sale (POS)
SUB_SECTION: Cashier Checkout & Printing
AUTOMATION_STATUS: PARTIALLY_AUTOMATED
TEST_FILE: `tests/e2e/pos/checkout.test.ts`
TEST_COMMAND: `npx playwright test tests/e2e/pos/checkout.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: YES (Mock Stripe payments and ZATCA APIs)
REQUIRES_ADMIN_ENV: YES
GAP: Playwright tests need local dev server running with Test DB connection.
RECOMMENDED_NEXT_ACTION: Run E2E test suite in Wave POS phase.

---

### SCENARIO_ID: SCN-SAL-002
MAIN_SECTION: Sales Operations
SUB_SECTION: Sales Returns
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
TEST_FILE: `tests/integration/sales/returns.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/sales/returns.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Requires posted sales invoice inside database to process returns.
RECOMMENDED_NEXT_ACTION: Seed test database with a posted sales invoice.

---

### SCENARIO_ID: SCN-POS-002
MAIN_SECTION: Point of Sale (POS)
SUB_SECTION: Restaurant Restaurant POS & Tables
AUTOMATION_STATUS: PARTIALLY_AUTOMATED
TEST_FILE: `tests/e2e/pos/restaurant.test.ts`
TEST_COMMAND: `npx playwright test tests/e2e/pos/restaurant.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: YES (WebSocket mocks)
REQUIRES_ADMIN_ENV: YES
GAP: Requires WebSocket connection and floor mapping database records.
RECOMMENDED_NEXT_ACTION: Seed tables and floor layouts in Test DB.

---

### SCENARIO_ID: SCN-PUR-001
MAIN_SECTION: Procurement
SUB_SECTION: Purchase Orders
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-procurement.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-procurement.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES (DB Client is mocked)
REQUIRES_ADMIN_ENV: NO
GAP: None. The API contract and calculations are fully validated with Mock DB.
RECOMMENDED_NEXT_ACTION: Run with normal Vitest suite.

---

### SCENARIO_ID: SCN-PUR-002
MAIN_SECTION: Supply Chain
SUB_SECTION: Purchase Returns
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
TEST_FILE: `tests/integration/purchases/returns.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/purchases/returns.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Requires posted GRN records in the database.
RECOMMENDED_NEXT_ACTION: Seed database with GRN prior to returns execution.

---

### SCENARIO_ID: SCN-INV-001
MAIN_SECTION: Stock Management
SUB_SECTION: Stock Transfers
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
TEST_FILE: `tests/integration/inventory/transfers.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/inventory/transfers.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Requires warehouses and initial item balances.
RECOMMENDED_NEXT_ACTION: Seed warehouses A & B with stock.

---

### SCENARIO_ID: SCN-INV-002
MAIN_SECTION: Stocktake Operations
SUB_SECTION: Stocktake & Adjustment
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
TEST_FILE: `tests/integration/inventory/adjustments.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/inventory/adjustments.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Requires physical counts and book values comparison checks.
RECOMMENDED_NEXT_ACTION: Create inventory adjustment test file.

---

### SCENARIO_ID: SCN-HR-001
MAIN_SECTION: Human Resources
SUB_SECTION: Employee Directory & Contracts
AUTOMATION_STATUS: NOT_STARTED
TEST_FILE: `tests/integration/hr/employees.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/hr/employees.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Missing test file.
RECOMMENDED_NEXT_ACTION: Create employee contracts test.

---

### SCENARIO_ID: SCN-COMP-001
MAIN_SECTION: Wages Protection System
SUB_SECTION: Mudad Compliance
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-compliance.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-compliance.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES
REQUIRES_ADMIN_ENV: NO
GAP: None. Mudad compliance file formatting checks are fully automated.
RECOMMENDED_NEXT_ACTION: Run with main Vitest suite.

---

### SCENARIO_ID: SCN-ASST-001
MAIN_SECTION: Fixed Assets
SUB_SECTION: Asset Depreciation
AUTOMATION_STATUS: BLOCKED_NEEDS_TEST_DB
TEST_FILE: `tests/integration/fixed-assets/depreciation.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/fixed-assets/depreciation.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Requires capitalized asset profiles.
RECOMMENDED_NEXT_ACTION: Create assets depreciation test file.

---

### SCENARIO_ID: SCN-APP-001
MAIN_SECTION: Approvals
SUB_SECTION: Document Workflow Approvals
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-procurement.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-procurement.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES
REQUIRES_ADMIN_ENV: NO
GAP: None. Workflow approvals endpoint checks are covered in contract tests.
RECOMMENDED_NEXT_ACTION: Run in standard test suite.

---

### SCENARIO_ID: SCN-AI-001
MAIN_SECTION: AI Copilots
SUB_SECTION: AI CFO Financial Auditor
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-ai-cfo.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-ai-cfo.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES (Mock Gemini LLM API)
REQUIRES_ADMIN_ENV: NO
GAP: None. LLM API requests and responses are fully mocked.
RECOMMENDED_NEXT_ACTION: Run in standard test suite.

---

### SCENARIO_ID: SCN-CMMS-001
MAIN_SECTION: Facilities
SUB_SECTION: CMMS Preventive Maintenance
AUTOMATION_STATUS: NOT_STARTED
TEST_FILE: `tests/integration/maintenance/pm.test.ts`
TEST_COMMAND: `npx vitest run tests/integration/maintenance/pm.test.ts`
SAFE_TO_RUN_NOW: NO
REQUIRES_TEST_DB: YES
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: YES
GAP: Missing preventive maintenance integration test.
RECOMMENDED_NEXT_ACTION: Create CMMS test file.

---

### SCENARIO_ID: SCN-SEC-001
MAIN_SECTION: Security & Tenant Isolation
SUB_SECTION: Cross-Tenant Isolation
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-security.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-security.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES
REQUIRES_ADMIN_ENV: NO
GAP: None. Secure tenant-header leakage tests are automated.
RECOMMENDED_NEXT_ACTION: Run in standard test suite.

---

### SCENARIO_ID: SCN-SEC-002
MAIN_SECTION: Security & Tenant Isolation
SUB_SECTION: Server Access Control
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-security.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-security.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES
REQUIRES_ADMIN_ENV: NO
GAP: None. Role-based endpoint rejection (403 Forbidden) is validated.
RECOMMENDED_NEXT_ACTION: Run in standard test suite.

---

### SCENARIO_ID: SCN-PERF-001
MAIN_SECTION: Code Quality & Performance
SUB_SECTION: Sync Blockers Check
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/sync-blockers.test.ts`
TEST_COMMAND: `npx vitest run tests/sync-blockers.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: NO
REQUIRES_ADMIN_ENV: NO
GAP: None. AST code check runs fine without server connections.
RECOMMENDED_NEXT_ACTION: Run in standard test suite.

---

### SCENARIO_ID: SCN-FIN-001
MAIN_SECTION: General Ledger
SUB_SECTION: Journal Entry Calculation
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-accounting-governance.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES
REQUIRES_ADMIN_ENV: NO
GAP: None. Prevention of unbalanced entries is validated.
RECOMMENDED_NEXT_ACTION: Run in standard test suite.

---

### SCENARIO_ID: SCN-FIN-002
MAIN_SECTION: General Ledger
SUB_SECTION: Posted Journal Entry
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-accounting-governance.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES
REQUIRES_ADMIN_ENV: NO
GAP: None. Rejection of Posted Entry modification is validated.
RECOMMENDED_NEXT_ACTION: Run in standard test suite.

---

### SCENARIO_ID: SCN-FIN-003
MAIN_SECTION: General Ledger
SUB_SECTION: Closed Period Verification
AUTOMATION_STATUS: AUTOMATED
TEST_FILE: `tests/api-contract-accounting-governance.test.ts`
TEST_COMMAND: `npx vitest run tests/api-contract-accounting-governance.test.ts`
SAFE_TO_RUN_NOW: YES
REQUIRES_TEST_DB: NO
REQUIRES_MOCK: YES
REQUIRES_ADMIN_ENV: NO
GAP: None. Locked period entry rejection is validated.
RECOMMENDED_NEXT_ACTION: Run in standard test suite.
