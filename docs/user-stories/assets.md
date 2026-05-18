# User Stories: ASSETS

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-ASSETS-001: Create Maintenance

**As a** Tenant Admin/Controller
**I want to** create a new Maintenance record
**So that** I can record and track new Maintenance entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/maintenance/preventive`
**Then** the Maintenance is created successfully and linked to my tenantId
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
- **OpenAPI:** `/maintenance/preventive`
- **Prisma Models:** `Maintenance`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-002: View Asset

**As a** Tenant Admin/Controller
**I want to** view the list of Assets
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/assets`
**Then** only the Assets belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/assets`
- **Prisma Models:** `Asset`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-003: Approve FixedAsset

**As a** Tenant Admin/Controller
**I want to** approve an existing FixedAsset document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/assets/leases/post-monthly`
**Then** the FixedAsset status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/assets/leases/post-monthly`
- **Prisma Models:** `FixedAsset`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-004: Post FixedAssetCategory

**As a** Tenant Admin/Controller
**I want to** post the FixedAssetCategory to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/fixed-assets/{id}/depreciate`
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
- **OpenAPI:** `/fixed-assets/{id}/depreciate`
- **Prisma Models:** `FixedAssetCategory`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-005: Revert AssetDepreciationLog

**As a** Tenant Admin/Controller
**I want to** revert or cancel the AssetDepreciationLog
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/accounting/fixed-assets/depreciate`
**Then** the AssetDepreciationLog generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/accounting/fixed-assets/depreciate`
- **Prisma Models:** `AssetDepreciationLog`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-006: Edge AssetImpairmentRecord

**As a** Tenant Admin/Controller
**I want to** attempt to post a AssetImpairmentRecord into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/finance/assets`
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
- **OpenAPI:** `/finance/assets`
- **Prisma Models:** `AssetImpairmentRecord`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-007: Create AssetTransferRecord

**As a** Tenant Admin/Controller
**I want to** create a new AssetTransferRecord record
**So that** I can record and track new AssetTransferRecord entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/fixed-assets`
**Then** the AssetTransferRecord is created successfully and linked to my tenantId
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
- **OpenAPI:** `/fixed-assets`
- **Prisma Models:** `AssetTransferRecord`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-008: View AssetMaintenanceRecord

**As a** Tenant Admin/Controller
**I want to** view the list of AssetMaintenanceRecords
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/finance/assets`
**Then** only the AssetMaintenanceRecords belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/finance/assets`
- **Prisma Models:** `AssetMaintenanceRecord`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-009: Approve AssetInsuranceClaim

**As a** Tenant Admin/Controller
**I want to** approve an existing AssetInsuranceClaim document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/assets/leases/post-monthly`
**Then** the AssetInsuranceClaim status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/assets/leases/post-monthly`
- **Prisma Models:** `AssetInsuranceClaim`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-010: Post AssetUsageLog

**As a** Tenant Admin/Controller
**I want to** post the AssetUsageLog to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/assets`
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
- **OpenAPI:** `/assets`
- **Prisma Models:** `AssetUsageLog`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-011: Revert AssetReclassification

**As a** Tenant Admin/Controller
**I want to** revert or cancel the AssetReclassification
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/assets/depreciate`
**Then** the AssetReclassification generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/assets/depreciate`
- **Prisma Models:** `AssetReclassification`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-012: Edge AssetDocument

**As a** Tenant Admin/Controller
**I want to** attempt to post a AssetDocument into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/assets`
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
- **OpenAPI:** `/assets`
- **Prisma Models:** `AssetDocument`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-ASSETS-013: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/assets/depreciate`
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
- **OpenAPI:** `/assets/depreciate`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-ASSETS-014: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/fixed-assets/{id}/depreciate`
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
- **OpenAPI:** `/fixed-assets/{id}/depreciate`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `assets.service.ts`
- **ERD:** `docs/database/erd/modules/assets.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
