# 46 - State Machines & Workflows

> Document State Machine + Approval Workflows + BPM + Saga Pattern

---

## 🎰 State Machines

### الـ Files:
- `src/lib/state-machine.ts` — Generic state machine
- `src/lib/state-machine-engine.ts` — Engine
- `src/lib/document-state-machine.ts` — للوثائق
- `src/lib/state-machine/` — subdirectory

### الـ Generic State Machine:
```typescript
class StateMachine<S extends string, E extends string> {
    constructor(
        private initialState: S,
        private transitions: Record<S, Partial<Record<E, S>>>
    ) {}
    
    transition(currentState: S, event: E): S {
        const next = this.transitions[currentState]?.[event];
        if (!next) {
            throw new Error(`Invalid transition: ${currentState} -> ${event}`);
        }
        return next;
    }
    
    canTransition(state: S, event: E): boolean {
        return !!this.transitions[state]?.[event];
    }
    
    getValidEvents(state: S): E[] {
        return Object.keys(this.transitions[state] || {}) as E[];
    }
}
```

---

## 📄 Document State Machines

### Sales Invoice:
```
DRAFT
  │  submit
  ▼
SUBMITTED  ── reject ──▶ REJECTED
  │
  │  approve
  ▼
APPROVED
  │
  │  post
  ▼
POSTED ── reverse ──▶ REVERSED
  │
  │  zatca_clear (B2B)
  ▼
CLEARED
  │
  │  payment_received (full)
  ▼
PAID
```

### Purchase Order:
```
DRAFT → APPROVED → ISSUED → ACKNOWLEDGED → DELIVERED → CLOSED
   │       │                                              ↑
   └───────┴──────────► CANCELLED                         │
                                                  COMPLETED ✓
```

### Journal Entry:
```
DRAFT
  │  submit_for_approval
  ▼
PENDING_APPROVAL
  │
  ├─ approve ──▶ APPROVED ── post ──▶ POSTED ── reverse ──▶ REVERSED
  │
  └─ reject ──▶ REJECTED
```

### Manufacturing Order:
```
PLANNED → RELEASED → IN_PROGRESS → QC → COMPLETED → CLOSED
                                    │
                                    └─ FAILED → REWORK
```

### Customer:
```
PROSPECT → LEAD → QUALIFIED → CUSTOMER
                                  │
                                  ├─ CREDIT_HOLD
                                  ├─ DUNNING_L1 → L2 → L3
                                  └─ LEGAL_ACTION
```

### Vacation/Leave:
```
DRAFT
  │  submit
  ▼
SUBMITTED
  │
  ├─ approve_manager ──▶ MANAGER_APPROVED ──▶ HR_REVIEW ──▶ APPROVED
  │
  └─ reject ──▶ REJECTED
                            │
APPROVED ── employee_returns ──▶ COMPLETED
```

---

## 🔄 الاستخدام في الكود

### مثال:
```typescript
const invoiceStateMachine = new DocumentStateMachine('SalesInvoice', {
    DRAFT: { 'submit': 'SUBMITTED', 'cancel': 'CANCELLED' },
    SUBMITTED: { 'approve': 'APPROVED', 'reject': 'REJECTED' },
    APPROVED: { 'post': 'POSTED' },
    POSTED: { 'zatca_clear': 'CLEARED', 'reverse': 'REVERSED' },
    CLEARED: { 'pay_partial': 'PARTIAL_PAID', 'pay_full': 'PAID' },
    PARTIAL_PAID: { 'pay_remaining': 'PAID' },
    // Terminal states:
    REJECTED: {},
    CANCELLED: {},
    REVERSED: {},
    PAID: {}
});

// الاستخدام:
async function approveInvoice(invoiceId: number) {
    const invoice = await prisma.salesInvoice.findUnique({ where: { id: invoiceId }});
    
    if (!invoiceStateMachine.canTransition(invoice.status, 'approve')) {
        throw new BusinessRuleError(
            `Cannot approve invoice in status ${invoice.status}`,
            'INVALID_STATE_TRANSITION'
        );
    }
    
    const newStatus = invoiceStateMachine.transition(invoice.status, 'approve');
    
    await prisma.salesInvoice.update({
        where: { id: invoiceId },
        data: { status: newStatus, approvedAt: new Date() }
    });
    
    // Audit
    await prisma.documentStateLog.create({
        data: {
            documentType: 'SalesInvoice',
            documentId: invoiceId,
            fromStatus: invoice.status,
            toStatus: newStatus,
            event: 'approve',
            actorUserId: getCurrentUserId()
        }
    });
}
```

---

## ✅ Approval Workflows

### النماذج:
```prisma
ApprovalRule {
    documentType: 'PurchaseOrder' | 'PurchaseRequisition' | 'JournalEntry' | 'Vacation' | 'Loan'
    conditions: Json  // { minAmount: 1000, maxAmount: 10000, ... }
    
    approvers: Json  // [{ stepNo, userId, role, fallbackUserId }]
    
    parallelApproval: Boolean  // كل المعتمدين بنفس الوقت
    autoEscalateAfterHours: Int
}

ApprovalRequest {
    documentType, documentId
    requesterId
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    submittedAt, completedAt
    
    steps: ApprovalStep[]
}

ApprovalStep {
    requestId
    stepNo
    approverUserId
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'ESCALATED'
    decidedAt
    comments
    delegatedToUserId
}

ApprovalSLA {
    documentType
    responseTimeHours
    escalationPath: Json
}
```

