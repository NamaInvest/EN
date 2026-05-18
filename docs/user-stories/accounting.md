# User Stories: ACCOUNTING

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-ACCOUNTING-001: Create Expense

**As a** Tenant Admin/Controller
**I want to** create a new Expense record
**So that** I can record and track new Expense entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/year-end/{runId}/reports`
**Then** the Expense is created successfully and linked to my tenantId
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
- **OpenAPI:** `/accounting/year-end/{runId}/reports`
- **Prisma Models:** `Expense`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-002: View Account

**As a** Tenant Admin/Controller
**I want to** view the list of Accounts
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/year-end-close/close-period`
**Then** only the Accounts belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/accounting/year-end-close/close-period`
- **Prisma Models:** `Account`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-003: Approve JournalEntry

**As a** Tenant Admin/Controller
**I want to** approve an existing JournalEntry document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/accounts`
**Then** the JournalEntry status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/accounting/accounts`
- **Prisma Models:** `JournalEntry`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-004: Post JournalLine

**As a** Tenant Admin/Controller
**I want to** post the JournalLine to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/payment-runs/{id}/approve`
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
- **OpenAPI:** `/accounting/payment-runs/{id}/approve`
- **Prisma Models:** `JournalLine`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-005: Revert InstallmentPayment

**As a** Tenant Admin/Controller
**I want to** revert or cancel the InstallmentPayment
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/dunning/promise-to-pay`
**Then** the InstallmentPayment generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/accounting/dunning/promise-to-pay`
- **Prisma Models:** `InstallmentPayment`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-006: Edge Currency

**As a** Tenant Admin/Controller
**I want to** attempt to post a Currency into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/profit-centers`
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
- **OpenAPI:** `/accounting/profit-centers`
- **Prisma Models:** `Currency`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-007: Create FiscalPeriod

**As a** Tenant Admin/Controller
**I want to** create a new FiscalPeriod record
**So that** I can record and track new FiscalPeriod entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/payment-runs/{id}/upload-confirmation`
**Then** the FiscalPeriod is created successfully and linked to my tenantId
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
- **OpenAPI:** `/accounting/payment-runs/{id}/upload-confirmation`
- **Prisma Models:** `FiscalPeriod`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-008: View FiscalYear

**As a** Tenant Admin/Controller
**I want to** view the list of FiscalYears
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/ledger`
**Then** only the FiscalYears belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/accounting/ledger`
- **Prisma Models:** `FiscalYear`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-009: Approve FiscalYearReopenRequest

**As a** Tenant Admin/Controller
**I want to** approve an existing FiscalYearReopenRequest document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/year-end/{runId}/tasks/{taskCode}/execute`
**Then** the FiscalYearReopenRequest status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/accounting/year-end/{runId}/tasks/{taskCode}/execute`
- **Prisma Models:** `FiscalYearReopenRequest`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-010: Post JournalTemplate

**As a** Tenant Admin/Controller
**I want to** post the JournalTemplate to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/dunning/promise-to-pay`
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
- **OpenAPI:** `/accounting/dunning/promise-to-pay`
- **Prisma Models:** `JournalTemplate`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-011: Revert JournalTemplateLine

**As a** Tenant Admin/Controller
**I want to** revert or cancel the JournalTemplateLine
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/dunning/promise-to-pay`
**Then** the JournalTemplateLine generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/accounting/dunning/promise-to-pay`
- **Prisma Models:** `JournalTemplateLine`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-012: Edge PaymentTerm

**As a** Tenant Admin/Controller
**I want to** attempt to post a PaymentTerm into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/cashflow/forecast`
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
- **OpenAPI:** `/accounting/cashflow/forecast`
- **Prisma Models:** `PaymentTerm`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-013: Create PaymentTermInstallment

**As a** Tenant Admin/Controller
**I want to** create a new PaymentTermInstallment record
**So that** I can record and track new PaymentTermInstallment entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/governance-violations`
**Then** the PaymentTermInstallment is created successfully and linked to my tenantId
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
- **OpenAPI:** `/accounting/governance-violations`
- **Prisma Models:** `PaymentTermInstallment`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-014: View IfrsVariableLeasePayment

**As a** Tenant Admin/Controller
**I want to** view the list of IfrsVariableLeasePayments
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/allocations`
**Then** only the IfrsVariableLeasePayments belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/accounting/allocations`
- **Prisma Models:** `IfrsVariableLeasePayment`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-015: Approve DeferredRevenueSchedule

**As a** Tenant Admin/Controller
**I want to** approve an existing DeferredRevenueSchedule document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/customer-statements/preview`
**Then** the DeferredRevenueSchedule status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/accounting/customer-statements/preview`
- **Prisma Models:** `DeferredRevenueSchedule`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-016: Post RevenueRecognitionLine

**As a** Tenant Admin/Controller
**I want to** post the RevenueRecognitionLine to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/bank-statements/upload`
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
- **OpenAPI:** `/accounting/bank-statements/upload`
- **Prisma Models:** `RevenueRecognitionLine`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-017: Revert RevenueMilestone

**As a** Tenant Admin/Controller
**I want to** revert or cancel the RevenueMilestone
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/customer-statements/bulk/history`
**Then** the RevenueMilestone generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/accounting/customer-statements/bulk/history`
- **Prisma Models:** `RevenueMilestone`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-018: Edge PaymentRun

**As a** Tenant Admin/Controller
**I want to** attempt to post a PaymentRun into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/open-items/promise-to-pay`
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
- **OpenAPI:** `/accounting/open-items/promise-to-pay`
- **Prisma Models:** `PaymentRun`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-019: Create PaymentRunLine

**As a** Tenant Admin/Controller
**I want to** create a new PaymentRunLine record
**So that** I can record and track new PaymentRunLine entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/year-end/reopen`
**Then** the PaymentRunLine is created successfully and linked to my tenantId
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
- **OpenAPI:** `/accounting/year-end/reopen`
- **Prisma Models:** `PaymentRunLine`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-020: View PaymentRunApproval

**As a** Tenant Admin/Controller
**I want to** view the list of PaymentRunApprovals
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/customer-statements/send-email`
**Then** only the PaymentRunApprovals belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/accounting/customer-statements/send-email`
- **Prisma Models:** `PaymentRunApproval`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-ACCOUNTING-021: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/segments`
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
- **OpenAPI:** `/accounting/segments`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ACCOUNTING-022: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/profit-centers`
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
- **OpenAPI:** `/accounting/profit-centers`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `accounting.service.ts`
- **ERD:** `docs/database/erd/modules/accounting.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
