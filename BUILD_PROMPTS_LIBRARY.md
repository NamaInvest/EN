# Namasoft ERP — Build Prompts Library

> **Generated:** 2026-05-05
> **Purpose:** فحص شامل للتطبيق + قائمة بكل الأقسام الناقصة + برومنت جاهز + سيناريو + فلو بيانات لكل ميزة.
> **النطاق:** مقارنة بـ SAP S/4HANA, Oracle Fusion, NetSuite, Odoo + Saudi compliance (ZATCA, GOSI, WPS, SOCPA).
> **الاستخدام:** انسخ "READY PROMPT" لأي ميزة وألصقه في Claude Code لتنفيذها.

---

## PART 0 — Executive Inventory

### 0.1 ما هو موجود (Built)

| الطبقة | العدد | الوصف |
|--------|------|-------|
| Prisma Models | **362** | تغطية ممتازة، تفوق SAP في عدد الجداول |
| API Route Groups | **111** | معظم الموديولات لها endpoints |
| Dashboard Pages | **82** | ضمن `src/app/(dashboard)/` |
| V3 Verticals | **10** | clinic, construction, distribution, manufacturing, master, realestate, restaurant, retail, school, services |
| Reports | **14** | budget variance, cashflow, consolidation, customer statement, allocations, fraud-ai, expiry, ZATCA VAT |

### 0.2 الخريطة الموجزة (Module → Status)

| Domain | UI | API | Schema | الفجوة الأساسية |
|--------|----|----|--------|-----------------|
| Sales / AR | 🟢 wired | 🟢 wired | 🟢 13 models | pricing engine, commissions approval, RMA, credit limit enforcement |
| Purchases / AP | 🟡 partial | 🟢 wired | 🟢 18 models | RFQ portal, vendor scorecard, contract lifecycle, landed cost UI |
| Inventory | 🟡 partial | 🟢 wired | 🟢 19 models | FEFO, ABC, cycle count, putaway rules, variant selector |
| Manufacturing | 🟡 partial | 🟢 wired | 🟢 23 models | BOM versioning UI, capacity Gantt, OEE, scrap tracking |
| HR / Payroll | 🟡 partial | 🟢 wired | 🟢 20 models | org chart, succession, performance 360, recruitment |
| Accounting | 🟢 wired | 🟢 wired | 🟢 25+ models | intercompany elimination, multi-book recon, allocation rules UI |
| Finance | 🟡 partial | 🟢 wired | 🟢 15+ models | cash flow forecasting, dunning workflow, payment run approval, ECL automation |
| Assets | 🟡 partial | 🟢 wired | 🟢 12 models | maintenance scheduling, disposal workflow, lifecycle UI |
| CRM | 🔴 shell | 🟡 partial | 🟡 6 models | lead scoring, kanban, campaigns, customer portal |
| Projects | 🔴 shell | 🔴 minimal | 🔴 4 models | WBS, cost codes, progress billing, resource scheduling |
| Quality | 🟡 partial | 🟡 partial | 🟡 7 models | NCR workflow, CAPA, SPC charts |
| Restaurant | 🟡 partial | 🟡 partial | 🟢 wired | table mgmt, reservations, course-firing, allergens |
| Retail | 🟡 partial | 🟡 partial | 🟢 wired | layaway, gift receipt, customer display, loyalty redemption |
| Clinic | 🔴 shell | 🔴 shell | 🔴 1 model | appointments, e-Rx, lab, ICD-10, insurance claims |
| School | 🔴 shell | 🔴 shell | 🔴 1 model | gradebook, transcript, parent portal, exams |
| Construction | 🔴 shell | 🔴 shell | 🟡 partial | variation orders, retention, progress billing, cost codes |
| Real Estate | 🟡 partial | 🟡 partial | 🟢 12 models | CAM reconciliation, escalations, tenant portal |
| Distribution | 🔴 shell | 🔴 shell | 🟡 partial | wave picking, cross-docking, route optimization |
| Services | 🔴 shell | 🔴 shell | 🟡 partial | work order, SLA, billing rates, project WBS |

**Legend:** 🟢 ready, 🟡 partial, 🔴 shell only

---

## PART 1 — TIER 1: Cross-cutting Foundations

> هذه الميزات تخدم **كل الموديولات** — يجب بناؤها أولاً.

### 1.1 Approval Workflow Inbox UI

**Problem:** `ApprovalRule` و `ApprovalRequest` موجودان في schema لكن لا يوجد inbox للمستخدم لرؤية الطلبات.

**Target paths:**
- `src/app/(dashboard)/approvals/inbox/page.tsx`
- `src/app/api/approvals/inbox/route.ts`
- `src/app/api/approvals/[id]/approve/route.ts`
- `src/app/api/approvals/[id]/reject/route.ts`

**Tables:**
| Column | Type | Source |
|--------|------|--------|
| Document Type | enum | ApprovalRequest.documentType (PO, JE, Invoice, Vendor, Leave) |
| Document # | text | linked entity ref |
| Submitted By | user | submittedById |
| Amount | decimal | totalAmount (from linked doc) |
| Submitted At | datetime | createdAt |
| Step | text | currentStep / totalSteps |
| Status | badge | PENDING / APPROVED / REJECTED |
| SLA | countdown | dueAt - now |

**Forms / Modals:**
- **Approve Modal:** comment textarea (optional), e-signature checkbox, "Approve" button.
- **Reject Modal:** reason dropdown (مع enum: insufficient docs / over budget / unauthorized / other), comment (required), "Reject" button.
- **Delegate Modal:** select user dropdown, expiry date, "Delegate" button.

**Buttons:** [Approve] [Reject] [Delegate] [View Document] [Comment History] [Export]

**Search Filters:** Document Type, Submitted By, Date Range, Amount Range, Status, Priority.

**Tabs:** `Pending (me)` | `Pending (delegated)` | `Approved` | `Rejected` | `All`

**Data Flow:**
```
User opens /approvals/inbox
  → GET /api/approvals/inbox?userId={current}&status=PENDING
  → returns ApprovalRequest[] joined with linked document summary
User clicks [Approve]
  → POST /api/approvals/{id}/approve { comment, signature }
  → server: 
     1. Verify user is current approver in ApprovalRule.steps[currentStep]
     2. Insert ApprovalAction { requestId, action: APPROVED, userId, comment, signedAt }
     3. If currentStep == totalSteps:
        - Set ApprovalRequest.status = APPROVED
        - Trigger downstream action (e.g. PO.status = APPROVED, JE.status = POSTED)
        - Call auto-journal if applicable (e.g., post JE)
     4. Else: increment currentStep, notify next approver
  → Email/Push to next approver
```

**Auto-Journal:** none (delegated to downstream document type).

**Acceptance:**
- ✅ Multi-step approval (sequential and parallel)
- ✅ Out-of-office delegation respected
- ✅ Audit trail in ApprovalAction
- ✅ Mobile-responsive inbox
- ✅ Email notification on assignment

**READY PROMPT:**
```
بناء Approval Workflow Inbox للنظام:
1. صفحة src/app/(dashboard)/approvals/inbox/page.tsx مع 5 tabs (Pending/Delegated/Approved/Rejected/All) وجدول كولن: Doc Type, Doc#, Submitter, Amount, Submitted At, Step (current/total), Status, SLA countdown
2. POST /api/approvals/[id]/approve يتحقق من ApprovalRule.steps[currentStep], ينشئ ApprovalAction, ويرفع currentStep أو يحدث status=APPROVED ويطلق downstream (JE.post, PO.activate)
3. POST /api/approvals/[id]/reject يحدث status=REJECTED ويعكس لو كان أي شيء preliminary
4. POST /api/approvals/[id]/delegate ينشئ Delegation record
5. أزرار [Approve] [Reject] [Delegate] [View Doc] [History]
6. فلاتر: type, submitter, dateRange, amountRange, status
7. SLA: لو فات dueAt ضع badge أحمر "OVERDUE"
8. اربط بـ ApprovalRule و ApprovalRequest و ApprovalAction من schema
9. لا تكسر auto-journal — استدع approveDocument(docType, docId) المخصصة لكل نوع
10. اكتب test في __tests__/approvals/inbox.test.ts
```

---

### 1.2 Budget vs Actual Variance Dashboard

**Problem:** `Budget`, `BudgetLine`, `Encumbrance` موجودة، لكن لا يوجد UI للمقارنة budget vs actual بـ drill-down.

**Target:** `src/app/(dashboard)/finance/budget-control/variance/page.tsx`

**Tables:**
| Column | Type |
|--------|------|
| Account / Cost Center | hierarchical |
| Period | YYYY-MM |
| Budget | decimal |
| Actual | decimal (sum of JournalEntryLine) |
| Encumbered | decimal (sum of Encumbrance.amount) |
| Available | budget - actual - encumbered |
| Variance | actual - budget |
| Variance % | (actual - budget) / budget |
| Status | badge (UNDER / ON_TARGET / OVER / OVER_LIMIT) |

**Forms:** None (read-only dashboard).

**Buttons:** [Drill-down] [Export Excel] [Export PDF] [Refresh] [Compare Periods]

**Search Filters:** Period range, Department, Cost Center, Account class, Variance threshold (>10%, >20%), Status.

**Tabs:** `By Account` | `By Cost Center` | `By Department` | `By Project` | `Encumbrances`

**Data Flow:**
```
Page loads → GET /api/finance/budget/variance?period=2026-Q2&dimension=cost_center
Server:
  1. Fetch Budget for period and dimension
  2. Aggregate JournalEntryLine WHERE accountId IN budget.accounts AND date IN period
  3. Aggregate Encumbrance WHERE costCenterId AND status='OPEN'
  4. Compute variance = actual + encumbered - budget
  5. Return drill-down ready tree
Click row → GET /api/finance/budget/variance/[accountId]/transactions?period=...
  → returns underlying JournalEntryLine list with descriptions
```

**Auto-Journal:** none.

**Acceptance:**
- ✅ Budget vs Actual at account, CC, dept, project levels
- ✅ Encumbrance included in available calc
- ✅ Drill-through to JE lines
- ✅ Color-coded (red >120%, yellow 100-120%, green <100%)
- ✅ Excel export with formulas

**READY PROMPT:**
```
بناء Budget vs Actual Variance Dashboard:
1. Route: src/app/(dashboard)/finance/budget-control/variance/page.tsx
2. API: GET /api/finance/budget/variance?period=&dimension=
   - يقرأ Budget + BudgetLine للفترة
   - يجمع JournalEntryLine.amount مفلتر بـ accountId و period (تجاهل DRAFT/REJECTED)
   - يجمع Encumbrance.amount حيث status=OPEN
   - يرجع: { account, costCenter, budget, actual, encumbered, available, variance, variancePct }
3. UI: جدول هرمي (TanStack Table) بـ 5 tabs (Account/CostCenter/Dept/Project/Encumbrances)
4. خانات: Account, Period, Budget, Actual, Encumbered, Available, Variance, Variance%, Status
5. ألوان: variance% > 20% أحمر، 0-20% أصفر، <0 أخضر
6. أزرار: [Drill-down] (modal بـ JE lines)، [Export Excel]، [Export PDF]، [Compare Periods]
7. فلاتر: period range, dept, CC, account class, variance threshold
8. اكتب test integration في __tests__/finance/variance.test.ts يتحقق من حسبة encumbrance + actual
```