### مثال Rule:
```json
{
    "documentType": "PurchaseOrder",
    "rules": [
        {
            "condition": { "amount": { "$lt": 5000 } },
            "steps": [{ "stepNo": 1, "role": "DEPARTMENT_MANAGER" }]
        },
        {
            "condition": { "amount": { "$gte": 5000, "$lt": 50000 } },
            "steps": [
                { "stepNo": 1, "role": "DEPARTMENT_MANAGER" },
                { "stepNo": 2, "role": "CFO" }
            ]
        },
        {
            "condition": { "amount": { "$gte": 50000 } },
            "steps": [
                { "stepNo": 1, "role": "DEPARTMENT_MANAGER" },
                { "stepNo": 2, "role": "CFO" },
                { "stepNo": 3, "role": "CEO" }
            ]
        }
    ]
}
```

### الـ Flow:
```typescript
// إنشاء PO يحتاج موافقة:
async function submitForApproval(poId: number) {
    const po = await prisma.purchaseOrder.findUnique({...});
    const rule = await findApplicableRule('PurchaseOrder', po);
    
    if (!rule) {
        // لا تحتاج موافقة
        await postPO(poId);
        return;
    }
    
    // إنشاء request
    const request = await prisma.approvalRequest.create({
        data: {
            documentType: 'PurchaseOrder',
            documentId: poId,
            requesterId: getCurrentUserId(),
            status: 'PENDING',
            steps: { create: rule.steps.map((s, i) => ({
                stepNo: i + 1,
                approverUserId: s.userId,
                status: i === 0 ? 'PENDING' : 'WAITING'
            }))}
        }
    });
    
    // إرسال notification للأول
    await sendNotification(request.steps[0].approverUserId, {
        type: 'APPROVAL_REQUEST',
        documentType: 'PurchaseOrder',
        documentId: poId,
        amount: po.total
    });
    
    return request;
}

async function approve(stepId: number, comments?: string) {
    const step = await prisma.approvalStep.findUnique({
        where: { id: stepId },
        include: { request: { include: { steps: true } } }
    });
    
    // تحديث الخطوة
    await prisma.approvalStep.update({
        where: { id: stepId },
        data: { status: 'APPROVED', decidedAt: new Date(), comments }
    });
    
    // هل آخر خطوة؟
    const allApproved = step.request.steps.every(s => s.status === 'APPROVED' || s.id === stepId);
    
    if (allApproved) {
        // كل الموافقات اكتملت
        await prisma.approvalRequest.update({
            where: { id: step.requestId },
            data: { status: 'APPROVED', completedAt: new Date() }
        });
        
        // طبق الموافقة
        await postPO(step.request.documentId);
        
        // notify requester
        await sendNotification(step.request.requesterId, {
            type: 'APPROVAL_GRANTED',
            documentId: step.request.documentId
        });
    } else {
        // فعّل الخطوة التالية
        const nextStep = step.request.steps.find(s => s.stepNo === step.stepNo + 1);
        if (nextStep) {
            await prisma.approvalStep.update({
                where: { id: nextStep.id },
                data: { status: 'PENDING' }
            });
            
            await sendNotification(nextStep.approverUserId, {
                type: 'APPROVAL_REQUEST',
                documentType: step.request.documentType,
                documentId: step.request.documentId
            });
        }
    }
}
```

---

## ⏱ SLA Tracking

### الـ Cron: `/api/cron/approval-sla` (كل ساعة)
```typescript
async function checkApprovalSLA() {
    const now = new Date();
    
    // ابحث عن requests pending > 24 ساعة
    const breached = await prisma.approvalRequest.findMany({
        where: {
            status: 'PENDING',
            submittedAt: { lt: subHours(now, 24) }
        }
    });
    
    for (const request of breached) {
        // تنبيه approver
        const currentStep = request.steps.find(s => s.status === 'PENDING');
        if (currentStep) {
            await sendUrgentNotification(currentStep.approverUserId, {
                type: 'APPROVAL_OVERDUE',
                request
            });
        }
        
        // إذا > 48 ساعة → escalate
        if (subHours(now, 48) > request.submittedAt) {
            await escalate(request);
        }
    }
}

async function escalate(request) {
    // ابحث عن manager للـ current approver
    const currentStep = request.steps.find(s => s.status === 'PENDING');
    const approver = await prisma.user.findUnique({ where: { id: currentStep.approverUserId }});
    
    // delegate للـ manager
    if (approver.managerId) {
        await prisma.approvalStep.update({
            where: { id: currentStep.id },
            data: { 
                delegatedToUserId: approver.managerId,
                status: 'ESCALATED'
            }
        });
        
        // notify
        await sendNotification(approver.managerId, { type: 'APPROVAL_ESCALATED', request });
    }
}
```

