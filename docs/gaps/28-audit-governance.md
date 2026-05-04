# النقص #28: Audit + Governance + SoD + Field Audit — مواصفات تفصيلية

> **المرجعيات:** SAP GRC、Oracle Audit Vault、Workday Audit、ServiceNow GRC、AuditBoard、SOX/COSO、ISO 27001、PDPL (KSA)

---

## 1. البرومنت

```
ابني نظام Audit & Governance:

موجود: AuditLog, FieldAuditLog (basic), governance-engine, field-audit, document-state-machine

النواقص:
A) Comprehensive AuditLog (every CRUD + business event)
B) Field-level audit (before/after diff)
C) Tamper-detection (hash chain)
D) Segregation of Duties (SoD) matrix
E) Privileged access management
F) Compliance frameworks (SOX, ISO 27001, PCI-DSS, PDPL)
G) Internal audit workflow
H) External audit data export
I) Risk register
J) Issue tracking + remediation
K) Policy management + acknowledgements
L) Whistleblower reporting (anonymous)
M) GRC dashboard

APIs (40+), UI (15 pages), Tests 60+
```

---

## 2. السيناريوهات (8)

### A — User Action Audit
```
- Sales rep edits invoice 12345
- AuditLog: { user, action: UPDATE, entity: SalesInvoice, id: 12345, before: {...}, after: {...}, ip, ua, time }
- FieldAuditLog: line-by-line changes
- Hash linked to previous (tamper detection)
```

### B — SoD Violation Detection
```
- User has both: Create PR + Approve PR (conflict)
- SoD rule: "PR creator cannot approve same PR"
- System blocks at approval time
- OR: alert admin + require override
```

### C — Internal Audit
```
- Audit plan: Q1 2026 review of AP processes
- Auditor creates audit
- Tests defined (e.g., "verify all POs > 100K had approval")
- Sample 30 POs → checks
- Findings: 2 cases without proper approval
- Issues raised → assigned to AP manager
- Remediation 30 days → verified
```

### D — Compliance Audit
```
- ISO 27001 audit
- 50 controls reviewed
- Evidence collected (logs, configs, training records)
- Gaps identified → CAPA
- Audit report generated
- External auditor packet exported
```

### E — Privileged Access Review
```
- Quarterly: review users with admin rights
- 5 admins identified
- 1 left company → access removed
- 1 changed role → access reduced
- All changes logged
```

### F — Whistleblower Anonymous Report
```
- Employee submits anonymous report (suspected fraud)
- Encrypted submission
- Routed to compliance officer (not direct manager)
- Investigation initiated
- Resolution tracked confidentially
```

### G — Tamper Detection
```
- AuditLog daily integrity check (cron)
- Computes hashes against stored chain
- Any tampering → alert + lockdown
- Audit team notified immediately
```

### H — Policy Acknowledgement
```
- New policy released: "Data Privacy Policy v2"
- Required: all employees acknowledge within 14 days
- System sends emails + tracks
- Dashboard shows: 245/250 acknowledged, 5 pending
- Reminders sent
```

---

## 3. تدفق البيانات

```
[Audit Event]
On any CRUD operation:
   ↓ middleware captures: user, IP, UA, time, before/after
   ↓ append to AuditLog (with hash of previous)
   ↓ if sensitive entity → FieldAuditLog detail

[SoD Check]
Before allowing action:
   ↓ check user's roles
   ↓ check defined SoD rules
   ↓ if conflict → block or warn

[Tamper Check]
Cron daily:
   ↓ verify AuditLog hash chain
   ↓ if broken → alert + investigation
```

---

## 4. Schema (إضافات)

