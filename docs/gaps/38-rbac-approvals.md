# النقص #38: RBAC + Roles + Permissions + Approvals + BPM — مواصفات

> **المرجعيات:** SAP GRC、Okta、Auth0、AWS IAM、ServiceNow Workflow、Camunda、Zeebe BPM

---

## 1. البرومنت

```
ابني نظام RBAC + Approvals + BPM:

موجود: User, UserPermission, ApprovalRule, ApprovalRequest, ApprovalStep, approval-engine, bpm-engine, governance-engine

النواقص:
A) Hierarchical Roles (with inheritance)
B) Fine-grained permissions (per resource per action)
C) Field-level permissions
D) Row-level security (data filtering)
E) Multi-tenant isolation
F) Approval rules (per amount/dept/type)
G) Multi-level + parallel approval
H) Delegation (out-of-office)
I) Escalation on timeout
J) BPM workflow designer (visual)
K) State machines (configurable)
APIs (40+), UI (15 pages), Tests 70+
```

---

## 2. السيناريوهات (8)

### A — Role Hierarchy
```
- Roles defined:
  - Super Admin (all)
  - Admin (most, except super)
  - Manager (department + reports)
  - Senior Employee (own + view team)
  - Employee (own only)
- Inheritance: Manager inherits Senior
- Each role: assigned to users
```

### B — Permission Granularity
```
- Resource: SalesInvoice
- Permissions:
  - view (own/team/all)
  - create
  - update (own/team/all)
  - delete (with reason)
  - post (after approval)
  - cancel
  - export
- Each role gets specific combination
```

### C — Approval Workflow
```
- PR > 10K → Manager approval
- PR > 50K → + Department Head
- PR > 200K → + CFO
- PR > 1M → + CEO
- Parallel: Manager + QA Mgr same level
- Sequential: through hierarchy
```

### D — Out-of-Office Delegation
```
- Manager going on vacation
- Sets delegation: replace with Assistant Mgr
- Date range: 1-7 May
- All approvals route to assistant during this period
- Audit: shows actual approver vs delegated
```

### E — Escalation on Timeout
```
- Approval pending 24h → reminder
- 48h → escalate to next level
- 72h → CEO notified
- Configurable per workflow
```

### F — Field-level Security
```
- HR can see all employees
- But salary field hidden unless HR Mgr+
- Some fields encrypted at rest, decrypted on permission
```

### G — Row-level Security
```
- Sales rep can only see own customers
- Manager sees team's customers
- Director sees all in region
- Filtering automatic in all queries
```

### H — BPM Custom Workflow
```
- Designer drag-drop: tasks, decisions, gateways
- Define: steps, owners, timers, escalations
- Activate workflow
- Apply to documents (e.g., custom approval for high-risk transactions)
```

---

## 3. تدفق البيانات

```
[Permission Check]
On any API call:
   ↓ get user's roles
   ↓ get permissions for resource+action
   ↓ check resource scope (own/team/all)
   ↓ apply field masks
   ↓ apply row filters

[Approval Submission]
POST /approvals/submit { documentType, documentId, amount }
   ↓ find applicable rule
   ↓ create ApprovalRequest with chain
   ↓ notify first approver

[Decision]
POST /approvals/:id/decide { decision, comments }
   ↓ update step
   ↓ if approved → next step or final
   ↓ if rejected → return to requester
```

---

## 4. Schema (إضافات)

