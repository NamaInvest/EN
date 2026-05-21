# A2 — Workflow & Orchestration (LangChain / Chaining)

## الحالة الحالية
- `src/services/shared/event-bus.service.ts` ✓ (يلامس 35 community في graphify)
- `BUSINESS_FLOWS_GUIDE.md` ✓ (18 فلو موصوف)
- لا توجد LangGraph chains صريحة
- لا يوجد Saga compensation موحد

## الفجوة (مقابل NetSuite SuiteFlow / Oracle BPM)
- Workflows غير مرئية كـ state machines قابلة للتعديل
- لا يوجد LangGraph للـ AI orchestration
- Saga rollback يدوي لكل عملية

## 🎯 Ready Prompt

```
المهمة: ابني LangGraph chains لكل فلو من 18 فلو أعمال.

السياق:
- اقرأ BUSINESS_FLOWS_GUIDE.md (18 فلو)
- الـ services موجودة في src/services/<domain>/*.service.ts
- event-bus.service.ts موجود

المخرجات:
لكل flow من هذه القائمة:
[Quote-to-Cash, Procure-to-Pay, Hire-to-Retire, Record-to-Report,
 Plan-to-Produce, Acquire-to-Retire, POS, JE Approval, Period Close,
 ZATCA Submission, WPS Run, Invoice State, MO State, Bank Recon,
 Customer Onboarding, Approval Routing, Three-Way Match, Architecture]

إنشاء: src/lib/chains/<flow>.chain.ts

كل chain يحتوي:
- State: { tenantId, actor, payload, results, audit, errors }
- Nodes (في الترتيب): VALIDATE → AUTHORIZE → EXECUTE → POST_JE → NOTIFY → AUDIT
- Edges: conditional routing (approval gates, validation gates)
- Pausable state persisted to ChainState model (إضافة للـ schema)
- Saga compensation: كل node لها .compensate() للـ rollback
- Integration:
  - src/services/<domain> للأكشن
  - src/lib/auto-journal.ts للقيود
  - event-bus.service.ts للأحداث

أضف:
- src/lib/chains/index.ts — runner موحد
- src/app/api/chains/[chain]/route.ts — invoke + resume
- prisma model ChainState
- UI: src/app/(dashboard)/admin/chains/page.tsx (مراقبة الـ chains)

القيود:
- لا node يتجاوز tenant-guard.ts
- كل terminal node يُصدر event للـ outbox
- compensation مُختبَر في حالات الفشل
```

## السيناريو

**Payment Run flow** — تشغيل دفعات الرواتب الشهرية:

1. HR يضغط "Run Payroll" → `POST /api/chains/payment-run/invoke`
2. Chain يبدأ:
   - **VALIDATE**: يفحص budget + period_open + active employees
   - **AUTHORIZE**: يرسل approval requests لـ CFO + HR Manager
   - **[PAUSED]** — Chain ينام، state يُحفظ في DB
3. CFO يفتح `/approvals/[id]` ويوافق → webhook → `/api/chains/payment-run/resume`
4. Chain يستأنف:
   - **EXECUTE**: ينشئ bank file (WPS SIF format)
   - **POST_JE**: يستدعي auto-journal.ts → يُسجّل القيد
   - **NOTIFY**: WhatsApp + Email لكل موظف
   - **AUDIT**: يكتب سجل + يُصدر event
5. لو فشل في POST_JE → Saga: NOTIFY skip + EXECUTE.compensate() يلغي bank file

## Data Flow

```
HTTP POST /api/chains/payment-run/invoke
   ↓
[withRoute + RBAC: hr_officer/cfo/admin]
   ↓
chain.invoke({ tenantId, actor, payload })
   ↓
┌─────────────────────────────────────────────────┐
│  Node: VALIDATE                                 │
│    → ValidationService.checkBudget()            │
│    → PeriodService.assertOpen()                 │
│  Pass? → next                                   │
│  Fail? → return { error, stopped: true }        │
└─────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────┐
│  Node: AUTHORIZE                                │
│    → ApprovalService.request([cfo, hr_mgr])     │
│    → ChainState.save({ status: 'PAUSED' })      │
│    → return { paused: true, resumeUrl }         │
└─────────────────────────────────────────────────┘
   ↓ (HTTP returns immediately)
   ⏸ ───────── waiting for approval ────────────
   ↓ (CFO approves)
POST /api/approvals/[id]/approve
   ↓
   → /api/chains/payment-run/resume?stateId=X
   ↓
┌─────────────────────────────────────────────────┐
│  Node: EXECUTE                                  │
│    → PayrollService.generateSif()               │
│    → BankIntegration.uploadWps()                │
│  Compensation: BankIntegration.cancelUpload()   │
└─────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────┐
│  Node: POST_JE                                  │
│    → auto-journal.createEntry({...})            │
│  Compensation: createReversalEntry()            │
└─────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────┐
│  Node: NOTIFY                                   │
│    → WhatsApp + Email per employee              │
└─────────────────────────────────────────────────┘
   ↓
┌─────────────────────────────────────────────────┐
│  Node: AUDIT                                    │
│    → logAuditAction({ action: 'PAYROLL_RUN' }) │
│    → event-bus.emit('payment.run.completed')   │
└─────────────────────────────────────────────────┘
   ↓
ChainState.save({ status: 'COMPLETED' })
```

## ملفات المُنتَج

- `src/lib/chains/<flow>.chain.ts` × 18
- `src/lib/chains/index.ts`
- `src/app/api/chains/[chain]/route.ts`
- `src/app/(dashboard)/admin/chains/page.tsx`
- `prisma/schema.prisma` — model ChainState (جديد)