```prisma
model AuditLog {
  // ... existing
  id              BigInt    @id @default(autoincrement())
  userId          String?
  actorUserId     String?   // if admin acting on behalf
  
  action          String    // 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'POST' | 'CANCEL' | 'EXPORT' | etc.
  entityType      String
  entityId        String?
  
  before          Json?
  after           Json?
  diff            Json?     // computed diff
  
  ipAddress       String?
  userAgent       String?
  sessionId       String?
  requestId       String?
  
  metadata        Json?
  
  severity        String    @default("INFO")  // DEBUG | INFO | WARNING | CRITICAL
  category        String?   // 'SECURITY' | 'FINANCIAL' | 'DATA' | 'CONFIG' | etc.
  
  timestamp       DateTime  @default(now())
  
  // Tamper detection
  previousHash    String?
  hash            String?   // sha256 of (previousHash + content)
  
  @@index([userId, timestamp])
  @@index([entityType, entityId, timestamp])
  @@index([action, timestamp])
  @@index([severity, timestamp])
}

model FieldAuditLog {
  // ... existing
  id              BigInt    @id @default(autoincrement())
  auditLogId      BigInt
  
  entityType      String
  entityId        String
  
  fieldName       String
  oldValue        String?   @db.Text
  newValue        String?   @db.Text
  valueType       String    // 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'JSON'
  
  isSensitive     Boolean   @default(false)
  
  changedAt       DateTime  @default(now())
  changedByUserId String
  
  @@index([entityType, entityId])
}

model SodRule {
  id              Int       @id @default(autoincrement())
  ruleNumber      String    @unique
  name            String
  description     String?
  
  severity        String    // 'HIGH' | 'MEDIUM' | 'LOW'
  
  conflictingActions Json   // [actionA, actionB]
  // OR conflicting permissions
  conflictingPermissions String[]
  
  scope           String    @default("USER")  // USER | ROLE | ORGANIZATION
  applicableModules String[]
  
  enforcementMode String    @default("BLOCK")  // BLOCK | WARN | LOG_ONLY
  
  active          Boolean   @default(true)
  
  violations      SodViolation[]
}

model SodViolation {
  id              Int       @id @default(autoincrement())
  ruleId          Int
  rule            SodRule   @relation(fields: [ruleId], references: [id])
  
  userId          String
  detectedAt      DateTime  @default(now())
  
  context         Json      // what triggered
  
  status          String    @default("OPEN")  // OPEN | INVESTIGATED | OVERRIDDEN | RESOLVED | FALSE_POSITIVE
  resolution      String?
  
  reviewedByUserId String?
  reviewedAt      DateTime?
}

model InternalAudit {
  id              Int       @id @default(autoincrement())
  auditNumber     String    @unique
  title           String
  
  scope           String    @db.Text
  objectives      String?   @db.Text
  
  type            String    // 'FINANCIAL' | 'OPERATIONAL' | 'COMPLIANCE' | 'IT' | 'INVESTIGATION'
  framework       String?   // 'COSO' | 'ISO_27001' | 'SOX' | 'PCI_DSS' | 'PDPL'
  
  startDate       DateTime
  endDate         DateTime?
  
  leadAuditorUserId String
  auditorIds      String[]
  
  status          String    @default("PLANNING")  // PLANNING | FIELDWORK | REPORTING | COMPLETED | FOLLOW_UP
  
  testProcedures  AuditTestProcedure[]
  findings        AuditFinding[]
  
  finalReportUrl  String?
}

model AuditTestProcedure {
  id              Int       @id @default(autoincrement())
  auditId         Int
  audit           InternalAudit @relation(fields: [auditId], references: [id])
  
  name            String
  description     String    @db.Text
  controlReference String?
  
  sampleSize      Int?
  populationSize  Int?
  
  result          String?   // 'EFFECTIVE' | 'NEEDS_IMPROVEMENT' | 'INEFFECTIVE'
  evidenceUrls    String[]
  notes           String?   @db.Text
  
  performedByUserId String?
  performedAt     DateTime?
}

model AuditFinding {
  id              Int       @id @default(autoincrement())
  findingNumber   String    @unique
  auditId         Int
  audit           InternalAudit @relation(fields: [auditId], references: [id])
  
  severity        String    // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OBSERVATION'
  category        String
  
  observation     String    @db.Text
  rootCause       String?   @db.Text
  recommendation  String    @db.Text
  managementResponse String? @db.Text
  
  responsibleEmployeeId Int?
  targetDate      DateTime?
  
  status          String    @default("OPEN")  // OPEN | IN_PROGRESS | REMEDIATED | VERIFIED | CLOSED
  
  remediatedAt    DateTime?
  verifiedAt      DateTime?
  verifiedByUserId String?
  
  capaId          Int?
}

model Risk {
  id              Int       @id @default(autoincrement())
  riskCode        String    @unique
  
  category        String    // 'STRATEGIC' | 'OPERATIONAL' | 'FINANCIAL' | 'COMPLIANCE' | 'IT' | 'REPUTATIONAL'
  description     String    @db.Text
  
  // Inherent
  inherentLikelihood Int    // 1-5
  inherentImpact  Int       // 1-5
  inherentScore   Int       // L × I
  
  // Residual (after controls)
  residualLikelihood Int    // 1-5
  residualImpact  Int       // 1-5
  residualScore   Int
  
  // Treatment
  treatment       String    // 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID'
  controls        String[]
  
  ownerEmployeeId Int
  
  status          String    @default("OPEN")  // OPEN | UNDER_TREATMENT | MONITORED | CLOSED
  
  reviewFrequency String    @default("QUARTERLY")
  lastReviewedAt  DateTime?
  nextReviewDate  DateTime?
}

model Policy {
  id              Int       @id @default(autoincrement())
  policyNumber    String    @unique
  title           String
  
  category        String    // 'HR' | 'FINANCE' | 'IT' | 'OPERATIONS' | 'COMPLIANCE' | 'SECURITY'
  
  version         Int
  status          String    @default("DRAFT")  // DRAFT | UNDER_REVIEW | APPROVED | ACTIVE | ARCHIVED
  
  effectiveFrom   DateTime?
  effectiveTo     DateTime?
  
  contentUrl      String
  
  requiresAcknowledgement Boolean @default(false)
  applicableRoles String[]
  
  approvedByUserId String?
  approvedAt      DateTime?
  
  acknowledgements PolicyAcknowledgement[]
}

model PolicyAcknowledgement {
  id              Int       @id @default(autoincrement())
  policyId        Int
  policy          Policy    @relation(fields: [policyId], references: [id])
  
  employeeId      Int
  acknowledgedAt  DateTime  @default(now())
  ipAddress       String?
}

model WhistleblowerReport {
  id              Int       @id @default(autoincrement())
  reportNumber    String    @unique  // anonymous
  
  category        String    // 'FRAUD' | 'HARASSMENT' | 'SAFETY' | 'COMPLIANCE' | 'OTHER'
  
  description     String    @db.Text  // encrypted at rest
  evidenceUrls    String[]
  
  reporterIdentity String?  // null = anonymous (one-way encrypted reference)
  
  receivedAt      DateTime  @default(now())
  
  assignedToUserId String?
  status          String    @default("RECEIVED")  // RECEIVED | INVESTIGATING | SUBSTANTIATED | UNSUBSTANTIATED | CLOSED
  
  resolution      String?   @db.Text
  closedAt        DateTime?
  
  // Confidentiality
  accessibleByUserIds String[]  // restricted access
}

model TamperCheck {
  id              Int       @id @default(autoincrement())
  checkDate       DateTime  @default(now())
  
  recordsChecked  BigInt
  brokenChainsDetected Int
  
  status          String    // 'CLEAN' | 'INTEGRITY_BREACH' | 'IN_PROGRESS'
  
  details         Json?
  
  alertedAt       DateTime?
  resolvedAt      DateTime?
}
```