```prisma
model Role {
  id              Int       @id @default(autoincrement())
  code            String    @unique
  nameAr          String
  nameEn          String
  description     String?
  
  parentRoleId    Int?
  parentRole      Role?     @relation("RoleInheritance", fields: [parentRoleId], references: [id])
  childRoles      Role[]    @relation("RoleInheritance")
  
  isSystem        Boolean   @default(false)
  isActive        Boolean   @default(true)
  
  permissions     RolePermission[]
  users           UserRole[]
}

model UserRole {
  id              Int       @id @default(autoincrement())
  userId          String
  roleId          Int
  role            Role      @relation(fields: [roleId], references: [id])
  
  scope           String?   // 'OWN' | 'TEAM' | 'DEPARTMENT' | 'BRANCH' | 'ALL'
  scopeValue      String?   // specific dept/branch ID
  
  effectiveFrom   DateTime  @default(now())
  effectiveTo     DateTime?
  
  assignedByUserId String
  assignedAt      DateTime  @default(now())
  
  @@unique([userId, roleId])
}

model Permission {
  id              Int       @id @default(autoincrement())
  code            String    @unique  // 'sales.invoice.create'
  resource        String
  action          String    // 'view' | 'create' | 'update' | 'delete' | 'approve' | 'export'
  
  description     String?
  category        String?
  
  isSystem        Boolean   @default(false)
}

model RolePermission {
  id              Int       @id @default(autoincrement())
  roleId          Int
  role            Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId    Int
  permission      Permission @relation(fields: [permissionId], references: [id])
  
  scope           String?
  conditions      Json?
}

model FieldPermission {
  id              Int       @id @default(autoincrement())
  roleId          Int
  resource        String
  fieldName       String
  
  visibility      String    // 'HIDDEN' | 'MASKED' | 'READ' | 'WRITE'
  maskPattern     String?   // for MASKED
}

model RowLevelSecurity {
  id              Int       @id @default(autoincrement())
  roleId          Int
  resource        String
  
  filterExpression String   // SQL-like: "customerId IN (SELECT customerId FROM CustomerOwner WHERE userId = $current)"
  
  active          Boolean   @default(true)
}

model ApprovalRule {
  // ... existing
  ruleNumber      String    @unique
  name            String
  description     String?
  
  documentType    String    // 'PR' | 'PO' | 'INVOICE' | 'JE' | 'BUDGET' | etc.
  
  conditions      Json      // [{field, operator, value}]
  
  steps           ApprovalRuleStep[]
  
  active          Boolean   @default(true)
  effectiveFrom   DateTime
  effectiveTo     DateTime?
}

model ApprovalRuleStep {
  id              Int       @id @default(autoincrement())
  ruleId          Int
  rule            ApprovalRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  
  level           Int       // 1, 2, 3
  parallelGroup   Int?      // same group = parallel
  
  approverType    String    // 'USER' | 'ROLE' | 'MANAGER' | 'DEPARTMENT_HEAD' | 'DYNAMIC'
  approverIds     String[]
  approverRoleIds Int[]
  
  slaHours        Int?
  escalateToUserId String?
  escalateToRoleId Int?
  
  isMandatory     Boolean   @default(true)
  canDelegate     Boolean   @default(true)
}

model ApprovalRequest {
  // ... existing
  documentType    String
  documentId      Int
  amount          Decimal?  @db.Decimal(20,4)
  
  ruleId          Int?
  
  requestedByUserId String
  requestedAt     DateTime  @default(now())
  
  status          String    @default("PENDING")  // PENDING | APPROVED | REJECTED | CANCELLED | EXPIRED
  
  finalDecisionAt DateTime?
  
  steps           ApprovalStep[]
}

model ApprovalStep {
  // ... existing
  level           Int
  
  approverUserId  String?
  delegatedToUserId String?
  
  status          String    @default("PENDING")  // PENDING | APPROVED | REJECTED | DELEGATED | EXPIRED | SKIPPED
  
  decisionAt      DateTime?
  comments        String?
  
  slaDeadline     DateTime?
  
  reminderSentAt  DateTime?
  escalatedAt     DateTime?
  escalatedToUserId String?
}

model Delegation {
  id              Int       @id @default(autoincrement())
  fromUserId      String
  toUserId        String
  
  reason          String
  startDate       DateTime
  endDate         DateTime
  
  scope           String    // 'ALL_APPROVALS' | 'SPECIFIC_RULES' | 'AMOUNT_RANGE'
  scopeData       Json?
  
  active          Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
}

model Workflow {
  id              Int       @id @default(autoincrement())
  workflowNumber  String    @unique
  name            String
  description     String?
  
  applicableResource String
  triggerEvent    String    // 'CREATE' | 'UPDATE' | 'POST' | 'CUSTOM'
  
  bpmnXml         String?   @db.Text  // visual designer output
  
  status          String    @default("DRAFT")  // DRAFT | ACTIVE | DEPRECATED | RETIRED
  version         Int       @default(1)
  
  steps           WorkflowStep[]
  instances       WorkflowInstance[]
}

model WorkflowStep {
  id              Int       @id @default(autoincrement())
  workflowId      Int
  workflow        Workflow  @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  stepNumber      Int
  type            String    // 'START' | 'END' | 'TASK' | 'APPROVAL_TASK' | 'CONDITION' | 'AUTO_ACTION' | 'PARALLEL_GATEWAY' | 'EXCLUSIVE_GATEWAY'
  
  name            String
  config          Json      // step-specific config
  
  nextSteps       Int[]     // step IDs
  
  ownerType       String?   // 'USER' | 'ROLE'
  ownerIds        String[]
  
  slaHours        Int?
}

model WorkflowInstance {
  id              Int       @id @default(autoincrement())
  workflowId      Int
  workflow        Workflow  @relation(fields: [workflowId], references: [id])
  
  documentType    String
  documentId      Int
  
  status          String    @default("RUNNING")  // RUNNING | COMPLETED | CANCELLED | FAILED
  currentStepIds  Int[]
  
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  
  history         Json      // [{stepId, action, by, at}]
}

model AccessAttempt {
  id              BigInt    @id @default(autoincrement())
  userId          String?
  resource        String
  action          String
  
  permitted       Boolean
  reason          String?
  
  ipAddress       String?
  
  attemptedAt     DateTime  @default(now())
  
  @@index([userId, attemptedAt])
}
```

---

## 5. Forms (8)

A: Role Editor (with inheritance + permissions)
B: User Role Assignment
C: Permission Catalog
D: Approval Rule Builder
E: Workflow Designer (BPMN visual)
F: Delegation Setup
G: Field Permission Matrix
H: Row-Level Security Rule

---

## 6. Tables (8)

