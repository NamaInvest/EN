# User Stories: PROCUREMENT

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-PROCUREMENT-001: Create PurchaseOrder

**As a** Tenant Admin/Controller
**I want to** create a new PurchaseOrder record
**So that** I can record and track new PurchaseOrder entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/rfq/{id}/comparison`
**Then** the PurchaseOrder is created successfully and linked to my tenantId
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
- **OpenAPI:** `/procurement/rfq/{id}/comparison`
- **Prisma Models:** `PurchaseOrder`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-002: View PurchaseOrderDetail

**As a** Tenant Admin/Controller
**I want to** view the list of PurchaseOrderDetails
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/auto-draft`
**Then** only the PurchaseOrderDetails belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/procurement/auto-draft`
- **Prisma Models:** `PurchaseOrderDetail`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-003: Approve PurchaseInvoice

**As a** Tenant Admin/Controller
**I want to** approve an existing PurchaseInvoice document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/rfq/{id}`
**Then** the PurchaseInvoice status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/procurement/rfq/{id}`
- **Prisma Models:** `PurchaseInvoice`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-004: Post PurchaseInvoiceDetail

**As a** Tenant Admin/Controller
**I want to** post the PurchaseInvoiceDetail to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/supplier-contracts`
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
- **OpenAPI:** `/procurement/supplier-contracts`
- **Prisma Models:** `PurchaseInvoiceDetail`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-005: Revert PurchaseReturn

**As a** Tenant Admin/Controller
**I want to** revert or cancel the PurchaseReturn
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/supplier-contracts`
**Then** the PurchaseReturn generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/procurement/supplier-contracts`
- **Prisma Models:** `PurchaseReturn`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-006: Edge PurchaseReturnDetail

**As a** Tenant Admin/Controller
**I want to** attempt to post a PurchaseReturnDetail into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/rfq/{id}/invite`
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
- **OpenAPI:** `/procurement/rfq/{id}/invite`
- **Prisma Models:** `PurchaseReturnDetail`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-007: Create SupplierContract

**As a** Tenant Admin/Controller
**I want to** create a new SupplierContract record
**So that** I can record and track new SupplierContract entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/auto-draft`
**Then** the SupplierContract is created successfully and linked to my tenantId
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
- **OpenAPI:** `/procurement/auto-draft`
- **Prisma Models:** `SupplierContract`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-008: View PurchaseRequisition

**As a** Tenant Admin/Controller
**I want to** view the list of PurchaseRequisitions
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/contracts`
**Then** only the PurchaseRequisitions belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/procurement/contracts`
- **Prisma Models:** `PurchaseRequisition`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-009: Approve PurchaseRequisitionDetail

**As a** Tenant Admin/Controller
**I want to** approve an existing PurchaseRequisitionDetail document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/rfq/{id}/award`
**Then** the PurchaseRequisitionDetail status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/procurement/rfq/{id}/award`
- **Prisma Models:** `PurchaseRequisitionDetail`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-010: Post VendorRating

**As a** Tenant Admin/Controller
**I want to** post the VendorRating to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/auto-draft`
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
- **OpenAPI:** `/procurement/auto-draft`
- **Prisma Models:** `VendorRating`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-011: Revert VendorBid

**As a** Tenant Admin/Controller
**I want to** revert or cancel the VendorBid
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/rfq/{id}`
**Then** the VendorBid generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/procurement/rfq/{id}`
- **Prisma Models:** `VendorBid`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-012: Edge VendorBidDetail

**As a** Tenant Admin/Controller
**I want to** attempt to post a VendorBidDetail into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/vendors/scorecard`
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
- **OpenAPI:** `/procurement/vendors/scorecard`
- **Prisma Models:** `VendorBidDetail`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-013: Create VendorPortalToken

**As a** Tenant Admin/Controller
**I want to** create a new VendorPortalToken record
**So that** I can record and track new VendorPortalToken entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/auto-draft`
**Then** the VendorPortalToken is created successfully and linked to my tenantId
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
- **OpenAPI:** `/procurement/auto-draft`
- **Prisma Models:** `VendorPortalToken`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-014: View VendorOnboarding

**As a** Tenant Admin/Controller
**I want to** view the list of VendorOnboardings
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/rfq/{id}/comparison`
**Then** only the VendorOnboardings belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/procurement/rfq/{id}/comparison`
- **Prisma Models:** `VendorOnboarding`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-015: Approve VendorOnboardingStep

**As a** Tenant Admin/Controller
**I want to** approve an existing VendorOnboardingStep document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/rfq/{id}/comparison`
**Then** the VendorOnboardingStep status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/procurement/rfq/{id}/comparison`
- **Prisma Models:** `VendorOnboardingStep`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-016: Post PurchaseOrder

**As a** Tenant Admin/Controller
**I want to** post the PurchaseOrder to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/auto-draft`
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
- **OpenAPI:** `/procurement/auto-draft`
- **Prisma Models:** `PurchaseOrder`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-017: Revert PurchaseOrderDetail

**As a** Tenant Admin/Controller
**I want to** revert or cancel the PurchaseOrderDetail
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/auto-draft`
**Then** the PurchaseOrderDetail generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/procurement/auto-draft`
- **Prisma Models:** `PurchaseOrderDetail`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-018: Edge PurchaseInvoice

**As a** Tenant Admin/Controller
**I want to** attempt to post a PurchaseInvoice into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/auto-draft`
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
- **OpenAPI:** `/procurement/auto-draft`
- **Prisma Models:** `PurchaseInvoice`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-019: Create PurchaseInvoiceDetail

**As a** Tenant Admin/Controller
**I want to** create a new PurchaseInvoiceDetail record
**So that** I can record and track new PurchaseInvoiceDetail entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/supplier-contracts`
**Then** the PurchaseInvoiceDetail is created successfully and linked to my tenantId
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
- **OpenAPI:** `/procurement/supplier-contracts`
- **Prisma Models:** `PurchaseInvoiceDetail`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-020: View PurchaseReturn

**As a** Tenant Admin/Controller
**I want to** view the list of PurchaseReturns
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/contracts`
**Then** only the PurchaseReturns belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/procurement/contracts`
- **Prisma Models:** `PurchaseReturn`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-PROCUREMENT-021: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/spend-analytics`
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
- **OpenAPI:** `/procurement/spend-analytics`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-PROCUREMENT-022: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/procurement/rfq/{id}/comparison`
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
- **OpenAPI:** `/procurement/rfq/{id}/comparison`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `procurement.service.ts`
- **ERD:** `docs/database/erd/modules/procurement.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