---

### 1.3 Field-Level Audit Trail Reporting

**Problem:** `AuditLog` موجود لكن بدون UI للمقارنة قبل/بعد.

**Target:** `src/app/(dashboard)/audit-logs/page.tsx`

**Tables:**
| Column | Type |
|--------|------|
| Timestamp | datetime |
| User | user |
| Action | enum (CREATE/UPDATE/DELETE/POST/REVERSE) |
| Entity | text (e.g., Invoice) |
| Entity ID | uuid |
| Field | text (for UPDATE) |
| Old Value | text |
| New Value | text |
| IP | text |
| Tenant | text |

**Buttons:** [Export CSV] [View Diff] [Filter] [Replay] (admin only)

**Search Filters:** User, Entity Type, Action, Date Range, IP, Field Name, "Changes only".

**Data Flow:**
```
GET /api/audit-logs?entityType=Invoice&entityId=...&date=...
Returns: AuditLog[] with prev/next snapshots
Click [View Diff] → modal with side-by-side JSON diff highlighting changed fields
```

**READY PROMPT:**
```
بناء Audit Trail Reporting UI:
1. صفحة src/app/(dashboard)/audit-logs/page.tsx
2. API GET /api/audit-logs مع pagination, filters: user, entityType, action, dateRange, fieldName
3. جدول: Timestamp, User, Action, Entity, EntityID, Field, OldValue, NewValue, IP
4. زر [View Diff] يفتح modal بـ JSON-diff (jsondiffpatch library) — قبل ↔ بعد
5. زر [Export CSV] للتحميل
6. اربط بـ AuditLog model، تأكد من tenant isolation
7. أضف middleware src/lib/audit-middleware.ts يلتقط diff عند Prisma mutations لكل model مهم (Invoice, JE, PO, Vendor, Customer, Employee, Asset)
8. test في __tests__/audit/audit-log.test.ts
```

---

### 1.4 Custom Fields Form Builder UI

**Problem:** `CustomFieldDefinition` موجود لكن بدون UI لإضافة fields.

**Target:** `src/app/(dashboard)/settings/custom-fields/page.tsx`

**Tables:** قائمة CustomFieldDefinition مع: entity, label (ar/en), type, required, defaultValue, validation, isActive.

**Forms:**
- **Add Field Modal:**
  - Entity selector (Invoice, Vendor, Customer, Product, Employee, JE)
  - Label AR / Label EN
  - Type (text, number, date, boolean, dropdown, multiselect, file, formula)
  - Validation rules (regex, min/max, required)
  - Default value
  - Position (drag-drop)
  - Permissions (which roles can edit/view)

**Buttons:** [Add Field] [Edit] [Deactivate] [Reorder] [Test]

**Data Flow:**
```
Admin adds field → POST /api/settings/custom-fields { entity, label, type, ... }
Form pages dynamically fetch GET /api/settings/custom-fields?entity=Invoice
Then render extra inputs that save to CustomFieldValue { definitionId, entityId, value }
```

**READY PROMPT:**
```
بناء Custom Fields Builder:
1. UI: src/app/(dashboard)/settings/custom-fields/page.tsx بـ drag-drop reorder
2. CRUD API: src/app/api/settings/custom-fields/route.ts و [id]/route.ts
3. Hook: src/hooks/use-custom-fields.ts يأخذ entity ويرجع field definitions + values
4. Helper: src/components/custom-field-renderer.tsx يستقبل definition + value و يعرض الinput المناسب (text/number/date/select/multiselect/file/formula)
5. Validation: zod schema يُبنى dynamically من definitions
6. اربط بـ CustomFieldDefinition + CustomFieldValue
7. أضف field renderer في 8 entities: Invoice, Vendor, Customer, Product, Employee, JE, PO, Asset
8. test يتحقق من validation rules
```

---

### 1.5 Period Close Checklist Engine

**Problem:** `PeriodCloseChecklist` موجود بدون UI tracker.

**Target:** `src/app/(dashboard)/accounting/period-close/page.tsx`

**Tables:**
| Step | Owner | Due | Status | Blocker |
|------|-------|-----|--------|---------|
| 1. Reconcile bank | AR Lead | day-2 | ✅ DONE | - |
| 2. Recon AR aging | AR Lead | day-3 | 🟡 IN_PROGRESS | - |
| 3. Recon AP aging | AP Lead | day-3 | ⏳ PENDING | - |
| 4. Run depreciation | Asset Acc | day-4 | ⏳ PENDING | - |
| 5. FX revaluation | Treasury | day-5 | ⏳ PENDING | - |
| 6. Accruals | Senior Acc | day-5 | ⏳ PENDING | step 4 |
| 7. Inventory cutoff | Inv Mgr | day-5 | ⏳ PENDING | - |
| 8. Variance review | Controller | day-6 | ⏳ PENDING | step 6 |
| 9. Lock period | CFO | day-7 | 🔒 LOCKED | all above |

**Buttons:** [Start Close] [Mark Complete] [Reopen] [Add Note] [Lock Period] (CFO only)

**Data Flow:**
```
[Start Close] → creates PeriodCloseChecklist for fiscal period with default 9 steps
Step done → PATCH /api/accounting/period-close/{id}/step/{stepId} { status: DONE }
[Lock Period] → POST /api/accounting/period-close/{id}/lock
  → server validates all steps DONE
  → sets FiscalPeriod.status = CLOSED
  → blocks any JE in that period
```

**READY PROMPT:**
```
بناء Period Close Checklist:
1. صفحة src/app/(dashboard)/accounting/period-close/page.tsx
2. عند [Start Close] أنشئ PeriodCloseChecklist بـ 9 خطوات (template في src/lib/period-close-template.ts)
3. لكل خطوة assignedTo, dueDate, status, dependencies, autoCheck function
4. autoCheck: لخطوة "Reconcile bank" يفحص لو كل BankAccount.lastReconciledAt = period end
5. زر [Lock Period] (CFO فقط) يستدعي POST /api/accounting/fiscal-periods/[id]/lock — يتحقق ALL steps = DONE وإلا 422
6. لما period = CLOSED، POST /api/accounting/journal/create يرفض لو entryDate ضمن CLOSED period
7. UI progress bar شامل + breakdown per step مع SLA
8. notification system: لو خطوة overdue، email لـ ownerId
9. test يحاول إنشاء JE في فترة مغلقة ويتوقع 422
```

---

### 1.6 Numbering Sequences Engine

**Problem:** كل موديول يولد رقمه بطريقته الخاصة (race conditions ممكنة).

**Target:** `src/lib/numbering.ts` + UI في `src/app/(dashboard)/settings/numbering/page.tsx`

**Schema add:**
```prisma
model NumberingSequence {
  id          String  @id @default(cuid())
  tenantId    String
  documentType String // INVOICE, PO, GRN, JE, ...
  prefix      String
  format      String  // e.g. "INV-{YYYY}-{####}"
  current     Int
  resetPolicy String  // YEARLY, MONTHLY, NEVER
  lastReset   DateTime
  isActive    Boolean
  @@unique([tenantId, documentType])
}
```

**Tables:** documentType, prefix, format, current value, last reset, status.

**Buttons:** [Add Sequence] [Edit] [Reset] [Preview Next 5]

**Data Flow:**
```
Any module needing a number calls:
  const num = await getNextNumber(tx, tenantId, 'INVOICE')
  // Internally uses SERIALIZABLE transaction:
  //  SELECT FOR UPDATE NumberingSequence
  //  apply resetPolicy
  //  increment current
  //  format using template
  //  return formatted string
```

**READY PROMPT:**
```
بناء Numbering Sequences Engine:
1. أضف model NumberingSequence في prisma/schema.prisma
2. اكتب src/lib/numbering.ts مع function getNextNumber(tx, tenantId, docType): Promise<string>
   - يستخدم SERIALIZABLE isolation
   - SELECT FOR UPDATE NumberingSequence WHERE tenantId AND documentType
   - يطبق resetPolicy (YEARLY: لو year != year(lastReset) reset to 1)
   - increment current, format باستخدام {YYYY}, {MM}, {####}, {prefix}
3. UI صفحة src/app/(dashboard)/settings/numbering/page.tsx CRUD مع preview
4. استبدل كل أماكن توليد الأرقام (Invoice, PO, JE, GRN, Asset, Employee, Customer, Vendor) لتستدعي getNextNumber
5. seed افتراضي لـ 15 documentTypes
6. test concurrent: 100 requests بالتوازي تنتج 100 رقم متسلسل بدون duplicates
```

---

### 1.7 Document State Machine

**Problem:** Documents تنتقل بين statuses بدون validation موحد.

**Target:** `src/lib/state-machine.ts` + per-entity transitions.

**State definitions:**
```typescript
const InvoiceStateMachine = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED', 'DRAFT'],
  APPROVED: ['POSTED', 'CANCELLED'],
  POSTED: ['PAID', 'PARTIAL_PAID', 'CANCELLED'],
  PAID: ['REVERSED'],
  CANCELLED: [],
  REVERSED: [],
}
```

**READY PROMPT:**
```
بناء Document State Machine:
1. اكتب src/lib/state-machine.ts مع class StateMachine<T> لـ generic transitions
2. عرّف states لـ: Invoice, JE, PO, GRN, MO, Asset, Check, Leave, Vendor, Customer
3. كل entity API route يستدعي machine.transition(currentState, targetState, userId, reason)
   - يرمي 400 لو transition غير مسموح
   - ينشئ DocumentStateLog { entityType, entityId, fromState, toState, userId, reason, at }
4. UI badge component يقرأ allowed transitions ويعرض الأزرار المسموحة فقط
5. لا يسمح بحذف document بحالة POSTED — فقط reverse
6. test كل transitions غير المسموحة
```

---

### 1.8 Role-Based Field Permissions UI

**Problem:** `RoleFieldPermission` موجود بدون assignment UI.

**Target:** `src/app/(dashboard)/settings/permissions/fields/page.tsx`

**Tables:** matrix Role × Entity × Field → Read/Write/Hidden.

**READY PROMPT:**
```
بناء Field-Level Permissions UI:
1. Matrix UI src/app/(dashboard)/settings/permissions/fields/page.tsx
2. axes: rows = roles, columns = (entity, field), cell = dropdown READ|WRITE|HIDDEN
3. CRUD API لـ RoleFieldPermission
4. middleware src/lib/field-permission.ts يفلتر response objects قبل إرسالها للـ client بناء على role
5. اطبقه على 5 entities: Salary, Margin, Cost, BankAccount, EmployeePersonalInfo
6. test: مستخدم بـ role=AR_CLERK لا يرى Salary.amount في Employee response
```

