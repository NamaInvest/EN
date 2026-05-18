# User Stories: SALES

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-SALES-001: Create Customer

**As a** Tenant Admin/Controller
**I want to** create a new Customer record
**So that** I can record and track new Customer entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/forecast`
**Then** the Customer is created successfully and linked to my tenantId
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/forecast`
- **Prisma Models:** `Customer`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-002: View SalesInvoice

**As a** Tenant Admin/Controller
**I want to** view the list of SalesInvoices
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/forecast`
**Then** only the SalesInvoices belonging to my tenantId are returned, applying RBAC permissions
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/forecast`
- **Prisma Models:** `SalesInvoice`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-003: Approve SalesInvoiceDetail

**As a** Tenant Admin/Controller
**I want to** approve an existing SalesInvoiceDetail document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/atp/check`
**Then** the SalesInvoiceDetail status changes to APPROVED and an immutable Audit Log is generated
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/atp/check`
- **Prisma Models:** `SalesInvoiceDetail`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-004: Post SalesReturn

**As a** Tenant Admin/Controller
**I want to** post the SalesReturn to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales`
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales`
- **Prisma Models:** `SalesReturn`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-005: Revert SalesReturnDetail

**As a** Tenant Admin/Controller
**I want to** revert or cancel the SalesReturnDetail
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/ai/sales-coach`
**Then** the SalesReturnDetail generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/ai/sales-coach`
- **Prisma Models:** `SalesReturnDetail`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-006: Edge Quotation

**As a** Tenant Admin/Controller
**I want to** attempt to post a Quotation into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales-returns`
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales-returns`
- **Prisma Models:** `Quotation`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-007: Create QuotationItem

**As a** Tenant Admin/Controller
**I want to** create a new QuotationItem record
**So that** I can record and track new QuotationItem entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/forecast`
**Then** the QuotationItem is created successfully and linked to my tenantId
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/forecast`
- **Prisma Models:** `QuotationItem`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-008: View ManufacturingOrder

**As a** Tenant Admin/Controller
**I want to** view the list of ManufacturingOrders
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/quotes/{id}/convert-to-so`
**Then** only the ManufacturingOrders belonging to my tenantId are returned, applying RBAC permissions
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/quotes/{id}/convert-to-so`
- **Prisma Models:** `ManufacturingOrder`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-009: Approve SalesTarget

**As a** Tenant Admin/Controller
**I want to** approve an existing SalesTarget document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales-returns`
**Then** the SalesTarget status changes to APPROVED and an immutable Audit Log is generated
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales-returns`
- **Prisma Models:** `SalesTarget`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-010: Post SalesOrder

**As a** Tenant Admin/Controller
**I want to** post the SalesOrder to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/v2/sales/invoices`
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/v2/sales/invoices`
- **Prisma Models:** `SalesOrder`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-011: Revert SalesOrderDetail

**As a** Tenant Admin/Controller
**I want to** revert or cancel the SalesOrderDetail
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales-returns`
**Then** the SalesOrderDetail generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales-returns`
- **Prisma Models:** `SalesOrderDetail`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-012: Edge RequestForQuotation

**As a** Tenant Admin/Controller
**I want to** attempt to post a RequestForQuotation into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales-returns`
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales-returns`
- **Prisma Models:** `RequestForQuotation`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-013: Create RequestForQuotationDetail

**As a** Tenant Admin/Controller
**I want to** create a new RequestForQuotationDetail record
**So that** I can record and track new RequestForQuotationDetail entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/targets`
**Then** the RequestForQuotationDetail is created successfully and linked to my tenantId
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/targets`
- **Prisma Models:** `RequestForQuotationDetail`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-014: View GoodsReceiptNote

**As a** Tenant Admin/Controller
**I want to** view the list of GoodsReceiptNotes
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/atp/check`
**Then** only the GoodsReceiptNotes belonging to my tenantId are returned, applying RBAC permissions
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/atp/check`
- **Prisma Models:** `GoodsReceiptNote`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-015: Approve GoodsReceiptNoteDetail

**As a** Tenant Admin/Controller
**I want to** approve an existing GoodsReceiptNoteDetail document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales-orders/{id}/process`
**Then** the GoodsReceiptNoteDetail status changes to APPROVED and an immutable Audit Log is generated
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales-orders/{id}/process`
- **Prisma Models:** `GoodsReceiptNoteDetail`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-016: Post SalesmanCommission

**As a** Tenant Admin/Controller
**I want to** post the SalesmanCommission to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/commissions/calculate`
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/commissions/calculate`
- **Prisma Models:** `SalesmanCommission`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-017: Revert RentInvoice

**As a** Tenant Admin/Controller
**I want to** revert or cancel the RentInvoice
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/quotes/{id}/convert-to-so`
**Then** the RentInvoice generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/quotes/{id}/convert-to-so`
- **Prisma Models:** `RentInvoice`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-018: Edge RentInvoiceDetail

**As a** Tenant Admin/Controller
**I want to** attempt to post a RentInvoiceDetail into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/quotes/{id}/convert-to-so`
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/quotes/{id}/convert-to-so`
- **Prisma Models:** `RentInvoiceDetail`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-019: Create SchoolInvoice

**As a** Tenant Admin/Controller
**I want to** create a new SchoolInvoice record
**So that** I can record and track new SchoolInvoice entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/atp/check`
**Then** the SchoolInvoice is created successfully and linked to my tenantId
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/atp/check`
- **Prisma Models:** `SchoolInvoice`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-020: View SchoolInvoiceDetail

**As a** Tenant Admin/Controller
**I want to** view the list of SchoolInvoiceDetails
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/pricing/calculate`
**Then** only the SchoolInvoiceDetails belonging to my tenantId are returned, applying RBAC permissions
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/pricing/calculate`
- **Prisma Models:** `SchoolInvoiceDetail`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-SALES-021: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/returns`
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/returns`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-SALES-022: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/sales/rma/{id}/approve`
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
- ZATCA: Pass
- SOCPA: Pass
- GOSI: N/A
- Saudi VAT: Pass

#### Linked Artifacts:
- **OpenAPI:** `/sales/rma/{id}/approve`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `sales.service.ts`
- **ERD:** `docs/database/erd/modules/sales.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
