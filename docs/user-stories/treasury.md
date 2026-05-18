# User Stories: TREASURY

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-TREASURY-001: Create Treasury

**As a** Tenant Admin/Controller
**I want to** create a new Treasury record
**So that** I can record and track new Treasury entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/liquidity/forecast/generate`
**Then** the Treasury is created successfully and linked to my tenantId
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/liquidity/forecast/generate`
- **Prisma Models:** `Treasury`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-002: View BankAccount

**As a** Tenant Admin/Controller
**I want to** view the list of BankAccounts
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/cash-position/snapshot`
**Then** only the BankAccounts belonging to my tenantId are returned, applying RBAC permissions
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/cash-position/snapshot`
- **Prisma Models:** `BankAccount`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-003: Approve BankTransaction

**As a** Tenant Admin/Controller
**I want to** approve an existing BankTransaction document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/recon-exceptions`
**Then** the BankTransaction status changes to APPROVED and an immutable Audit Log is generated
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/recon-exceptions`
- **Prisma Models:** `BankTransaction`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-004: Post BankReconciliation

**As a** Tenant Admin/Controller
**I want to** post the BankReconciliation to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/balance`
**Then** a JournalEntry is created atomically, the period lock is verified, and the document is locked
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/balance`
- **Prisma Models:** `BankReconciliation`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-005: Revert PettyCashTransaction

**As a** Tenant Admin/Controller
**I want to** revert or cancel the PettyCashTransaction
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/cash-position/snapshot`
**Then** the PettyCashTransaction generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/cash-position/snapshot`
- **Prisma Models:** `PettyCashTransaction`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-006: Edge PettyCashFund

**As a** Tenant Admin/Controller
**I want to** attempt to post a PettyCashFund into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury`
**Then** the transaction is aborted, a 403 Forbidden is returned, and an alert is logged
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury`
- **Prisma Models:** `PettyCashFund`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-007: Create BankStatement

**As a** Tenant Admin/Controller
**I want to** create a new BankStatement record
**So that** I can record and track new BankStatement entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/cash-position`
**Then** the BankStatement is created successfully and linked to my tenantId
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/cash-position`
- **Prisma Models:** `BankStatement`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-008: View BankStatementLine

**As a** Tenant Admin/Controller
**I want to** view the list of BankStatementLines
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/cash-position/snapshot`
**Then** only the BankStatementLines belonging to my tenantId are returned, applying RBAC permissions
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/cash-position/snapshot`
- **Prisma Models:** `BankStatementLine`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-009: Approve BankImportError

**As a** Tenant Admin/Controller
**I want to** approve an existing BankImportError document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/recon-exceptions`
**Then** the BankImportError status changes to APPROVED and an immutable Audit Log is generated
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/recon-exceptions`
- **Prisma Models:** `BankImportError`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-010: Post BankStatementReviewItem

**As a** Tenant Admin/Controller
**I want to** post the BankStatementReviewItem to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/bank-recon`
**Then** a JournalEntry is created atomically, the period lock is verified, and the document is locked
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/bank-recon`
- **Prisma Models:** `BankStatementReviewItem`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-011: Revert BankReconRule

**As a** Tenant Admin/Controller
**I want to** revert or cancel the BankReconRule
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/cash-position`
**Then** the BankReconRule generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/cash-position`
- **Prisma Models:** `BankReconRule`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-012: Edge BankReconPeriod

**As a** Tenant Admin/Controller
**I want to** attempt to post a BankReconPeriod into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/liquidity/forecast`
**Then** the transaction is aborted, a 403 Forbidden is returned, and an alert is logged
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/liquidity/forecast`
- **Prisma Models:** `BankReconPeriod`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-013: Create BankReconciliationException

**As a** Tenant Admin/Controller
**I want to** create a new BankReconciliationException record
**So that** I can record and track new BankReconciliationException entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/recon-exceptions`
**Then** the BankReconciliationException is created successfully and linked to my tenantId
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/recon-exceptions`
- **Prisma Models:** `BankReconciliationException`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-014: View DepositInTransit

**As a** Tenant Admin/Controller
**I want to** view the list of DepositInTransits
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/recon-exceptions`
**Then** only the DepositInTransits belonging to my tenantId are returned, applying RBAC permissions
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/recon-exceptions`
- **Prisma Models:** `DepositInTransit`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-015: Approve BankReconMatch

**As a** Tenant Admin/Controller
**I want to** approve an existing BankReconMatch document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/bank-recon`
**Then** the BankReconMatch status changes to APPROVED and an immutable Audit Log is generated
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/bank-recon`
- **Prisma Models:** `BankReconMatch`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-016: Post CashFlowForecast

**As a** Tenant Admin/Controller
**I want to** post the CashFlowForecast to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/liquidity/forecast/generate`
**Then** a JournalEntry is created atomically, the period lock is verified, and the document is locked
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/liquidity/forecast/generate`
- **Prisma Models:** `CashFlowForecast`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-017: Revert CashGeneratingUnit

**As a** Tenant Admin/Controller
**I want to** revert or cancel the CashGeneratingUnit
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/liquidity/forecast`
**Then** the CashGeneratingUnit generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/liquidity/forecast`
- **Prisma Models:** `CashGeneratingUnit`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-018: Edge CashApplicationBatch

**As a** Tenant Admin/Controller
**I want to** attempt to post a CashApplicationBatch into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/recon-exceptions`
**Then** the transaction is aborted, a 403 Forbidden is returned, and an alert is logged
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/recon-exceptions`
- **Prisma Models:** `CashApplicationBatch`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-019: Create CashApplication

**As a** Tenant Admin/Controller
**I want to** create a new CashApplication record
**So that** I can record and track new CashApplication entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/cash-position/snapshot`
**Then** the CashApplication is created successfully and linked to my tenantId
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/cash-position/snapshot`
- **Prisma Models:** `CashApplication`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-020: View PaymentRunBankFile

**As a** Tenant Admin/Controller
**I want to** view the list of PaymentRunBankFiles
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/balance`
**Then** only the PaymentRunBankFiles belonging to my tenantId are returned, applying RBAC permissions
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/balance`
- **Prisma Models:** `PaymentRunBankFile`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-TREASURY-021: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/bank-recon`
**Then** the transaction is aborted, a 403 Forbidden is returned, and an alert is logged
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/bank-recon`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TREASURY-022: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/treasury/cash-position/snapshot`
**Then** the transaction is aborted, a 403 Forbidden is returned, and an alert is logged
**And** the action is fully atomic and logged in the Audit Trail.

#### Edge Cases:
- Network failure during database transaction.
- Attempting to bypass tenant isolation by manipulating payload.
- Period closes exactly during the transaction execution.

#### Non-Functional Requirements:
- **Performance:** Response < 200ms
- **Security:** Requires JWT + Role Verification + Tenant Middleware
- **Tenant Isolation:** Implicit `where: { tenantId: ctx.tenantId }`
- **Auditability:** `AuditLog` must capture before/after states
- **Reliability:** Prisma `$transaction` must be used for multi-row mutations.

#### Compliance:
- ZATCA: N/A
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/treasury/cash-position/snapshot`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `treasury.service.ts`
- **ERD:** `docs/database/erd/modules/treasury.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