---

## PART 2 — Sales / AR

### 2.1 Pricing Engine UI (Tiered + Volume + Customer-specific)

**Problem:** لا يوجد rules engine للأسعار.

**Target:** `src/app/(dashboard)/sales/pricing/page.tsx`

**Schema add:**
```prisma
model PriceList {
  id String @id @default(cuid())
  name String
  currency String
  validFrom DateTime
  validTo   DateTime?
  customerId String? // null = generic
  customerCategoryId String?
  channelId String? // POS, Online, Wholesale
  rules PriceRule[]
}
model PriceRule {
  id String @id @default(cuid())
  priceListId String
  productId String?
  productCategoryId String?
  minQty Decimal @db.Decimal(18,4)
  maxQty Decimal? @db.Decimal(18,4)
  unitPrice Decimal @db.Decimal(18,4)
  discountPct Decimal? @db.Decimal(8,4)
  formula String? // e.g. "cost * 1.25"
}
```

**Tables:** PriceList grid مع اسم، عملة، صلاحية، عميل/قناة، rule count.

**Forms:**
- New PriceList: name, currency, validFrom/To, customer scope
- New Rule: product/category, qty range, unit price OR discount% OR formula

**Buttons:** [New List] [Add Rule] [Test Pricing] [Clone] [Export]

**Data Flow:**
```
On invoice line entry → POST /api/sales/pricing/calculate
  { customerId, productId, qty, channel, date }
  → server: 
     1. Find applicable PriceLists (matching customer/category/channel + date range)
     2. Order by priority (customer-specific > category > generic)
     3. Find matching PriceRule (product + qty bracket)
     4. If formula → eval safely (whitelist tokens: cost, list, qty, weight)
     5. Return { unitPrice, discountPct, sourceRuleId }
Cache for performance.
```

**Auto-Journal:** none directly (used by invoice posting).

**READY PROMPT:**
```
بناء Pricing Engine:
1. أضف PriceList + PriceRule في schema
2. UI src/app/(dashboard)/sales/pricing/page.tsx — قائمة PriceLists + tabs (Generic/Customer/Channel/Promotional)
3. New List Modal: name, currency, validFrom, validTo, customerId?, channelId?
4. New Rule Modal: productId/categoryId, minQty, maxQty, unitPrice OR discountPct OR formula
5. زر [Test Pricing] modal: enter customerId+productId+qty → يعرض النتيجة + التراتبية (which list/rule won)
6. API POST /api/sales/pricing/calculate يستخدم في sales-orders + invoices + POS
7. Cache بـ Redis لـ 5 دقائق per (customerId, productId, qty bucket)
8. formula evaluator src/lib/safe-formula.ts (whitelist functions)
9. test: customer-specific overrides category overrides generic
```

---

### 2.2 Customer Credit Limit Enforcement

**Target:** `src/lib/credit-check.ts` + UI in customer card.

**Schema:** Customer.creditLimit, Customer.creditTermsDays موجودة.

**Tables / UI on customer page:**
- Credit Card: limit, used (sum of unpaid invoices), available, days outstanding, score.
- Aging: 0-30 / 31-60 / 61-90 / 91+
- Past due alerts.

**Buttons on Customer:** [Set Limit] [Hold] [Release Hold] [Request Increase]

**Data Flow:**
```
Before invoice POST:
  → checkCredit(customerId, newAmount)
  → server:
     used = SUM(invoice.totalAmount - invoice.paidAmount) WHERE status NOT IN [PAID, CANCELLED]
     pendingPO = SUM(salesOrder.totalAmount) where status APPROVED but not invoiced
     totalExposure = used + pendingPO + newAmount
     if totalExposure > customer.creditLimit:
        - if user has bypass permission → log + warn
        - else → 422 "Credit limit exceeded"
     if customer.status = ON_HOLD → 422 "Customer on hold"
```

**READY PROMPT:**
```
بناء Credit Limit Enforcement:
1. اكتب src/lib/credit-check.ts: checkCredit(tx, customerId, additionalAmount)
2. middleware في src/app/api/sales/invoices/route.ts و sales-orders/route.ts يستدعي checkCredit
3. response 422 + reason لو تجاوز
4. permission "credit.bypass" يسمح للمدير المالي override + log
5. UI: في Customer detail page أضف Credit Card مع limit/used/available/score + aging buckets
6. زر [Hold/Release Hold] يحدث customer.status
7. زر [Request Increase] يفتح approval workflow (يستخدم Tier1.1)
8. test: محاولة فاتورة تتجاوز credit limit ترجع 422
9. test: مستخدم بصلاحية bypass ينجح مع log
```

---

### 2.3 Sales Commission Approval & Payout

**Target:** `src/app/(dashboard)/sales/commissions/page.tsx`

**Tables:** sales rep, period, base, %, calculated, status (PENDING/APPROVED/PAID), payout date.

**Buttons:** [Calculate Period] [Approve] [Reject] [Pay] [Reverse] [Export to Payroll]

**Data Flow:**
```
[Calculate Period] → POST /api/sales/commissions/calculate { period, ruleId? }
  → for each sales rep:
     - Sum invoices.netAmount where invoice.salesRepId AND status IN [POSTED, PAID]
     - Apply CommissionRule (tiered: 5% < 100k, 8% > 100k)
     - Subtract returns (SalesReturn.amount)
     - Insert CommissionRecord { repId, period, base, rate, amount, status: PENDING }
[Approve] → CommissionRecord.status = APPROVED → triggers approval workflow
[Pay] → integrates with payroll: creates PayrollAdjustment OR Bonus on next payroll run
       → posts JE: Dr Sales Commission Expense, Cr Commission Payable
[Reverse] → if invoice cancelled, recalculate and reverse
```

**Auto-Journal:**
```
Dr 5210 Sales Commission Expense    XXXX
   Cr 2310 Commission Payable             XXXX
```
On payment:
```
Dr 2310 Commission Payable          XXXX
   Cr 1010 Cash/Bank                      XXXX
```

**READY PROMPT:**
```
بناء Sales Commission System:
1. UI src/app/(dashboard)/sales/commissions/page.tsx
2. زر [Calculate Period]: POST /api/sales/commissions/calculate
   - يقرأ CommissionRule النشطة
   - يحسب sum(invoice.netAmount) per repId مفلتر بـ period و status IN [POSTED,PAID]
   - يطرح SalesReturn.amount
   - يطبق tiers
   - ينشئ CommissionRecord PENDING
3. زر [Approve] يبدأ approval workflow (Tier1.1) → عند الموافقة CommissionRecord.status=APPROVED
4. زر [Pay]: 
   - ينشئ PayrollAdjustment للموظف للشهر التالي
   - ينادي auto-journal.commissionAccrual: Dr 5210 / Cr 2310
5. زر [Reverse] لو الفاتورة الأساس انعكست
6. اربط بـ CommissionRule في schema
7. test: tiered calc + return adjustments
8. تحقق محاسبي مع accounting-validator agent قبل commit
```

---

### 2.4 RMA (Return Merchandise Authorization) Workflow

**Target:** `src/app/(dashboard)/sales/returns/rma/page.tsx`

**Schema:** SalesReturn موجود لكن بدون workflow كامل.

**Tables:** RMA #, customer, original invoice, items, reason, status (REQUESTED/APPROVED/RECEIVED/INSPECTED/REFUNDED/REJECTED), refund amount.

**Forms:**
- New RMA: select original invoice → items + qty + reason (defective/wrong item/no longer needed/expired)
- Inspection: condition (good/repairable/scrap), restocking fee %
- Refund: method (cash/credit note/store credit), bank account.

**Buttons:** [Request] [Approve] [Reject] [Receive] [Inspect] [Issue Credit Note] [Refund Cash]

**Data Flow:**
```
Customer requests → SalesReturn { status: REQUESTED }
[Approve] → status: APPROVED, generate RMA number
Customer ships back → [Receive] status: RECEIVED + warehouse inbound (StockMovement IN)
[Inspect] → records condition
   Good → restock (StockMovement re-add to available)
   Damaged → scrap (StockMovement to scrap location)
[Issue Credit Note] → creates CreditNote linked to original Invoice
   Auto-journal:
     Dr 4010 Sales Returns            XXXX
     Dr 2310 VAT Payable              VAT
        Cr 1210 Accounts Receivable        XXXX+VAT
   And inventory restock:
     Dr 1310 Inventory                COST
        Cr 5110 COGS                       COST
```

**READY PROMPT:**
```
بناء RMA Workflow:
1. UI src/app/(dashboard)/sales/returns/rma/page.tsx
2. tabs: New / In Process / Awaiting Receive / Inspection / Closed
3. New RMA modal: select Invoice → grid بـ items مع qty + reason dropdown + restocking%
4. State machine: REQUESTED → APPROVED → RECEIVED → INSPECTED → (REFUNDED|RESTOCKED|SCRAPPED)
5. كل state transition عبر POST /api/sales/returns/[id]/{action}
6. عند Issue Credit Note:
   - createCreditNote في src/lib/auto-journal.ts
   - Dr 4010 Sales Returns + Dr 2310 VAT / Cr 1210 AR
   - Dr 1310 Inventory / Cr 5110 COGS بقيمة التكلفة
7. عند Scrap: StockMovement IN to scrap location + Dr 5910 Scrap Expense / Cr 1310 Inventory
8. اربط بـ ZATCA: Credit Note لازم يولد ZATCA XML بمرجع للفاتورة الأصلية
9. test كامل journey + reverse
10. اعرض المنطق المحاسبي قبل commit
```

---

### 2.5 Customer Statement Generator (Bulk + Templates)

**موجود بـ form بسيط** — توسيع لـ bulk + templates مع dunning.

**Target:** `src/app/(dashboard)/sales/statements/page.tsx`

**Tables:** customer, last sent, balance, days overdue, dunning level.

**Forms:** Template builder (header/body/footer/aging table), schedule (daily/weekly/monthly), filter (all / overdue / by branch).

**Buttons:** [Generate Bulk] [Preview] [Send Email] [Send WhatsApp] [Print] [Schedule]

**READY PROMPT:**
```
توسيع Customer Statement Bulk Generator:
1. UI src/app/(dashboard)/sales/statements/page.tsx (موجود — توسعه)
2. Template builder بـ tinymce/lexical: placeholders {{customer.name}}, {{period}}, {{aging.0-30}}...
3. زر [Generate Bulk]: filter customers (overdue, branch, tier) → progress bar
4. كل statement يحفظ في GeneratedDocument + ينشئ DunningLetter لو level >= 30 days overdue
5. خيارات إرسال: Email (SMTP), WhatsApp Cloud API, SMS, PDF batch download
6. Schedule (cron): cron job ينفذ نفس generate weekly
7. اربط بـ DunningPolicy: لو aging > 60 → escalate dunning level + suspend credit
8. ZATCA: لو balance contains unpaid invoices، ضمّن ZATCA QR
9. test bulk 100 customers
```