---

## 5. Forms (8)

A: SoD Rule Definition
B: Internal Audit Plan
C: Test Procedure
D: Audit Finding (with recommendation)
E: Risk Register Entry
F: Policy Editor
G: Whistleblower Report (public)
H: Compliance Framework Mapping

---

## 6. Tables (8)

A: Audit Log Viewer (with filters)
B: Field Audit Trail
C: SoD Rules + Violations
D: Internal Audits
E: Findings (open + closed)
F: Risk Register (heat map)
G: Policies + Acknowledgements
H: Privileged Access Review

---

## 7. Buttons (30+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-audit-log-search | بحث | ⬜ auditor |
| btn-audit-log-export | تصدير | ⬜ auditor |
| btn-audit-log-tamper-check | فحص التلاعب | ⬜ super admin |
| btn-sod-rule-create | + قاعدة SoD | 🟢 governance |
| btn-sod-rule-toggle | تفعيل/تعطيل | 🟡 governance |
| btn-sod-violation-investigate | تحقيق | 🟦 governance |
| btn-sod-violation-override | تجاوز | 🔴 cfo + reason |
| btn-sod-violation-resolve | حل | 🟢 governance |
| btn-audit-create | + تدقيق | 🟢 audit mgr |
| btn-audit-add-procedure | + إجراء اختبار | 🟢 auditor |
| btn-audit-perform | تنفيذ | 🟦 auditor |
| btn-audit-finding-create | + ملاحظة | 🟢 auditor |
| btn-finding-assign | إسناد | 🟦 audit mgr |
| btn-finding-mark-remediated | تسجيل المعالجة | 🟢 owner |
| btn-finding-verify | التحقق من المعالجة | 🟢 audit mgr |
| btn-finding-close | إغلاق | 🟢 audit mgr |
| btn-risk-add | + مخاطرة | 🟢 risk mgr |
| btn-risk-assess | تقييم | 🟦 risk owner |
| btn-risk-treat | إجراء معالجة | 🟡 risk owner |
| btn-risk-monitor | مراقبة | ⬜ risk mgr |
| btn-policy-create | + سياسة | 🟢 governance |
| btn-policy-approve | اعتماد | 🟢 ceo |
| btn-policy-publish | نشر | 🟢 governance |
| btn-policy-archive | أرشفة | 🟡 governance |
| btn-policy-acknowledge | تأكيد قراءة | 🟢 employee |
| btn-policy-track-acknowledgements | تتبع التأكيدات | ⬜ governance |
| btn-whistleblower-submit | بلاغ سري | 🟢 anyone (public) |
| btn-whistleblower-investigate | تحقيق | 🟦 compliance officer |
| btn-whistleblower-close | إغلاق | 🟢 compliance officer |
| btn-privileged-review-quarterly | مراجعة ربع سنوية | ⬜ super admin |
| btn-export-grc-dashboard | تصدير GRC | ⬜ ceo |
| btn-compliance-framework-export | تصدير framework | ⬜ auditor |

