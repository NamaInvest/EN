# User Stories: MANUFACTURING

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-MANUFACTURING-001: Create DocumentStateMachine

**As a** Tenant Admin/Controller
**I want to** create a new DocumentStateMachine record
**So that** I can record and track new DocumentStateMachine entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/scheduler`
**Then** the DocumentStateMachine is created successfully and linked to my tenantId
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/scheduler`
- **Prisma Models:** `DocumentStateMachine`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-002: View Machine

**As a** Tenant Admin/Controller
**I want to** view the list of Machines
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing`
**Then** only the Machines belonging to my tenantId are returned, applying RBAC permissions
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing`
- **Prisma Models:** `Machine`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-003: Approve MachineMaintenance

**As a** Tenant Admin/Controller
**I want to** approve an existing MachineMaintenance document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/routing`
**Then** the MachineMaintenance status changes to APPROVED and an immutable Audit Log is generated
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/routing`
- **Prisma Models:** `MachineMaintenance`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-004: Post MachineTelemetry

**As a** Tenant Admin/Controller
**I want to** post the MachineTelemetry to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/digital-twin`
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/digital-twin`
- **Prisma Models:** `MachineTelemetry`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-005: Revert BOMVersion

**As a** Tenant Admin/Controller
**I want to** revert or cancel the BOMVersion
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/aps`
**Then** the BOMVersion generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/aps`
- **Prisma Models:** `BOMVersion`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-006: Edge MasterProductionSchedule

**As a** Tenant Admin/Controller
**I want to** attempt to post a MasterProductionSchedule into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/digital-twin`
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/digital-twin`
- **Prisma Models:** `MasterProductionSchedule`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-007: Create ManufacturingBOM

**As a** Tenant Admin/Controller
**I want to** create a new ManufacturingBOM record
**So that** I can record and track new ManufacturingBOM entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/aps`
**Then** the ManufacturingBOM is created successfully and linked to my tenantId
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/aps`
- **Prisma Models:** `ManufacturingBOM`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-008: View MaintenanceWorkOrder

**As a** Tenant Admin/Controller
**I want to** view the list of MaintenanceWorkOrders
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/v3/manufacturing/shopfloor`
**Then** only the MaintenanceWorkOrders belonging to my tenantId are returned, applying RBAC permissions
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/v3/manufacturing/shopfloor`
- **Prisma Models:** `MaintenanceWorkOrder`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-009: Approve DocumentStateMachine

**As a** Tenant Admin/Controller
**I want to** approve an existing DocumentStateMachine document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/variance`
**Then** the DocumentStateMachine status changes to APPROVED and an immutable Audit Log is generated
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/variance`
- **Prisma Models:** `DocumentStateMachine`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-010: Post Machine

**As a** Tenant Admin/Controller
**I want to** post the Machine to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/qc`
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/qc`
- **Prisma Models:** `Machine`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-011: Revert MachineMaintenance

**As a** Tenant Admin/Controller
**I want to** revert or cancel the MachineMaintenance
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/orders/{id}`
**Then** the MachineMaintenance generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/orders/{id}`
- **Prisma Models:** `MachineMaintenance`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-012: Edge MachineTelemetry

**As a** Tenant Admin/Controller
**I want to** attempt to post a MachineTelemetry into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/work-orders`
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/work-orders`
- **Prisma Models:** `MachineTelemetry`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-MANUFACTURING-013: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/capa`
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/capa`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-MANUFACTURING-014: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/manufacturing/mps/generate`
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
- GOSI: N/A
- Saudi VAT: N/A

#### Linked Artifacts:
- **OpenAPI:** `/manufacturing/mps/generate`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `manufacturing.service.ts`
- **ERD:** `docs/database/erd/modules/manufacturing.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