---

### 2.6 Sales Forecast & Pipeline Dashboard

**Target:** `src/app/(dashboard)/sales/forecast/page.tsx`

**Charts:** monthly forecast vs actual, by rep, by product, by stage probability.

**READY PROMPT:**
```
بناء Sales Forecast Dashboard:
1. UI src/app/(dashboard)/sales/forecast/page.tsx
2. Data sources: Opportunity (CRM) + SalesOrder (committed) + ML projection (optional Gemini)
3. Charts (Recharts): Pipeline waterfall (won/lost/in-progress), rep performance, product mix, accuracy delta
4. Filters: period, rep, product, branch, probability%
5. API GET /api/sales/forecast?period=&rep=
   - Aggregates Opportunity.expectedCloseDate × probability × amount
   - Plus committed SalesOrder
   - Returns monthly buckets
6. زر [Lock Forecast] يحفظ snapshot في ForecastSnapshot
7. زر [Compare to Actual] يعرض variance vs realized invoices
8. test: forecast accuracy = actual / forecasted
```

---

## PART 3 — Purchases / AP

### 3.1 RFQ Bidding Portal (Vendor-facing)

**Target:** internal `src/app/(dashboard)/procurement/rfq/[id]/page.tsx` + vendor portal `src/app/portal/vendor/rfq/[id]/page.tsx`

**Tables:**
- Internal: vendor, submitted at, total bid, technical score, commercial score, status, recommend.
- Vendor portal: items, qty, deadline, submit form.

**Buttons:** [Send to Vendors] [View Bids] [Score Bid] [Award PO] [Reject Bid]

**Data Flow:**
```
Buyer creates RFQ → invites N vendors via email with portal token
Vendor logs in via VendorPortalUser → sees RFQ → submits VendorBid (item × price × delivery)
Buyer side: comparison matrix + auto-rank
[Award] → creates PurchaseOrder linked to winning bid → notifies others
```

**READY PROMPT:**
```
بناء RFQ Bidding System:
1. Internal UI src/app/(dashboard)/procurement/rfq/page.tsx + [id]/page.tsx
2. Vendor portal UI src/app/portal/vendor/rfq/[id]/page.tsx (بدون Clerk — token-based access)
3. Send invitation: POST /api/procurement/rfq/[id]/invite { vendorIds[] }
   - ينشئ VendorPortalToken لكل vendor (24h validity)
   - يرسل email بالـ link
4. Vendor submits bid: POST /api/portal/vendor/rfq/[id]/bid { items: [{itemId, unitPrice, deliveryDays}] }
5. Comparison matrix: GET /api/procurement/rfq/[id]/comparison
   - column per vendor, row per item
   - auto-rank + best-price highlight
   - technical scoring criteria (configurable weights)
6. Award: POST /api/procurement/rfq/[id]/award { vendorId }
   - ينشئ PurchaseOrder من البيد الفائز
   - status NOTIFIED للباقي
7. ZATCA / VAT: ضمّن في PO الناتج
8. اربط VendorPortalUser و VendorBid existing models
9. test: full flow + comparison ranking
```

---

### 3.2 Vendor Scorecard Dashboard

**Target:** `src/app/(dashboard)/procurement/vendors/scorecard/page.tsx`

**Tables / KPIs per vendor:** OTD (on-time delivery %), quality (% NCR), pricing (vs market), responsiveness (avg RFQ response time), compliance (docs valid), risk score.

**Buttons:** [View Detail] [Rate Manually] [Block Vendor] [Audit] [Export]

**Data Flow:**
```
Nightly cron computes per vendor:
  OTD = receivedOnTime / totalReceipts
  quality = 1 - (NCR / totalReceipts)
  pricing = avg variance from market price index
  responsiveness = avg(now - rfqInvitedAt for unanswered)
  compliance = check ComplianceDoc expiry
  → upsert VendorRating with composite score
Visual: radar chart per vendor, leaderboard, alerts if score < threshold
```

**READY PROMPT:**
```
بناء Vendor Scorecard:
1. UI src/app/(dashboard)/procurement/vendors/scorecard/page.tsx
2. Per-vendor card: radar chart (OTD/Quality/Price/Responsiveness/Compliance) + composite score
3. Leaderboard tab: ranked list مع pagination
4. Alerts tab: vendors بـ score < 60% أو compliance docs منتهية
5. Cron job src/app/api/cron/vendor-scoring/route.ts يحدث VendorRating كل ليلة
6. Calc helpers في src/lib/vendor-scoring.ts:
   - OTD: GoodsReceiptNote receivedAt vs PO.expectedDate
   - Quality: NonConformanceReport count / GRN count
   - Pricing: vs market index (placeholder قاعدة بيانات أسعار المرجعية)
   - Responsiveness: VendorBid.respondedAt - rfq.invitedAt
   - Compliance: ComplianceDoc.expiresAt > now
7. زر [Block Vendor] يحدث Vendor.status = BLOCKED ويمنع PO جديد
8. test: scoring computation
```

---

### 3.3 Three-Way Match Workflow UI

**موجود model + شاشة جزئية** — اكتمال workflow.

**Target:** `src/app/(dashboard)/purchases/matching/page.tsx`

**Tables:** PO #, GRN #, Invoice #, qty match, price match, total variance, status (MATCHED/EXCEPTION/AWAITING_REVIEW), tolerance breach.

**Buttons:** [Auto-Match] [Resolve Exception] [Override (with reason)] [Approve Payment]

**Data Flow:**
```
On Vendor Invoice receipt:
  1. Find linked PO and GRN
  2. Compute:
     qtyMatch = abs(invoice.qty - grn.qty) <= tolerance.qty
     priceMatch = abs(invoice.price - po.price) <= tolerance.price
     totalMatch = qtyMatch && priceMatch
  3. If matched → invoice eligible for payment
  4. Else → status = EXCEPTION, sent to buyer for review
  5. Override requires comment + approval
```

**READY PROMPT:**
```
اكتمال Three-Way Match:
1. UI src/app/(dashboard)/purchases/matching/page.tsx (موسع موجود)
2. Tabs: Awaiting Match / Matched / Exceptions / Overridden
3. Auto-match cron: src/app/api/cron/three-way-match/route.ts كل 5 دقائق
4. Tolerance settings: Setting.threeWayMatchToleranceQty (default 0%) و TolerancePrice (default 1%)
5. Exception modal: side-by-side PO vs GRN vs Invoice مع highlighted variances
6. زر [Override] يطلب comment + approval workflow (Tier1.1 — financial approval)
7. عند Match successful:
   - Invoice.status = APPROVED_FOR_PAYMENT
   - يدخل Payment Run queue
8. لو Exception > tolerance: hold payment + notify buyer + AP lead
9. test: 4 سيناريوهات (qty over, qty under, price over, both)
```

---

### 3.4 Landed Cost Allocation

**Target:** `src/app/(dashboard)/purchases/landed-cost/[poId]/page.tsx`

**Schema:** LandedCost موجود.

**Tables:** PO items + landed cost breakdown (freight, customs, insurance, handling).

**Forms:** Allocation method (by qty/by value/by weight/by volume).

**Buttons:** [Add Cost] [Allocate] [Recompute] [Lock]

**Data Flow:**
```
Add freight invoice 5,000 → LandedCost { poId, type: FREIGHT, amount: 5000 }
[Allocate by value] → distribute proportionally to PO line value
  → each ProductStock.landedCost increases proportionally
  → updates inventory valuation (FIFO/AVG layers)
JE:
  Dr 1310 Inventory (COGS uplift)   5000
     Cr 2110 GR/IR Clearing               5000
On vendor invoice for freight:
  Dr 2110 GR/IR Clearing            5000
     Cr 2010 Accounts Payable             5000
```

**READY PROMPT:**
```
بناء Landed Cost Allocation:
1. UI src/app/(dashboard)/purchases/landed-cost/[poId]/page.tsx
2. Modal Add Cost: type (FREIGHT, CUSTOMS, INSURANCE, HANDLING, BROKERAGE), amount, vendor (opt), reference
3. Allocation method dropdown: BY_QTY / BY_VALUE / BY_WEIGHT / BY_VOLUME / MANUAL
4. زر [Allocate] يستدعي src/lib/landed-cost.ts allocateLanded(poId, costId, method)
   - يحسب share per line
   - يحدث ProductStock الطبقات (FIFO/AVG)
   - ينشئ JE: Dr 1310 / Cr 2110 GR/IR
5. زر [Lock] لما الكل allocated — يمنع تعديل لاحق
6. عرض variance: actual vs estimated landed
7. اربط بـ existing costing.ts (FIFO/AVG)
8. accounting-validator agent يتحقق من JE
9. test: 3 طرق allocation
```

---

### 3.5 Payment Run with Approval Hold

**Target:** `src/app/(dashboard)/finance/payment-run/page.tsx` (موجود — توسيع)

**Tables:** invoice batch، due date، vendor، amount، method، bank، status (PROPOSED/APPROVED/SENT/CONFIRMED/FAILED).

**Buttons:** [Propose Run] [Hold] [Release] [Approve] [Send to Bank] [Confirm Settlement]

**Data Flow:**
```
[Propose Run] → POST /api/finance/payment-run/propose { dueBefore }
  → finds Invoices status=APPROVED_FOR_PAYMENT, dueDate <= cutoff, vendor.holdStatus=false
  → groups by vendor + bank
  → creates PaymentRun + PaymentRunLine[] status=PROPOSED
[Approve] → approval workflow → status=APPROVED
[Send to Bank] → generate SAMA bank file (SARIE/SADAD) or WPS-like
[Confirm] → match bank statement → status=PAID, JE posted:
   Dr 2010 AP                  XXXX
      Cr 1010 Cash/Bank             XXXX
```

**READY PROMPT:**
```
توسيع Payment Run:
1. UI src/app/(dashboard)/finance/payment-run/page.tsx (تطوير موجود)
2. Stages: PROPOSED → APPROVED → SENT → SETTLED
3. زر [Propose] يفتح modal: due before date, vendor filter, max amount, currency
4. Auto-grouping: per vendor per bank account
5. Hold individual line zر [Hold]: PaymentRunLine.status = HELD مع reason
6. Approval workflow integration (Tier1.1) — مدير مالي ثم CFO فوق ثريشهولد
7. زر [Send to Bank]: 
   - Generate SARIE batch file (SAMA standard XML)
   - Save in BankBatchFile
   - Email/SFTP to bank
8. Reconcile: Bank confirmation file match → PaymentRunLine.status = SETTLED + JE Dr AP / Cr Bank
9. ZATCA: لو payment للـ vendor خاضع للضريبة، ضمن transaction
10. test: full cycle + reversal لو bank reject
```

