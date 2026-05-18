# User Stories: AI-RAG

> Auto-generated Enterprise Requirements based on ERD and OpenAPI.


### US-AI-RAG-001: Create PriceQuoteDetail

**As a** Tenant Admin/Controller
**I want to** create a new PriceQuoteDetail record
**So that** I can record and track new PriceQuoteDetail entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/pricequotedetail`
**Then** the PriceQuoteDetail is created successfully and linked to my tenantId
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
- **OpenAPI:** `/api/ai-rag/pricequotedetail`
- **Prisma Models:** `PriceQuoteDetail`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-002: View DeliveryNoteDetail

**As a** Tenant Admin/Controller
**I want to** view the list of DeliveryNoteDetails
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/deliverynotedetail`
**Then** only the DeliveryNoteDetails belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/api/ai-rag/deliverynotedetail`
- **Prisma Models:** `DeliveryNoteDetail`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-003: Approve TrainingCourse

**As a** Tenant Admin/Controller
**I want to** approve an existing TrainingCourse document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/trainingcourse`
**Then** the TrainingCourse status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/api/ai-rag/trainingcourse`
- **Prisma Models:** `TrainingCourse`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-004: Post TrainingEnrollment

**As a** Tenant Admin/Controller
**I want to** post the TrainingEnrollment to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/trainingenrollment`
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
- **OpenAPI:** `/api/ai-rag/trainingenrollment`
- **Prisma Models:** `TrainingEnrollment`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-005: Revert InsuranceClaim

**As a** Tenant Admin/Controller
**I want to** revert or cancel the InsuranceClaim
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/insuranceclaim`
**Then** the InsuranceClaim generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/api/ai-rag/insuranceclaim`
- **Prisma Models:** `InsuranceClaim`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-006: Edge IfrsLeaseImpairment

**As a** Tenant Admin/Controller
**I want to** attempt to post a IfrsLeaseImpairment into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/ifrsleaseimpairment`
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
- **OpenAPI:** `/api/ai-rag/ifrsleaseimpairment`
- **Prisma Models:** `IfrsLeaseImpairment`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-007: Create DunningCampaign

**As a** Tenant Admin/Controller
**I want to** create a new DunningCampaign record
**So that** I can record and track new DunningCampaign entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/dunningcampaign`
**Then** the DunningCampaign is created successfully and linked to my tenantId
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
- **OpenAPI:** `/api/ai-rag/dunningcampaign`
- **Prisma Models:** `DunningCampaign`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-008: View WarrantyClaim

**As a** Tenant Admin/Controller
**I want to** view the list of WarrantyClaims
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/warrantyclaim`
**Then** only the WarrantyClaims belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/api/ai-rag/warrantyclaim`
- **Prisma Models:** `WarrantyClaim`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-009: Approve CrmCampaign

**As a** Tenant Admin/Controller
**I want to** approve an existing CrmCampaign document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/crmcampaign`
**Then** the CrmCampaign status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/api/ai-rag/crmcampaign`
- **Prisma Models:** `CrmCampaign`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-010: Post CrmCampaignMember

**As a** Tenant Admin/Controller
**I want to** post the CrmCampaignMember to the General Ledger
**So that** the financial impact is reflected in my Trial Balance

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/crmcampaignmember`
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
- **OpenAPI:** `/api/ai-rag/crmcampaignmember`
- **Prisma Models:** `CrmCampaignMember`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-011: Revert PortalMessage

**As a** Tenant Admin/Controller
**I want to** revert or cancel the PortalMessage
**So that** I can correct mistakes without corrupting posted data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/portalmessage`
**Then** the PortalMessage generates a reversal entry (if posted) or simply changes status to CANCELLED (if draft), with a mandatory reason log
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
- **OpenAPI:** `/api/ai-rag/portalmessage`
- **Prisma Models:** `PortalMessage`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-012: Edge PromptTemplate

**As a** Tenant Admin/Controller
**I want to** attempt to post a PromptTemplate into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/prompttemplate`
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
- **OpenAPI:** `/api/ai-rag/prompttemplate`
- **Prisma Models:** `PromptTemplate`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-013: Create PromptUsageLog

**As a** Tenant Admin/Controller
**I want to** create a new PromptUsageLog record
**So that** I can record and track new PromptUsageLog entities within my tenant

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/promptusagelog`
**Then** the PromptUsageLog is created successfully and linked to my tenantId
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
- **OpenAPI:** `/api/ai-rag/promptusagelog`
- **Prisma Models:** `PromptUsageLog`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-014: View OcrTrainingData

**As a** Tenant Admin/Controller
**I want to** view the list of OcrTrainingDatas
**So that** I can analyze operational data

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/ocrtrainingdata`
**Then** only the OcrTrainingDatas belonging to my tenantId are returned, applying RBAC permissions
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
- **OpenAPI:** `/api/ai-rag/ocrtrainingdata`
- **Prisma Models:** `OcrTrainingData`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-015: Approve AiConversation

**As a** Tenant Admin/Controller
**I want to** approve an existing AiConversation document
**So that** it can proceed to the next financial/operational stage

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/aiconversation`
**Then** the AiConversation status changes to APPROVED and an immutable Audit Log is generated
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
- **OpenAPI:** `/api/ai-rag/aiconversation`
- **Prisma Models:** `AiConversation`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

## Future Gap Stories
These stories represent missing OpenAPI paths or planned enterprise capabilities.

### US-AI-RAG-016: Edge ComplianceAudit

**As a** Tenant Admin/Controller
**I want to** attempt to post a ComplianceAudit into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/complianceaudit`
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
- **OpenAPI:** `/api/ai-rag/complianceaudit`
- **Prisma Models:** `ComplianceAudit`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test

### US-AI-RAG-017: Edge CrossTenantReport

**As a** Tenant Admin/Controller
**I want to** attempt to post a CrossTenantReport into a closed fiscal period
**So that** the system prevents backdated financial corruption

#### Acceptance Criteria:
**Given** an active session with proper permissions and an open fiscal period
**When** a POST/PUT request is made to `/api/ai-rag/crosstenantreport`
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
- **OpenAPI:** `/api/ai-rag/crosstenantreport`
- **Prisma Models:** `CrossTenantReport`
- **Services:** `ai-rag.service.ts`
- **ERD:** `docs/database/erd/modules/ai-rag.dbml`
- **Workflow:** Standard CRUD/Approval Flow
- **Tests To Add:** Tenant Isolation Test, Concurrency Lock Test
