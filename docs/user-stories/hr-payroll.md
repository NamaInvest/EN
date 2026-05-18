# User Stories: HR-PAYROLL

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-HR-PAYROLL-001: Create Employee

**As a** Tenant Admin/Controller
**I want to** create a new Employee record
**So that** I can record and track new Employee entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/hr/employees`
**Then** the Employee is created successfully and linked to my tenantId
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/hr/employees`
- **Prisma Models:** `Employee`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-002: View Attendance

**As a** Tenant Admin/Controller
**I want to** view the list of Attendances
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/attendance/face-id`
**Then** only the Attendances belonging to my tenantId are returned, applying RBAC permissions
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/attendance/face-id`
- **Prisma Models:** `Attendance`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-003: Approve Salary

**As a** Tenant Admin/Controller
**I want to** approve an existing Salary document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/salary`
**Then** the Salary status changes to APPROVED and an immutable Audit Log is generated
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/salary`
- **Prisma Models:** `Salary`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-004: Post Shift

**As a** Tenant Admin/Controller
**I want to** post the Shift to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/work-shifts`
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/work-shifts`
- **Prisma Models:** `Shift`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-005: Revert EmployeeLoan

**As a** Tenant Admin/Controller
**I want to** revert or cancel the EmployeeLoan
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/employeeloan`
**Then** the EmployeeLoan generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/employeeloan`
- **Prisma Models:** `EmployeeLoan`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-006: Edge JobPosting

**As a** Tenant Admin/Controller
**I want to** attempt to post a JobPosting into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/jobposting`
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/jobposting`
- **Prisma Models:** `JobPosting`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-007: Create JobApplicant

**As a** Tenant Admin/Controller
**I want to** create a new JobApplicant record
**So that** I can record and track new JobApplicant entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/jobapplicant`
**Then** the JobApplicant is created successfully and linked to my tenantId
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/jobapplicant`
- **Prisma Models:** `JobApplicant`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-008: View EmployeeEvaluation

**As a** Tenant Admin/Controller
**I want to** view the list of EmployeeEvaluations
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/employeeevaluation`
**Then** only the EmployeeEvaluations belonging to my tenantId are returned, applying RBAC permissions
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/employeeevaluation`
- **Prisma Models:** `EmployeeEvaluation`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-009: Approve WorkShift

**As a** Tenant Admin/Controller
**I want to** approve an existing WorkShift document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/workshift`
**Then** the WorkShift status changes to APPROVED and an immutable Audit Log is generated
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/workshift`
- **Prisma Models:** `WorkShift`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-010: Post PayrollInvoice

**As a** Tenant Admin/Controller
**I want to** post the PayrollInvoice to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/payrollinvoice`
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/payrollinvoice`
- **Prisma Models:** `PayrollInvoice`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-011: Revert PayrollInvoiceDetail

**As a** Tenant Admin/Controller
**I want to** revert or cancel the PayrollInvoiceDetail
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/payrollinvoicedetail`
**Then** the PayrollInvoiceDetail generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/payrollinvoicedetail`
- **Prisma Models:** `PayrollInvoiceDetail`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-012: Edge DeductionReason

**As a** Tenant Admin/Controller
**I want to** attempt to post a DeductionReason into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/deductionreason`
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/deductionreason`
- **Prisma Models:** `DeductionReason`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-HR-PAYROLL-013: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/complianceaudit`
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/complianceaudit`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-HR-PAYROLL-014: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/hr-payroll/crosstenantreport`
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
- SOCPA: N/A
- GOSI: Pass
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/api/hr-payroll/crosstenantreport`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `hr-payroll.service.ts`
- **ERD:** `docs/database/erd/modules/hr-payroll.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