---

### 3.6 Supplier Contract Lifecycle

**Target:** `src/app/(dashboard)/procurement/contracts/page.tsx`

**Tables:** vendor، contract type، start، end، value، renewal alert (30/60/90 days)، status.

**READY PROMPT:**
```
بناء Supplier Contract Lifecycle:
1. UI src/app/(dashboard)/procurement/contracts/page.tsx
2. CRUD SupplierContract: vendor, type, terms, value, validFrom/To, renewalNoticeDays
3. Auto-PO generation: contract has scheduledPOs[] - cron يولد PO عند الموعد
4. Renewal alerts: cron daily — لو validTo - renewalNoticeDays = today → email لـ procurement lead
5. Document attachments (PDF contract, addendums)
6. zATCA contract: لو contract value > 100k SAR، اطلب VAT registration للـ vendor
7. Variation orders: يمكن إضافة amendments مع approval workflow
8. test: renewal trigger + auto-PO
```

---

## PART 4 — Inventory

### 4.1 ABC Inventory Analysis

**Target:** `src/app/(dashboard)/inventory/abc-analysis/page.tsx`

**Tables:** product، annual usage value، cumulative %، class (A/B/C)، count strategy.

**Charts:** Pareto curve.

**READY PROMPT:**
```
بناء ABC Analysis:
1. UI src/app/(dashboard)/inventory/abc-analysis/page.tsx
2. API GET /api/inventory/abc-analysis?period=12m
   - per product: annualUsage = sum(StockMovement OUT × cost) في آخر 12 شهر
   - sort desc → cumulative% → 
     A = top 80% value (≈ 20% of items)
     B = next 15% (≈ 30% of items)
     C = bottom 5% (≈ 50% of items)
3. Update Product.abcClass (يضاف لـ schema لو غير موجود)
4. Pareto chart (Recharts ComposedChart): bars=value, line=cumulative%
5. Recommendations:
   A → cycle count weekly, tight reorder, JIT
   B → cycle count monthly, EOQ
   C → cycle count quarterly, bulk order
6. زر [Apply to Cycle Count Schedule] يحدث Stocktake.frequency per item
7. test: classification logic
```

---

### 4.2 FEFO Allocation Logic

**Target:** `src/lib/picking-fefo.ts` + UI in pick-list page.

**Schema:** Batch.expiryDate موجود.

**Data Flow:**
```
Pick request → allocatePickQty(productId, qty, location)
  → SELECT Batch WHERE productId AND availableQty > 0 AND location ORDER BY expiryDate ASC
  → consume qtys until target met
  → reserve batches → StockReservation
  → return batch breakdown
Block expired batches (expiryDate < today + N grace days).
```

**READY PROMPT:**
```
بناء FEFO Allocation:
1. اكتب src/lib/picking-fefo.ts: allocateFEFO(tx, productId, qty, locationId)
   - يقرأ Batch order by expiryDate ASC
   - skip لو expiryDate < today + 7 days (configurable في Setting)
   - يحجز availableQty
   - يرجع [{batchId, qty, expiryDate}]
2. استخدم في sales-orders/picking + pos + manufacturing/issues
3. UI في pick-list page src/app/(dashboard)/inventory/picking/[id]/page.tsx
   عمود batch + expiryDate + لون أحمر لو expires <30d
4. Setting expiry_grace_days configurable
5. test: 3 batches بـ expiry مختلفة → يأخذ القديم أولاً
6. test: skip expired
```

---

### 4.3 Cycle Counting Scheduler

**Target:** `src/app/(dashboard)/inventory/stocktake/cycle/page.tsx`

**Tables:** count plan name، products، schedule (daily/weekly)، last counted، variance %، status.

**Buttons:** [Generate Plan] [Start Count] [Submit Result] [Recount] [Approve Variance]

**Data Flow:**
```
Cron generates daily count list based on ABC class:
  A items × 1/5 (every 5 days)
  B items × 1/30
  C items × 1/90
Counters submit via mobile (or PWA)
System computes variance per item, threshold violations escalate
Approval workflow for variance > 5% triggers JE adjustment:
  Dr/Cr 1310 Inventory ↔ 5910 Inventory Adjustment
```

**READY PROMPT:**
```
بناء Cycle Counting:
1. UI src/app/(dashboard)/inventory/stocktake/cycle/page.tsx
2. Plan builder: name, scope (location/category/abcClass), schedule (cron), counter assignments
3. Cron job /api/cron/cycle-count يولد StocktakeCount يومي بناء على plan
4. Mobile-friendly count UI: barcode scan → enter qty → submit
5. Variance > tolerance% (configurable per ABC class) يتطلب recount
6. Approval workflow للـ adjustment > Setting.cycleCountApprovalThreshold
7. JE auto-post: Dr/Cr Inventory ↔ Inventory Adjustment Expense (5910)
8. KPI Dashboard: count accuracy %, hours per count, variance trend
9. accounting-validator: تحقق JE
10. test: variance calc + approval gate
```

---

### 4.4 Bin/Zone Putaway Rules

**Target:** `src/app/(dashboard)/inventory/wms/putaway/page.tsx`

**Schema:** WarehouseZone, Rack, Bin موجودة.

**Forms:** Rule: condition (productCategory, weight, hazClass) → preferred zone/bin.

**READY PROMPT:**
```
بناء Putaway Rules:
1. أضف PutawayRule في schema { condition: JSON, targetZoneId, priority }
2. UI src/app/(dashboard)/inventory/wms/putaway/page.tsx CRUD
3. Engine src/lib/putaway-engine.ts: suggestBin(productId, qty)
   - يطبق rules بترتيب priority
   - condition يدعم: productCategory in [...], weight <>, hazClass=, fragile=true
   - يفضل bin بأقل نسبة امتلاء
4. عند GRN → اقتراح bins تلقائياً + يمكن للمستخدم override
5. Smart suggestions: لو item قديم في bin معين، يقترح نفسه
6. Heatmap: عرض warehouse layout بألوان امتلاء كل bin
7. test: rule matching + fallback
```

---

### 4.5 Lot/Serial Traceability UI

**Target:** `src/app/(dashboard)/inventory/traceability/page.tsx`

**Search:** by serial, batch, product، invoice، customer.

**Output:** family tree (production lot → batch → serials → sales invoices → customers).

**READY PROMPT:**
```
بناء Traceability:
1. UI src/app/(dashboard)/inventory/traceability/page.tsx
2. Search box: lot, serial, batch, customer name, invoice#
3. Result tree:
   - Up: where did this come from? RM batches → MO → finished
   - Down: where did it go? StockMovement OUT → SalesOrder → Invoice → Customer
4. API /api/inventory/traceability/[type]/[value]
5. Recall scenario: بحث serial, list customers received it → bulk notification
6. ZATCA: لو recall لـ items مفوترة، Credit Note لكل
7. PDF report للسلطات (SFDA لو dwa') 
8. test: full forward + backward trace
```

---

## PART 5 — Manufacturing

### 5.1 BOM Versioning UI

**Target:** `src/app/(dashboard)/manufacturing/boms/[id]/versions/page.tsx`

**Schema:** BOMVersion موجود.

**Tables:** version#, effective date, status (DRAFT/APPROVED/OBSOLETE), changes summary, ECR ref.

**Buttons:** [New Version] [Compare Versions] [Approve] [Activate] [Obsolete]

**READY PROMPT:**
```
بناء BOM Versioning:
1. UI src/app/(dashboard)/manufacturing/boms/[id]/versions/page.tsx
2. timeline view مع version diff
3. New Version: clone من existing → edit components/qty → submit
4. Compare modal: side-by-side components مع red/green highlight
5. Activate: previous version → OBSOLETE, new → ACTIVE (one active at a time per product)
6. ECR (Engineering Change Request) integration: link version to ECR# مع approval
7. Forward propagation: open MOs بـ old version - alert + option migrate
8. Cost roll-up per version: snapshot cost at activation
9. test: cannot have 2 active versions same time
```

---

### 5.2 Capacity Planning Gantt

**Target:** `src/app/(dashboard)/manufacturing/capacity/page.tsx`

**Schema:** WorkCenter, CapacityCalendar موجودة.

**Tables / Gantt:** rows = work centers, columns = days/weeks, cells = MO load %, color-coded.

**Buttons:** [Schedule MO] [Reschedule] [Add Shift] [What-if Scenario]

**READY PROMPT:**
```
بناء Capacity Planning Gantt:
1. UI src/app/(dashboard)/manufacturing/capacity/page.tsx
2. Library: dhtmlx-gantt or syncfusion-gantt
3. Y-axis: WorkCenter list, X-axis: time (zoom day/week/month)
4. Bars: ManufacturingOrder عمليات على work centers
5. Conflicts highlighted (>100% load) أحمر
6. Drag-drop reschedule MO → recalc capacity
7. What-if scenario: clone schedule, simulate, compare KPIs (throughput, on-time)
8. Backward scheduling: من due date عكسي
9. Forward scheduling: من now أمامي
10. Constraints: shift calendar, holidays, planned maintenance
11. API GET /api/manufacturing/capacity/load?from=&to=
12. test: load calc + conflict detection
```

---

### 5.3 OEE (Overall Equipment Effectiveness) Dashboard

**Target:** `src/app/(dashboard)/manufacturing/oee/page.tsx`

**Formula:** OEE = Availability × Performance × Quality
- Availability = runTime / plannedTime
- Performance = (idealCycle × totalUnits) / runTime
- Quality = goodUnits / totalUnits

**READY PROMPT:**
```
بناء OEE Dashboard:
1. UI src/app/(dashboard)/manufacturing/oee/page.tsx
2. Per machine + aggregate dashboard
3. Source data:
   - MachineEvent (RUNNING/IDLE/DOWN) — يحسب availability
   - ManufacturingOrder produced qty, ideal cycle time, run time → performance
   - QualityCheck pass/fail → quality
4. Trend chart 30-day rolling
5. Pareto chart للـ downtime causes
6. World-class threshold = 85% — alert لو <60%
7. API /api/manufacturing/oee?machineId=&period=
8. (اختياري) IoT sensor integration: HTTP webhook /api/manufacturing/iot/event
9. test: OEE calc with sample data
```

---

### 5.4 Scrap & Wastage Tracking

**Target:** `src/app/(dashboard)/manufacturing/scrap/page.tsx`

**Schema:** ManufacturingWastage موجود.

**Buttons:** [Log Scrap] [Categorize] [Investigate] [Approve Write-off]

**Data Flow:**
```
Operator scans item → POST /api/manufacturing/scrap
  { moId, productId, qty, reasonCode, location }
  → JE: Dr 5910 Manufacturing Scrap / Cr 1310 WIP Inventory
Scrap reason categories:
  - SETUP_LOSS, MATERIAL_DEFECT, MACHINE_BREAKDOWN, OPERATOR_ERROR, DESIGN_ISSUE
Variance analysis: actual vs standard scrap%.
```