---

## 8. Search & Filters

- Audit log: user, action, entity, date range, severity, category, IP
- SoD: severity, status, user, rule
- Audits: status, framework, lead, date range
- Findings: severity, status, owner, age
- Risks: category, score range, status

---

## 9. Reports

- Audit Trail (full)
- SoD Violations Summary
- Internal Audit Status
- Findings Dashboard
- Remediation Aging
- Risk Heat Map
- Risk Trend
- Policy Compliance %
- Privileged Access Inventory
- Tamper Check History
- Whistleblower Stats
- Compliance Framework Coverage

---

## 10. Dashboards

- KPIs: Open Findings / High Risks / SoD Violations / Policy Acknowledgement %
- Charts: Risk heat map, Findings aging, Audit status
- Lists: Critical findings, Policies pending acknowledgement

---

## 11. Notifications

- SoD violation detected
- Audit assigned
- Finding due date approaching
- Policy requires acknowledgement
- Risk review overdue
- Tamper detected (CRITICAL)
- Whistleblower report received

---

## 12. Permissions

| Action | Employee | Auditor | Audit Mgr | Compliance | CFO |
|--------|----------|---------|-----------|-----------|-----|
| View own audit log | ✓ | ✓ | ✓ | ✓ | ✓ |
| View all audit log | ✗ | ✓ | ✓ | ✓ | ✓ |
| Conduct audit | ✗ | ✓ | ✓ | ✓ | ✓ |
| Create finding | ✗ | ✓ | ✓ | ✓ | ✓ |
| Verify remediation | ✗ | ✓ | ✓ | ✓ | ✓ |
| Manage SoD rules | ✗ | ✗ | ✗ | ✓ | ✓ |
| Override SoD | ✗ | ✗ | ✗ | ✗ | ✓ |
| Risk assess | ✓ owner | ✗ | ✓ | ✓ | ✓ |
| Approve policy | ✗ | ✗ | ✗ | ✗ | ✓ |
| Submit whistleblower | ✓ anonymous | ✓ | ✓ | ✓ | ✓ |

---

## 13. Integrations

- ServiceNow GRC
- AuditBoard
- LogRhythm SIEM
- Splunk
- AWS CloudTrail
- ISO 27001 toolkit

---

## 14. Shortcuts

- `Ctrl+Shift+A` Audit log
- `Ctrl+Shift+R` Risk register

---

## 15. Mobile / Print

- Mobile: policy acknowledgement
- Print: audit reports, finding letters, risk register

---

## 16. Audit (meta)

- All audit actions are themselves audited (no super-user above audit log)
- Hash chain verifies integrity
- Daily backup of audit logs (immutable storage)

---

## 17. Tests

```typescript
describe('AuditLog Hash Chain', () => { /* tamper detection */ })
describe('SoD Enforcement', () => { /* block, warn, log modes */ })
describe('Audit Workflow', () => { /* plan → fieldwork → reporting */ })
describe('Risk Calc', () => { /* L × I */ })
describe('Policy Acknowledgement', () => { /* tracking, deadlines */ })
describe('Whistleblower', () => { /* anonymity, encryption */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| Audit log overflow | rotate to cold storage |
| User deleted | preserve historical audit |
| SoD rule changes mid-action | use rule at action time |
| Policy unacknowledged user | block sensitive actions |
| Anonymous whistleblower with bad faith | review process |
| Tamper detected | lockdown + notify board |

---

**نهاية #28** • 8 سيناريوهات • 11 جداول • 8 forms • 8 grids • 32 button • 12 reports