A: Roles + Permissions Matrix
B: Users + Roles
C: Approval Rules
D: Pending Approvals (mine)
E: Approval History
F: Active Delegations
G: Workflow Instances
H: Access Attempts (denied)

---

## 7. Buttons (28+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-role-create | + دور | 🟢 super admin |
| btn-role-clone | استنساخ | ⬜ super admin |
| btn-role-permission-edit | تعديل الصلاحيات | 🟢 super admin |
| btn-role-deactivate | تعطيل | 🔴 super admin |
| btn-user-assign-role | إسناد دور | 🟢 admin |
| btn-user-revoke-role | سحب الدور | 🔴 admin |
| btn-permission-create | + صلاحية | 🟢 super admin |
| btn-rule-create | + قاعدة اعتماد | 🟢 cfo + admin |
| btn-rule-test | اختبار القاعدة | 🟦 admin |
| btn-rule-disable | تعطيل | 🔴 admin |
| btn-approval-approve | موافقة | 🟢 approver |
| btn-approval-reject | رفض | 🔴 approver + reason |
| btn-approval-delegate | تفويض | 🟦 approver |
| btn-approval-recall | سحب | 🟡 requester |
| btn-approval-skip | تخطّي | 🟡 admin + reason |
| btn-approval-history | سجل الموافقات | ⬜ viewer |
| btn-delegation-create | + تفويض | 🟢 self |
| btn-delegation-end-now | إنهاء الآن | 🔴 self |
| btn-workflow-design | تصميم البزنس فلو | 🟢 admin |
| btn-workflow-activate | تفعيل | 🟢 admin |
| btn-workflow-instance-cancel | إلغاء | 🔴 admin + reason |
| btn-field-permission-set | + صلاحية حقل | 🟢 super admin |
| btn-rls-rule-create | + قاعدة Row-Level | 🟢 super admin |
| btn-access-log-export | تصدير | ⬜ super admin |
| btn-bulk-role-assign | إسناد جماعي | 🟦 admin |
| btn-permission-audit | تدقيق الصلاحيات | ⬜ super admin |
| btn-sod-conflict-check | فحص تعارض SoD | ⬜ super admin |
| btn-clone-workflow | استنساخ workflow | ⬜ admin |

---

## 8. Search & Filters

- Roles: parent, active
- Users: by role, active, last login
- Approvals: status, approver, document type, amount range
- Delegations: active, user
- Workflows: resource, status

---

## 9. Reports

- Role-Permission Matrix
- User Access Inventory
- Approval Cycle Time
- Approval Bottlenecks
- Delegation Usage
- Privileged Access Review
- Failed Access Attempts
- Workflow Performance

---

## 10. Dashboards

- KPIs: Pending Approvals / SLA at Risk / Active Delegations / Failed Logins
- Charts: Approval cycle time, Workflow instance counts
- Lists: Approvals awaiting me, Delegations expiring

---

## 11. Notifications

- Role changed
- Approval pending (assigned)
- Approval reminder (SLA approaching)
- Approval escalated
- Delegation activated
- Failed access alert (admin)
- Workflow instance failed

---

## 12. Permissions

| Action | User | Manager | Admin | Super Admin |
|--------|------|---------|-------|-------------|
| Create role | ✗ | ✗ | ✗ | ✓ |
| Assign role | ✗ | ✗ | ✓ | ✓ |
| Approve | per rule | per rule | per rule | per rule |
| Delegate own | ✓ | ✓ | ✓ | ✓ |
| Override approval | ✗ | ✗ | ✗ | ✓ |
| Configure RBAC | ✗ | ✗ | ✗ | ✓ |
| Workflow design | ✗ | ✗ | ✓ | ✓ |
| View access logs | own | team | ✓ | ✓ |

---

## 13. Integrations

- Active Directory / LDAP
- Okta / Auth0
- SAML SSO
- ServiceNow GRC
- Camunda BPM
- Zeebe

---

## 14. Shortcuts

- `Ctrl+A` Approve current
- `Ctrl+R` Reject

---

## 15. Mobile / Print

- Mobile approval queue
- Print: role matrix, audit reports

---

## 16. Audit

- All role changes
- Permission grants/revokes
- Approval decisions
- Delegations
- Failed access attempts
- Workflow instance history

---

## 17. Tests

```typescript
describe('Role Inheritance', () => { /* parent permissions inherited */ })
describe('Permission Check', () => { /* with scope */ })
describe('Approval Chain', () => { /* sequential, parallel */ })
describe('Delegation', () => { /* date range, scope */ })
describe('Escalation', () => { /* SLA timer */ })
describe('Field Permission', () => { /* hidden, masked */ })
describe('Row-Level Security', () => { /* filter applied */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Approver inactive when needed | escalate immediately |
| Delegation cycle (A→B→A) | reject |
| Role deleted but assigned | revoke + alert |
| Rule changes mid-approval | use rule at submission time |
| User has 2 conflicting roles | use highest |
| Workflow stuck (no path) | timeout + admin alert |

---

**نهاية #38** • 8 سيناريوهات • 11 جداول • 8 forms • 8 grids • 28 button • 8 reports