**READY PROMPT:**
```
بناء Scrap Tracking:
1. UI src/app/(dashboard)/manufacturing/scrap/page.tsx
2. Forms: log scrap (mo, item, qty, reasonCode dropdown, root cause text, photo upload)
3. ReasonCode: SETUP / MATERIAL / MACHINE / OPERATOR / DESIGN / OTHER
4. JE auto: Dr 5910 / Cr 1310 - استخدم auto-journal scrapWriteoff
5. Variance vs standard scrap% per product
6. Pareto chart (top reasons), trend, 8D investigation form for major scrap
7. Approval > threshold (Setting.scrapApprovalLimit)
8. accounting-validator: تحقق
9. test
```

---

### 5.5 Routing Optimization

**Target:** `src/app/(dashboard)/manufacturing/routing/page.tsx`

**Schema:** RecipeOperation موجود.

**Forms:** define operation sequence, work center, setup time, run time, alternate work centers.

**READY PROMPT:**
```
بناء Routing Optimization:
1. UI src/app/(dashboard)/manufacturing/routing/page.tsx
2. Visual flow editor (react-flow): operations as nodes, connections as flow
3. Per operation: setup, runTime/unit, workCenters[] (primary + alternates), tooling
4. Alternate routing logic: لو primary down/overloaded → fallback alternate
5. Cost calc: standard hours × labor rate per WC
6. Time-phasing: critical path
7. test: routing applied to MO scheduling
```

---

## PART 6 — Finance / Accounting

### 6.1 Intercompany Elimination

**Target:** `src/app/(dashboard)/finance/consolidation/elimination/page.tsx`

**Schema:** ConsolidationRun موجود.

**Tables:** intercompany pair (Co-A → Co-B), AR (A) vs AP (B), variance, eliminated amount.

**READY PROMPT:**
```
بناء Intercompany Elimination:
1. UI src/app/(dashboard)/finance/consolidation/elimination/page.tsx
2. Identify intercompany: Customer.isIntercompany=true, Vendor.isIntercompany=true, linked to other tenant
3. Reconciliation report: Co-A AR with Co-B = Co-B AP with Co-A (يجب يساوي)
4. Variance reasons: timing, FX, in-transit
5. Auto-elimination JE on consolidation:
   Dr Intercompany Payable (B)
      Cr Intercompany Receivable (A)
6. Profit-in-stock elimination: لو inventory transferred between cos مع markup
7. Reports: consolidated BS/PL with eliminations clearly marked
8. accounting-validator
9. test
```

---

### 6.2 Cash Flow Forecasting

**Target:** `src/app/(dashboard)/finance/cash-flow/forecast/page.tsx`

**Schema:** CashFlowForecast موجود.

**Tables:** date, opening, inflows (collections, loans), outflows (AP, payroll, taxes), closing, threshold breach alerts.

**READY PROMPT:**
```
بناء Cash Flow Forecast:
1. UI src/app/(dashboard)/finance/cash-flow/forecast/page.tsx
2. Time horizon: 4-week, 13-week, 12-month
3. Inflows:
   - AR aging → due dates × probability (configurable per aging bucket)
   - Confirmed sales orders not yet invoiced
   - Loans/financing
4. Outflows:
   - AP aging → payment terms
   - Payroll (next run from PayrollSchedule)
   - Tax obligations (VAT due dates, GOSI, Zakat)
   - Lease payments (IfrsLeaseContract schedule)
   - Loan repayments
5. Sensitivity sliders: collection rate %, delay days
6. Visual: waterfall chart, line chart projection vs actual
7. Alerts: cash < min threshold → red banner
8. Snapshot save: ForecastSnapshot table for variance analysis
9. test
```

---

### 6.3 Bank Reconciliation Rule Builder

**Target:** `src/app/(dashboard)/finance/bank-recon/rules/page.tsx`

**Schema:** BankReconRule موجود.

**Forms:** condition (description regex, amount range, date) → action (auto-match to invoice, create JE).

**READY PROMPT:**
```
بناء Bank Recon Rules:
1. UI src/app/(dashboard)/finance/bank-recon/rules/page.tsx
2. Rule condition: description pattern (regex), amount range, counterparty (matching IBAN)
3. Rule action: 
   - auto-match to PaymentRunLine
   - auto-match to ReceiptVoucher
   - create JE with template
4. Priority order
5. Test panel: paste sample bank line → preview which rule matches
6. Engine: src/lib/bank-recon-engine.ts apply rules to BankStatementLine
7. Confidence score: exact match=100, partial=70, manual review<70
8. test: 5 sample rules
```

---

### 6.4 ECL (Expected Credit Loss) Calculation Automation

**Target:** `src/app/(dashboard)/finance/ecl/page.tsx` (موجود)

**Formula:** ECL = PD × LGD × EAD per aging bucket.

**READY PROMPT:**
```
توسيع ECL Engine:
1. ECL model parameters configurable per industry/customer segment
2. Aging buckets: 0-30, 31-60, 61-90, 91-180, 181-365, >365
3. Default PD per bucket (configurable, baseline IFRS9)
4. LGD = 1 - recoveryRate (per customer category)
5. EAD = exposure at default = invoice balance
6. Cron monthly: src/app/api/cron/ecl/route.ts
7. JE: Dr 5710 Bad Debt Expense / Cr 1219 Allowance for Doubtful Accounts
8. UI: per customer ECL contribution + portfolio total
9. accounting-validator
10. test
```

---

### 6.5 FX Revaluation Automation

**Target:** existing in `src/app/(dashboard)/finance/fx-revaluation/`

**READY PROMPT:**
```
أتمتة FX Revaluation:
1. Cron month-end: src/app/api/cron/fx-revaluation/route.ts
2. Per foreign currency open balance:
   - GET ExchangeRate.spot at month end
   - Compute new SAR value vs original
   - Diff → JE:
     Unrealized gain: Dr 1xxx FCY Asset / Cr 4910 FX Gain
     Unrealized loss: Dr 5910 FX Loss / Cr 2xxx FCY Liability
3. Reverse next month opening (memo entry)
4. UI: FX exposure dashboard (existing) + revaluation log
5. accounting-validator
6. test multiple currencies
```

---

### 6.6 Cost Center Allocation Rules UI

**Target:** `src/app/(dashboard)/accounting/allocations/rules/page.tsx`

**Schema:** AllocationRule موجود.

**Forms:** source CC → target CCs with % or driver (headcount, sqm, revenue).

**READY PROMPT:**
```
بناء Allocation Rules UI:
1. CRUD AllocationRule
2. UI src/app/(dashboard)/accounting/allocations/rules/page.tsx
3. Rule: sourceCC → [{ targetCC, weight | driver }]
4. Drivers: HEADCOUNT, REVENUE, SQM, FIXED
5. Run allocation cron month-end:
   - Sum source CC actuals
   - Apply rule, distribute
   - JE: Dr Target CC / Cr Source CC (memo entries)
6. UI run history + variance vs prev month
7. accounting-validator
```

---

### 6.7 Multi-Book Accounting

**Schema:** AccountingBook موجود.

**READY PROMPT:**
```
دعم Multi-Book:
1. كل JournalEntry يقبل bookId (default = PRIMARY)
2. Books examples: PRIMARY (SOCPA), IFRS, US_GAAP, MGMT, TAX
3. Different books may have different depreciation methods, revenue recognition
4. Reports per book
5. UI src/app/(dashboard)/accounting/books/page.tsx
6. Book reconciliation report: variance per account between books with reasons
7. test
```

---

## PART 7 — HR / Payroll

### 7.1 Org Chart Visualization

**Target:** `src/app/(dashboard)/hr/org-chart/page.tsx`

**Library:** react-organizational-chart.

**READY PROMPT:**
```
بناء Org Chart:
1. UI src/app/(dashboard)/hr/org-chart/page.tsx
2. Library: react-organizational-chart أو d3-org-chart
3. Source: Employee.managerId hierarchy
4. Card per employee: photo, name, position, dept, KPIs
5. Edit mode: drag-drop → updates managerId
6. Filter: department, location
7. Print/Export PNG
8. Vacancy slots highlighted (Position.open=true بدون employee)
9. test
```

---

### 7.2 Performance Review (360°)

**Target:** `src/app/(dashboard)/hr/performance/page.tsx`

**Schema:** EmployeeEvaluation موجود — توسيع لـ 360°.

**READY PROMPT:**
```
بناء Performance Mgmt:
1. EvaluationCycle: name, period, type (ANNUAL, QUARTERLY, PROBATION)
2. EvaluationTemplate: questions, weights, scale (1-5)
3. 360° flow:
   - self-assessment
   - manager review
   - peer reviews (3 selected by employee)
   - subordinate reviews (لو manager)
4. Goals (SMART): set at start, scored at end
5. Calibration meeting: managers compare ratings, normalize
6. Outcome: rating, salary increase eligibility, promotion track
7. UI src/app/(dashboard)/hr/performance/page.tsx — employee dashboard + manager view + HR admin
8. anonymized peer feedback
9. test
```

---

### 7.3 Recruitment Pipeline (ATS)

**Target:** `src/app/(dashboard)/hr/recruitment/page.tsx`

**Schema add:**
```prisma
model JobPosting { id, title, deptId, openings, requirements, status, postedAt }
model Candidate { id, name, email, phone, resume, status }
model Application { jobPostingId, candidateId, stage, score, feedback }
```

**Stages:** APPLIED → SCREENED → INTERVIEWED → OFFERED → HIRED / REJECTED.

**READY PROMPT:**
```
بناء ATS:
1. أضف JobPosting + Candidate + Application + Interview في schema
2. UI Kanban (DnD) src/app/(dashboard)/hr/recruitment/page.tsx بـ stages
3. Public job board: src/app/careers/page.tsx + apply form
4. Resume parser (Gemini): extract name/skills/experience
5. Interview scheduling مع calendar integration
6. Offer letter template + e-sign
7. Hire flow: Application HIRED → create Employee record + onboarding tasks
8. KPIs: time-to-hire, offer acceptance %, source effectiveness
9. test
```

---

### 7.4 Training Tracker

**Target:** `src/app/(dashboard)/hr/training/page.tsx`

**Schema:** TrainingEnrollment موجود.

**READY PROMPT:**
```
بناء Training Tracker:
1. CRUD TrainingProgram + TrainingSession + TrainingEnrollment
2. UI src/app/(dashboard)/hr/training/page.tsx
3. Skill matrix: skill × employee → proficiency level (BEGINNER/INTERMEDIATE/EXPERT)
4. Gap analysis: required vs current per role
5. Auto-suggest training based on gaps
6. Cost tracking: budget per program → JE Dr 5610 Training Expense
7. Compliance training: mandatory + expiry tracking (e.g., HSE certificate yearly)
8. Certificate issuance + verification QR
9. accounting-validator (للمصاريف)
10. test
```

