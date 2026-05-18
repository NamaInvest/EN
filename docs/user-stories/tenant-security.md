# User Stories: TENANT-SECURITY

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-TENANT-SECURITY-001: Create User

**As a** Tenant Admin/Controller
**I want to** create a new User record
**So that** I can record and track new User entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/portal/users`
**Then** the User is created successfully and linked to my tenantId
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
- **OpenAPI:** `/portal/users`
- **Prisma Models:** `User`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-002: View UserBackupCode

**As a** Tenant Admin/Controller
**I want to** view the list of UserBackupCodes
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/userbackupcode`
**Then** only the UserBackupCodes belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/api/tenant-security/userbackupcode`
- **Prisma Models:** `UserBackupCode`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-003: Approve UserPermission

**As a** Tenant Admin/Controller
**I want to** approve an existing UserPermission document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/userpermission`
**Then** the UserPermission status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/api/tenant-security/userpermission`
- **Prisma Models:** `UserPermission`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-004: Post Subscription

**As a** Tenant Admin/Controller
**I want to** post the Subscription to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/subscriptions/process-renewals`
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
- **OpenAPI:** `/subscriptions/process-renewals`
- **Prisma Models:** `Subscription`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-005: Revert SubscriptionPayment

**As a** Tenant Admin/Controller
**I want to** revert or cancel the SubscriptionPayment
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/subscriptionpayment`
**Then** the SubscriptionPayment generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/api/tenant-security/subscriptionpayment`
- **Prisma Models:** `SubscriptionPayment`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-006: Edge WarehouseRack

**As a** Tenant Admin/Controller
**I want to** attempt to post a WarehouseRack into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/warehouserack`
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
- **OpenAPI:** `/api/tenant-security/warehouserack`
- **Prisma Models:** `WarehouseRack`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-007: Create TenantAccount

**As a** Tenant Admin/Controller
**I want to** create a new TenantAccount record
**So that** I can record and track new TenantAccount entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/tenantaccount`
**Then** the TenantAccount is created successfully and linked to my tenantId
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
- **OpenAPI:** `/api/tenant-security/tenantaccount`
- **Prisma Models:** `TenantAccount`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-008: View TenantFeatureFlag

**As a** Tenant Admin/Controller
**I want to** view the list of TenantFeatureFlags
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/tenantfeatureflag`
**Then** only the TenantFeatureFlags belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/api/tenant-security/tenantfeatureflag`
- **Prisma Models:** `TenantFeatureFlag`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-009: Approve RestaurantSession

**As a** Tenant Admin/Controller
**I want to** approve an existing RestaurantSession document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/restaurantsession`
**Then** the RestaurantSession status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/api/tenant-security/restaurantsession`
- **Prisma Models:** `RestaurantSession`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-010: Post PhysicalCountSession

**As a** Tenant Admin/Controller
**I want to** post the PhysicalCountSession to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/physicalcountsession`
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
- **OpenAPI:** `/api/tenant-security/physicalcountsession`
- **Prisma Models:** `PhysicalCountSession`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-011: Revert RoleFieldPermission

**As a** Tenant Admin/Controller
**I want to** revert or cancel the RoleFieldPermission
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/rolefieldpermission`
**Then** the RoleFieldPermission generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/api/tenant-security/rolefieldpermission`
- **Prisma Models:** `RoleFieldPermission`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-012: Edge ApiKey

**As a** Tenant Admin/Controller
**I want to** attempt to post a ApiKey into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/apikey`
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
- **OpenAPI:** `/api/tenant-security/apikey`
- **Prisma Models:** `ApiKey`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-013: Create UserDelegation

**As a** Tenant Admin/Controller
**I want to** create a new UserDelegation record
**So that** I can record and track new UserDelegation entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/userdelegation`
**Then** the UserDelegation is created successfully and linked to my tenantId
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
- **OpenAPI:** `/api/tenant-security/userdelegation`
- **Prisma Models:** `UserDelegation`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-014: View PosSession

**As a** Tenant Admin/Controller
**I want to** view the list of PosSessions
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/possession`
**Then** only the PosSessions belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/api/tenant-security/possession`
- **Prisma Models:** `PosSession`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-015: Approve PosSessionMovement

**As a** Tenant Admin/Controller
**I want to** approve an existing PosSessionMovement document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/possessionmovement`
**Then** the PosSessionMovement status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/api/tenant-security/possessionmovement`
- **Prisma Models:** `PosSessionMovement`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-TENANT-SECURITY-016: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/complianceaudit`
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
- **OpenAPI:** `/api/tenant-security/complianceaudit`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-TENANT-SECURITY-017: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/tenant-security/crosstenantreport`
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
- **OpenAPI:** `/api/tenant-security/crosstenantreport`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `tenant-security.service.ts`
- **ERD:** `docs/database/erd/modules/tenant-security.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