---

## 📱 Delegation (تفويض)

### النموذج:
```prisma
UserDelegation {
    grantorUserId  // المفوّض
    granteeUserId  // المفوض إليه
    permissions: Json  // ['approve_po', 'approve_je']
    validFrom, validTo
    reason  // 'إجازة', 'سفر', 'مهمة'
}
```

### الاستخدام:
```typescript
// المدير يفوّض المساعد خلال الإجازة:
await prisma.userDelegation.create({
    data: {
        grantorUserId: 5,  // المدير
        granteeUserId: 8,  // المساعد
        permissions: ['approve_po', 'approve_pr'],
        validFrom: new Date('2026-05-15'),
        validTo: new Date('2026-05-30'),
        reason: 'إجازة سنوية'
    }
});

// خلال الإجازة، طلبات الموافقة تذهب للـ grantee
```

---

## 🌐 BPM (Business Process Management)

### الـ Files:
- `src/lib/bpm-engine.ts`
- `src/lib/bpmn-engine.ts`
- `src/lib/workflow-builder-engine.ts`

### المسار: `/settings/workflow-builder`

### الفكرة:
- نظام لبناء workflows مخصصة بدون كود
- Drag-and-drop interface
- مشابه لـ Zapier / n8n لكن داخلي

### الـ Visual Editor (مخطط):
```
[Trigger: New Customer]
    ↓
[Action: Check Credit]
    ↓ (if OK)
[Action: Send Welcome Email]
    ↓
[Wait: 24 hours]
    ↓
[Action: Send Follow-up SMS]
```

### النموذج:
```prisma
Workflow {
    name, description
    triggerType: 'EVENT' | 'SCHEDULE' | 'MANUAL' | 'WEBHOOK'
    triggerConfig: Json
    nodes: WorkflowNode[]
    active
}

WorkflowNode {
    workflowId
    nodeId, type: 'TRIGGER' | 'ACTION' | 'CONDITION' | 'WAIT' | 'LOOP'
    config: Json
    position: { x, y }
}

WorkflowExecution {
    workflowId
    triggeredAt, completedAt
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
    context: Json  // متغيرات
    logs: Json
}
```

### الـ Node Types:
- **Triggers:** New Customer, New Invoice, Stock Low, etc.
- **Actions:** Send Email, Create Record, Update Record, Call Webhook
- **Conditions:** If/Then/Else
- **Loops:** For Each
- **Wait:** Delay, Wait for Event
- **Code:** Custom JavaScript (للمتقدمين)

### الحالة:
- 🟡 Schema جاهز
- 🟡 UI placeholder
- ❌ Engine ناقص

---

## 🔁 Saga Pattern

### الـ File: `src/lib/saga-orchestrator.ts`

### الفكرة:
- للعمليات الموزعة طويلة المدى
- كل خطوة لها compensation (التراجع)
- إذا فشل أي خطوة → rollback

### مثال:
```typescript
// إنشاء عميل مع integration مع 3 أنظمة:
const saga = new Saga('CreateCustomer')
    .step('create-in-db', {
        execute: () => createCustomerInDB(data),
        compensate: (customer) => deleteCustomerFromDB(customer.id)
    })
    .step('sync-to-crm', {
        execute: (ctx) => syncToCRM(ctx.customer),
        compensate: (crmId) => deleteFromCRM(crmId)
    })
    .step('create-in-billing', {
        execute: (ctx) => createInBilling(ctx.customer),
        compensate: (billingId) => deleteFromBilling(billingId)
    })
    .step('send-welcome-email', {
        execute: (ctx) => sendWelcomeEmail(ctx.customer),
        // لا compensation لـ email
    });

try {
    const result = await saga.execute(initialData);
    // success!
} catch (e) {
    // saga أوتوماتيكي يـ rollback
}
```

### الاستخدامات:
- Tenant Provisioning (DB + Master + Email + ...)
- Order Fulfillment (Reserve + Pay + Ship + Notify)
- Payroll Processing (Calc + Approve + Bank + Notify)

---

## 📋 Activity Log

### الـ Pattern:
كل state transition يُسجل:
```prisma
DocumentStateLog {
    documentType, documentId
    fromStatus, toStatus
    event
    actorUserId
    timestamp
    comments
    
    @@index([documentType, documentId])
}
```

### الـ Use Cases:
- عرض history للوثيقة
- Audit trail
- تحليل bottlenecks (أي خطوة بطيئة؟)
- Compliance

---

## 🎯 Best Practices

1. ✅ **State Machine موحد** لكل document type
2. ✅ **Approval Rules مرنة** (قابلة للتخصيص)
3. ✅ **SLA tracking** للموافقات
4. ✅ **Delegation** للإجازات والسفر
5. ✅ **Activity Log** لكل تغيير
6. ✅ **Saga للعمليات الموزعة**
7. ✅ **Visual Workflow Builder** للـ non-developers
8. ❌ **لا state transitions** خارج الـ state machine
9. ❌ **لا حذف للـ activity log**
10. ✅ **Test all transitions** بـ unit tests