---

### 7.5 GOSI & WPS Automation Verification

**Target:** existing payroll APIs.

**READY PROMPT:**
```
تحقق GOSI + WPS:
1. استدعِ saudi-compliance agent للتحقق من:
   - GOSI 9% employee + 9% employer + 2% SANED للسعوديين
   - GOSI للمقيمين: 2% أصابات عمل فقط
   - WPS file format: SIF (Salary Information File) per SAMA standard
2. UI src/app/(dashboard)/payroll/wps/page.tsx (لو غير موجود)
3. Generate WPS file at payroll close → upload to bank portal
4. Late payment alert: 10 days from period end ⇒ MOL violation
5. EOS calc per Saudi Labor Law Articles 84-85:
   - <5 years: 0.5 month per year
   - >=5 years: 1 month per year
   - Resignation: reduced (if voluntary <2 years = nothing, 2-5 = 1/3, 5-10 = 2/3, 10+ = full)
6. test multiple scenarios (Saudi/expat, EOS calc)
```

---

## PART 8 — CRM

### 8.1 Lead Management with Scoring

**Target:** `src/app/(dashboard)/crm/leads/page.tsx`

**READY PROMPT:**
```
بناء CRM Leads:
1. أضف Lead + LeadActivity + LeadSource في schema
2. UI src/app/(dashboard)/crm/leads/page.tsx Kanban بـ stages: NEW / CONTACTED / QUALIFIED / DISQUALIFIED
3. Scoring rule engine: explicit (size, budget, authority) + implicit (web visits, email opens)
4. Auto-assign rule: round-robin or by territory
5. Convert to Opportunity flow
6. Email/SMS templates مع merge fields
7. Calls log + Twilio integration optional
8. test scoring
```

---

### 8.2 Opportunity Pipeline Kanban

**Target:** `src/app/(dashboard)/crm/opportunities/page.tsx`

**READY PROMPT:**
```
بناء Opportunity Pipeline:
1. UI Kanban (react-beautiful-dnd) src/app/(dashboard)/crm/opportunities/page.tsx
2. Stages from PipelineStage: PROSPECT / QUALIFIED / PROPOSAL / NEGOTIATION / WON / LOST
3. Card: customer, amount, expected close, probability, owner
4. Drag-drop changes stage + opens modal لتسجيل reason
5. Forecast = sum(amount × probability) per period
6. Win/loss analysis: reasons, competitors, lessons learned
7. Convert WON → SalesOrder
8. test
```

---

### 8.3 Customer Self-Service Portal

**Target:** `src/app/portal/customer/page.tsx`

**READY PROMPT:**
```
بناء Customer Portal:
1. Auth: token-based via CustomerPortalUser (existing or new)
2. Dashboard: outstanding invoices, recent orders, statements
3. Order tracking: real-time status (CONFIRMED / PICKING / SHIPPED / DELIVERED)
4. Documents: download invoices (with ZATCA QR), statements, contracts
5. Payment: online via STC Pay / Mada / Apple Pay (optional)
6. Support tickets
7. Multi-language AR/EN
8. RTL responsive
9. test
```

---

## PART 9 — V3 Verticals

### 9.1 Clinic — Appointment Scheduling

**Target:** `src/app/(dashboard)/v3/clinic/appointments/page.tsx`

**Tables:** doctor schedule, patient queue, status, room.

**READY PROMPT:**
```
بناء Clinic Appointments:
1. أضف Appointment + DoctorSchedule + Room في schema
2. UI src/app/(dashboard)/v3/clinic/appointments/page.tsx
3. Calendar view (FullCalendar) بـ resource per doctor
4. Booking modal: patient, doctor, type (CONSULT/FOLLOWUP/PROCEDURE), duration, room
5. SMS/WhatsApp reminder 24h + 2h قبل
6. No-show tracking → impact patient score
7. Walk-in queue management
8. Insurance pre-authorization (TPA integration placeholder)
9. test
```

---

### 9.2 Clinic — Electronic Prescriptions (e-Rx)

**Target:** `src/app/(dashboard)/v3/clinic/erx/page.tsx`

**READY PROMPT:**
```
بناء e-Prescription:
1. أضف Medication + Prescription + PrescriptionItem في schema
2. UI src/app/(dashboard)/v3/clinic/erx/page.tsx
3. Drug search (autocomplete) مع SFDA drug code (Saudi FDA)
4. Drug-drug interaction check (DDI database integration)
5. Dose, frequency, duration, route
6. Patient allergy alert
7. NPHIES integration (Saudi national platform) — placeholder
8. Print/QR for pharmacy
9. Refills tracking
10. test
```

---

### 9.3 Clinic — Lab Integration

**Target:** `src/app/(dashboard)/v3/clinic/lab/page.tsx`

**READY PROMPT:**
```
بناء Lab Module:
1. أضف LabOrder + LabTest + LabResult في schema
2. UI lab queue: pending samples, in process, completed
3. HL7/FHIR integration placeholder (with external lab providers)
4. Result entry: structured (numeric ranges with normal/abnormal flag)
5. Result delivery: patient via portal/email/SMS
6. Critical value alert → auto-call doctor
7. Test catalog with pricing → integrates with billing
8. test
```

---

### 9.4 Construction — Variation Orders

**Target:** `src/app/(dashboard)/v3/construction/variations/page.tsx`

**READY PROMPT:**
```
بناء Variation Orders:
1. أضف VariationOrder + VariationItem في schema
2. UI src/app/(dashboard)/v3/construction/variations/page.tsx linked to BOQ
3. Types: ADDITION (new work) / OMISSION / SUBSTITUTION
4. Approval workflow (Tier1.1) — value-based (>50k → CFO)
5. Updates BOQ + revised contract value
6. Auto JE: Dr Project Cost / Cr Variation Payable
7. Client approval signature (e-sign)
8. accounting-validator
9. test
```

---

### 9.5 Construction — Progress Billing & Retention

**Target:** `src/app/(dashboard)/v3/construction/progress-billing/page.tsx`

**READY PROMPT:**
```
بناء Progress Billing:
1. UI src/app/(dashboard)/v3/construction/progress-billing/page.tsx
2. % completion per BOQ item (manual or QS-verified)
3. Generate progress invoice = (cumulative% - prev%) × line value
4. Retention: 5-10% withheld per Saudi standard
5. Advance payment recovery: deduct from each progress claim proportional
6. JE per progress invoice:
   Dr 1210 AR (90% of work)
   Dr 1212 Retention Receivable (10%)
      Cr 4010 Revenue
      Cr 2310 VAT Payable
7. Retention release at defects liability period end
8. ZATCA: progress invoice = full ZATCA
9. accounting-validator
10. test
```

---

### 9.6 Distribution — Wave Picking

**Target:** `src/app/(dashboard)/v3/distribution/picking/wave/page.tsx`

**READY PROMPT:**
```
بناء Wave Picking:
1. أضف PickWave + PickWaveLine في schema
2. UI src/app/(dashboard)/v3/distribution/picking/wave/page.tsx
3. Wave planner: group orders by route/zone/priority
4. Pick path optimization (shortest path through warehouse)
5. Mobile UI for pickers (PWA): scan bin → confirm qty
6. Integration with FEFO (4.2)
7. Pack station: verify, label, manifest
8. KPIs: lines/hour, error rate, on-time
9. test
```

---

### 9.7 Distribution — Route Optimization & Driver App

**Target:** `src/app/(dashboard)/v3/distribution/routes/page.tsx`

**READY PROMPT:**
```
بناء Route Optimization:
1. UI src/app/(dashboard)/v3/distribution/routes/page.tsx
2. Routing algorithm (VRP - Vehicle Routing Problem) with constraints (vehicle capacity, time windows, driver shift)
3. Map: Mapbox/Google Maps with drag-drop order assignment
4. Driver mobile app: turn-by-turn, POD (Proof of Delivery) signature/photo
5. Real-time tracking (GPS) — Fleet integration
6. ETA notifications to customers (SMS/WhatsApp)
7. Failed delivery flow: reschedule, return to warehouse
8. KPIs: stops/hour, fuel cost, on-time %
9. test
```

---

### 9.8 Manufacturing — Real-time Shop Floor

**Target:** `src/app/(dashboard)/v3/manufacturing/shopfloor/page.tsx`

**READY PROMPT:**
```
بناء Shop Floor Control:
1. UI src/app/(dashboard)/v3/manufacturing/shopfloor/page.tsx (TV-friendly)
2. Andon board: machines status (RUNNING/IDLE/DOWN/SETUP) live
3. WIP queue per work center
4. Operator login → start/pause/end operation → posts to MO
5. Defect entry → quality check
6. IoT MQTT subscriber: receive machine signals → update MachineEvent
7. Voice/visual alerts on downtime
8. Performance vs takt time gauge
9. Integration with OEE (5.3)
10. test
```

---

### 9.9 Real Estate — CAM Reconciliation

**Target:** `src/app/(dashboard)/v3/realestate/cam/page.tsx`

**READY PROMPT:**
```
بناء CAM Reconciliation:
1. أضف CAMPool + CAMCharge + CAMReconciliation
2. UI src/app/(dashboard)/v3/realestate/cam/page.tsx
3. Year-end: actual common area expenses (utilities, security, landscaping, mgmt fee)
4. Per tenant share = (tenant.sqm / total occupied sqm) × actual_cost
5. Tenant prepaid CAM (estimated monthly) vs actual → balance due/credit
6. Generate reconciliation invoice or credit note
7. Auto JE: balance per tenant
8. Disputes/audit trail
9. accounting-validator
10. test
```

---

### 9.10 Real Estate — Tenant Portal

**Target:** `src/app/portal/tenant/page.tsx`

**READY PROMPT:**
```
بناء Tenant Portal:
1. Auth via TenantPortalUser
2. Dashboard: lease summary, next payment, balance, maintenance tickets
3. Pay rent online (Mada/STC Pay)
4. Submit maintenance request مع photo/video
5. Track status, ratings on completion
6. Documents (lease, addendums, invoices)
7. CAM reconciliation viewer
8. Multi-language AR/EN
9. test
```

---

### 9.11 Restaurant — Table Management & Reservations

**Target:** `src/app/(dashboard)/v3/restaurant/tables/page.tsx`

**READY PROMPT:**
```
بناء Table Management:
1. أضف Table + Reservation + WaitList في schema (extend موجود)
2. UI floor plan: drag-drop table layout (per branch)
3. Status: AVAILABLE / RESERVED / OCCUPIED / CLEANING
4. Reservation flow: customer info, party size, date/time, deposit (optional)
5. WaitList management: estimated wait, SMS when ready
6. Table turnover analytics
7. Server assignment per table → ties to KDS
8. Split-check support
9. test
```

---

### 9.12 Restaurant — Course Firing & Allergen

**Target:** Extend KDS at `src/app/(dashboard)/v3/restaurant/kds/page.tsx`

**READY PROMPT:**
```
توسيع KDS Course Firing + Allergens:
1. Order has courses: APPETIZER / MAIN / DESSERT / DRINK
2. Fire course on cue (manual or auto by elapsed time)
3. Each item shows allergen icons: G (gluten), N (nuts), D (dairy), V (vegan), VG (vegetarian)
4. Customer allergen flags propagate from order to KDS
5. Kitchen station routing: hot/cold/grill/dessert
6. Bump: complete → notify server
7. Recall (mistake): unbump → reopens
8. Voice command (optional): "bump 2", "recall 5"
9. test
```

---

### 9.13 Retail — Layaway & Gift Receipts

**Target:** Extend POS at `src/app/(dashboard)/v3/retail/pos/page.tsx`

**READY PROMPT:**
```
توسيع POS:
1. Layaway flow:
   - Customer reserves item with deposit
   - JE: Dr 1010 Cash / Cr 2410 Layaway Liability
   - Schedule installments
   - On final payment: full sale + remove from layaway inventory
   - Cancel: refund partial, restocking fee
2. Gift receipt: hides price, allows return without receipt
3. Multi-tender payment: mix cash + card + voucher + loyalty points
4. Customer display (second screen) showing items + total
5. ZATCA: layaway final = invoice ZATCA-cleared
6. accounting-validator
7. test
```

---

### 9.14 Retail — Loyalty Redemption

**Target:** `src/app/(dashboard)/v3/retail/loyalty/page.tsx`

**Schema:** LoyaltyAccount, LoyaltyTransaction موجودة (assumed).

**READY PROMPT:**
```
بناء Loyalty:
1. UI src/app/(dashboard)/v3/retail/loyalty/page.tsx
2. Tiers (BRONZE/SILVER/GOLD/PLATINUM) by annual spend
3. Earn rules: per SAR spent, bonus on category, double-points day
4. Redemption: points → discount or product
5. Expiry rules per tier
6. POS integration: barcode scan customer card → balance shown
7. JE on redemption:
   Dr 4910 Loyalty Discount / Cr 1010 Cash (offset)
8. Birthday/anniversary auto-bonus
9. accounting-validator
10. test
```

---

### 9.15 School — Gradebook

**Target:** `src/app/(dashboard)/v3/school/gradebook/page.tsx`

**READY PROMPT:**
```
بناء Gradebook:
1. أضف ClassSubject + Assessment + Grade في schema
2. UI src/app/(dashboard)/v3/school/gradebook/page.tsx
3. Per teacher: classes → subjects → students grid
4. Assessment types: HOMEWORK / QUIZ / MIDTERM / FINAL / PARTICIPATION
5. Weights per type (configurable per subject)
6. Calc: weighted final grade, GPA
7. Saudi MOE grading scale (95-100 = A+, 90-94 = A, ...)
8. Publish to parent portal
9. Bulk import grades (CSV)
10. test
```

---

### 9.16 School — Transcript Generator

**Target:** `src/app/(dashboard)/v3/school/transcripts/page.tsx`

**READY PROMPT:**
```
بناء Transcript Generator:
1. UI src/app/(dashboard)/v3/school/transcripts/page.tsx
2. Per student: all years, subjects, grades, GPA, total credits
3. Saudi MOE template + bilingual AR/EN
4. Cumulative GPA + per-term
5. Honors (مرتبة الشرف) auto-flag if GPA > 4.5
6. Sealed PDF with school stamp
7. QR verification → tamper-proof
8. Bulk generation per graduating class
9. test
```

---

### 9.17 School — Parent Portal

**Target:** `src/app/portal/parent/page.tsx`

**READY PROMPT:**
```
بناء Parent Portal:
1. Auth via ParentPortalUser
2. Dashboard: kids list مع quick stats
3. Per child: attendance %, grades, assignments, behavior
4. Fee invoices + online payment (Mada/STC Pay)
5. Communication: messages with teachers
6. Bus tracking (real-time GPS)
7. Permission slips (digital signature)
8. Multi-language AR/EN
9. Push notifications
10. test
```

---

### 9.18 Services — Work Order Management

**Target:** `src/app/(dashboard)/v3/services/workorders/page.tsx`

**READY PROMPT:**
```
بناء Work Order Mgmt:
1. أضف WorkOrder + WorkOrderTask + Technician في schema
2. UI src/app/(dashboard)/v3/services/workorders/page.tsx
3. Types: INSTALLATION / REPAIR / MAINTENANCE / INSPECTION
4. Assign technician (skills match)
5. Schedule + dispatch (map view)
6. Mobile app for tech: photos before/after, parts used, time logged
7. Materials issued from inventory
8. Customer signature on completion
9. Invoice generation (T&M or fixed)
10. accounting-validator
11. test
```

---

### 9.19 Services — SLA Tracking

**Target:** Extend `src/app/(dashboard)/v3/services/sla/page.tsx`

**READY PROMPT:**
```
بناء SLA Tracking:
1. أضف SLAPolicy { responseHours, resolutionHours, breachPenalty }
2. ServiceTicket: link to SLA per priority
3. Timer auto: response, resolution
4. Escalation: 50% / 80% / 100% threshold → notify chain
5. Dashboard: SLA compliance %, breaches, MTTR (mean time to resolve)
6. Penalty calc per breach for credit notes
7. Customer-facing SLA report
8. test
```

---

### 9.20 Services — Project Time & Billing

**Target:** Extend `src/app/(dashboard)/v3/services/timesheet/page.tsx`

**READY PROMPT:**
```
توسيع Timesheet:
1. Approval workflow (Tier1.1) — manager approves before billing
2. Billing rates: per role per client (ResourceRate model)
3. Project WBS: phases → deliverables → tasks
4. Utilization dashboard: billable / total hours per resource
5. Realization: billed / billable
6. Invoice generation from approved timesheet:
   - JE: Dr 1210 AR / Cr 4010 Service Revenue + 2310 VAT
7. Retainer/trust account integration (existing)
8. accounting-validator
9. test
```

---

## PART 10 — Reports & Analytics (Cross-cutting)

### 10.1 Financial Statement Footnotes

**READY PROMPT:**
```
بناء Footnote Builder:
1. UI src/app/(dashboard)/reports/footnotes/page.tsx
2. Categories: Significant accounting policies, Related parties, Contingencies, Subsequent events
3. Templates per IFRS/SOCPA section
4. Auto-population: Related parties from Customer/Vendor.isRelatedParty
5. Export with Annual Report
6. test
```

---

### 10.2 Segment Reporting

**READY PROMPT:**
```
بناء Segment Reporting:
1. Segments: by business unit / geography / product
2. Allocate revenue/cost per segment
3. UI src/app/(dashboard)/reports/segments/page.tsx
4. IFRS 8 disclosures
5. test
```

---

### 10.3 KPI Dashboard Builder

**READY PROMPT:**
```
بناء KPI Dashboard Builder:
1. UI src/app/(dashboard)/reports/kpi-builder/page.tsx
2. Drag-drop widgets: chart, gauge, table, scorecard
3. Data source: any API endpoint or SQL view
4. Schedule refresh
5. Share link / embed
6. Mobile responsive
7. test
```

---

## PART 11 — التنفيذ المقترح (Roadmap)

### Phase 0 — Foundation (Tier 1) — 6 أسابيع
- [x] Numbering Sequences Engine (1.6)
- [x] Document State Machine (1.7)
- [x] Audit Trail Reporting (1.3)
- [x] Approval Workflow Inbox (1.1)
- [x] Period Close Checklist (1.5)

### Phase 1 — Core ERP Hardening — 8 أسابيع
- [x] Credit Limit Enforcement (2.2)
- [x] Pricing Engine (2.1)
- [x] Three-Way Match Workflow (3.3)
- [x] Landed Cost Allocation (3.4)
- [x] Budget Variance Dashboard (1.2)
- [x] FEFO Allocation (4.2)
- [x] ABC Analysis (4.1)

### Phase 2 — Manufacturing Excellence — 6 أسابيع
- [x] BOM Versioning (5.1)
- [x] Capacity Gantt (5.2)
- [x] OEE Dashboard (5.3)
- [x] Scrap Tracking (5.4)

### Phase 3 — Finance Maturity — 6 أسابيع
- [x] Intercompany Elimination (6.1)
- [x] Cash Flow Forecast (6.2)
- [x] Bank Recon Rules (6.3)
- [x] ECL Automation (6.4)
- [x] FX Revaluation (6.5)
- [x] Cost Center Allocations (6.6)

### Phase 4 — HR & CRM — 6 أسابيع
- [x] Org Chart (7.1)
- [x] Performance 360 (7.2)
- [x] ATS (7.3)
- [x] CRM Lead Mgmt (8.1)
- [x] Opportunity Kanban (8.2)
- [x] Customer Portal (8.3)

### Phase 5 — Verticals — 12 أسابيع
- [x] Clinic: Appointments + e-Rx + Lab (9.1-9.3)
- [x] Construction: Variations + Progress Billing (9.4-9.5)
- [x] Distribution: Wave Picking + Routes (9.6-9.7)
- [x] Manufacturing: Shop Floor (9.8)
- [x] Real Estate: CAM + Tenant Portal (9.9-9.10)
- [x] Restaurant: Tables + Course Firing (9.11-9.12)
- [x] Retail: Layaway + Loyalty (9.13-9.14)
- [x] School: Gradebook + Transcript + Parent Portal (9.15-9.17)
- [x] Services: WO + SLA + Billing (9.18-9.20)

### Phase 6 — Reports & Polish — 4 أسابيع
- [x] Footnotes (10.1)
- [x] Segments (10.2)
- [x] KPI Builder (10.3)
- [x] Customer Statement Bulk (2.5)
- [x] Sales Forecast (2.6)

**إجمالي:** ~48 أسبوع (12 شهر) للوصول لمستوى عالمي.

---

## PART 12 — كيفية الاستخدام

### للمستخدم
1. اختر ميزة من القائمة → انسخ "READY PROMPT"
2. الصقه في Claude Code
3. Claude سيتبع الـ methodology في `CLAUDE.md`:
   - يقرأ Gap Analysis
   - يصمم schema
   - يستخدم accounting-validator agent
   - يكتب tests
   - يعرض diff قبل commit

### للـ Agents
- **erp-architect** — يستخدم لأي ميزة Tier 1
- **accounting-validator** — يستخدم لكل ميزة فيها JE
- **saudi-compliance** — يستخدم لكل ميزة فيها VAT/GOSI/WPS/ZATCA
- **prisma-schema-reviewer** — قبل migration
- **test-writer** — لكل ميزة

### للـ Commits
كل feature تتبع:
```
feat(module): brief description

- Schema changes: ...
- API endpoints: ...
- UI: ...
- Tests: ...
- Compliance: ZATCA/SOCPA/GOSI ...

Closes: TODO #
```

---

**نهاية المكتبة — 65+ feature ready to build.**
