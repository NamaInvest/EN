# 4️⃣ Workflow & Orchestration | تنسيق سير العمل

## 🔍 الحالة الحالية

### ✅ الموجود
- **BullMQ Queues** في [src/lib/queue/index.ts](../src/lib/queue/index.ts):
  - emailQueue, pdfQueue, syncQueue, reportQueue (4 production queues)
- **Cron Jobs:** 16 cron route في `/api/cron/`
- **DocumentStateMachine** model في Prisma
- **ApprovalWorkflow** و **ApprovalRequest** models

### 🔴 الفجوات الحرجة
| الفجوة | الموقع |
|--------|--------|
| AI Job Queue stub فقط | [src/lib/ai-job-queue.ts](../src/lib/ai-job-queue.ts) |
| State Machine في Schema لكن غير مُنفّذ في الكود | لا enforcer |
| Approval Workflow Runtime غير موجود | لا engine |
| لا Saga Pattern للعمليات الموزّعة | — |
| لا Compensating Actions | — |
| لا Workflow Designer UI | — |

---

## 🎯 الخطة التفصيلية

### البنية المقترحة
```
src/lib/workflow/
  ├── engine/
  │   ├── runtime.ts                  [Workflow execution engine]
  │   ├── state-machine.ts            [Generic FSM]
  │   ├── transition-validator.ts
  │   └── history.ts                  [Audit trail of transitions]
  ├── approval/
  │   ├── runtime.ts                  [Approval flow runner]
  │   ├── escalation.ts               [Auto-escalate after timeout]
  │   ├── delegation.ts               [Delegate to substitute]
  │   └── notifications.ts
  ├── saga/
  │   ├── coordinator.ts              [Saga orchestrator]
  │   ├── compensator.ts              [Rollback steps]
  │   └── retry-policy.ts
  ├── workflows/
  │   ├── invoice-process.workflow.ts
  │   ├── month-close.workflow.ts
  │   ├── payroll-run.workflow.ts
  │   ├── purchase-order.workflow.ts
  │   └── hr-onboarding.workflow.ts
  └── designer/
      └── (admin UI for visual workflow design)

src/workers/ai/
  ├── daily-audit.worker.ts
  ├── embed-knowledge.worker.ts
  ├── ocr-batch.worker.ts
  ├── fraud-scan.worker.ts
  └── cfo-report.worker.ts
```

---

## 🔄 State Machine Engine

```typescript
// src/lib/workflow/engine/state-machine.ts
export interface StateTransition {
  docType: string;
  fromState: string;
  toState: string;
  action: string;
  guards?: ((ctx: any) => Promise<boolean>)[];
  effects?: ((ctx: any) => Promise<void>)[];
  requiredPermissions?: string[];
}

export class StateMachine {
  constructor(private docType: string) {}

  async transition(
    recordId: string,
    fromState: string,
    toState: string,
    action: string,
    ctx: BusinessContext
  ): Promise<TransitionResult> {
    // 1. اقرأ القاعدة من DocumentStateMachine
    const rule = await prisma.documentStateMachine.findUnique({
      where: { docType_fromState_toState: { docType: this.docType, fromState, toState } },
    });

    if (!rule) {
      throw new InvalidTransitionError(this.docType, fromState, toState);
    }

    // 2. تحقق من الصلاحيات
    if (rule.requiredPermissions?.length) {
      const allowed = rule.requiredPermissions.every(p => ctx.user.permissions.includes(p));
      if (!allowed) throw new PermissionDeniedError();
    }

    // 3. شغّل Guards
    for (const guard of rule.guards || []) {
      if (!await guard(ctx)) throw new GuardFailedError(action);
    }

    // 4. نفّذ Transition داخل transaction
    return await prisma.$transaction(async (tx) => {
      // Update record state
      await tx[this.docType].update({
        where: { id: recordId },
        data: { status: toState, updatedAt: new Date() },
      });

      // Log to audit
      await tx.fieldAuditTrail.create({
        data: {
          tableName: this.docType,
          recordId,
          fieldName: 'status',
          oldValue: fromState,
          newValue: toState,
          changedBy: ctx.user.id,
          changedAt: new Date(),
        },
      });

      // 5. شغّل Effects
      for (const effect of rule.effects || []) {
        await effect(ctx);
      }

      return { success: true, newState: toState };
    });
  }
}
```

---

## ✅ Approval Workflow Runtime

```typescript
// src/lib/workflow/approval/runtime.ts
export class ApprovalRuntime {
  async submit(request: ApprovalRequest): Promise<void> {
    const workflow = await this.findWorkflow(request);
    const approvers = await this.computeApprovers(workflow, request);

    for (const approver of approvers) {
      await prisma.approvalStep.create({
        data: {
          requestId: request.id,
          approverId: approver.userId,
          level: approver.level,
          status: 'PENDING',
          timeoutAt: addHours(new Date(), workflow.timeoutHours || 48),
        },
      });

      await this.notify(approver);
    }
  }

  async approve(stepId: string, userId: string, comment?: string): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      const step = await tx.approvalStep.findUnique({ where: { id: stepId } });

      if (step.approverId !== userId) throw new UnauthorizedError();
      if (step.status !== 'PENDING') throw new InvalidStateError();

      await tx.approvalStep.update({
        where: { id: stepId },
        data: { status: 'APPROVED', approvedAt: new Date(), comment },
      });

      // هل بقي خطوات؟
      const pending = await tx.approvalStep.count({
        where: { requestId: step.requestId, status: 'PENDING' },
      });

      if (pending === 0) {
        // كل الخطوات مكتملة → نفّذ الـ action النهائي
        await this.executeFinalAction(step.requestId);
      }
    });
  }

  async escalate(stepId: string): Promise<void> {
    // يُستدعى من cron job
    const step = await prisma.approvalStep.findUnique({ where: { id: stepId } });
    if (step.status === 'PENDING' && step.timeoutAt < new Date()) {
      const escalateTo = await this.findEscalationTarget(step);
      await prisma.approvalStep.update({
        where: { id: stepId },
        data: { approverId: escalateTo, escalatedAt: new Date() },
      });
      await this.notify(escalateTo);
    }
  }
}
```

---

## 🔁 Saga Pattern

```typescript
// src/lib/workflow/saga/coordinator.ts
export interface SagaStep<T = any> {
  name: string;
  execute: (ctx: T) => Promise<T>;
  compensate: (ctx: T) => Promise<void>;
}

export class Saga<T> {
  private steps: SagaStep<T>[] = [];
  private executed: SagaStep<T>[] = [];

  addStep(step: SagaStep<T>): this {
    this.steps.push(step);
    return this;
  }

  async run(initialContext: T): Promise<T> {
    let ctx = initialContext;

    try {
      for (const step of this.steps) {
        logger.info(`Saga step: ${step.name}`);
        ctx = await step.execute(ctx);
        this.executed.push(step);
      }
      return ctx;
    } catch (error) {
      logger.error(`Saga failed at step. Compensating...`, { error });
      // اعكس الخطوات بالعكس
      for (const step of this.executed.reverse()) {
        try {
          await step.compensate(ctx);
        } catch (compErr) {
          logger.error(`Compensation failed: ${step.name}`, { compErr });
          // تنبيه فريق الدعم
          await alertOps('Saga compensation failed', { saga: this.name, step: step.name });
        }
      }
      throw error;
    }
  }
}

// مثال: فاتورة مبيعات → خصم مخزون → قيد محاسبي → ZATCA
const invoiceSaga = new Saga<InvoiceContext>()
  .addStep({
    name: 'create_invoice',
    execute: async (ctx) => ({ ...ctx, invoice: await createInvoice(ctx.data) }),
    compensate: async (ctx) => await deleteInvoice(ctx.invoice.id),
  })
  .addStep({
    name: 'reduce_inventory',
    execute: async (ctx) => ({ ...ctx, movements: await reduceStock(ctx.invoice) }),
    compensate: async (ctx) => await reverseStockMovements(ctx.movements),
  })
  .addStep({
    name: 'post_journal_entry',
    execute: async (ctx) => ({ ...ctx, je: await postSalesJE(ctx.invoice) }),
    compensate: async (ctx) => await reverseJournalEntry(ctx.je.id),
  })
  .addStep({
    name: 'submit_zatca',
    execute: async (ctx) => ({ ...ctx, zatca: await submitToZATCA(ctx.invoice) }),
    compensate: async (ctx) => await markZATCAPending(ctx.invoice.id),
  });

await invoiceSaga.run({ data: invoiceData });
```

---

## 🤖 AI Workers (BullMQ-based)

```typescript
// src/workers/ai/daily-audit.worker.ts
import { Worker } from 'bullmq';

export const dailyAuditWorker = new Worker(
  'ai-daily-audit',
  async (job) => {
    const { tenantId, date } = job.data;

    const context = await buildBusinessContext({ tenantId } as any);
    const result = await invokeChain('audit.daily', { context });

    await prisma.aiAuditReport.create({
      data: {
        tenantId,
        date,
        report: result.text,
        alerts: result.alerts,
        cost: result.cost,
      },
    });

    if (result.alerts.some(a => a.level === 'critical')) {
      await sendTelegramAlert(tenantId, result.alerts);
    }
  },
  { connection: redisConnection, concurrency: 2 }
);

// Schedule: cron call /api/cron/ai-daily-audit يضيف للـ queue
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| AI Workers فعّالة | 0 | 5 |
| State transitions مُنفّذة | لا | كل الـ docTypes |
| Approval Workflow Runtime | لا | كامل + escalation |
| Saga patterns | 0 | 4+ |
| Compensating actions | لا | كل saga |
| Workflow audit trail | لا | كامل |

---

## ⏱️ الجدول الزمني
- **المدة:** 25 يوم عمل
- **الفريق:** 2 backend
- **الأولوية:** 🔴 عالية

---

## ✅ معايير القبول
- [ ] State Machine Engine مع 100% test coverage
- [ ] Approval Workflow Runtime مع escalation
- [ ] 4 saga patterns حية (invoice, payroll, month-close, purchase)
- [ ] 5 AI Workers يعملون يومياً
- [ ] لا تحويلات state غير مُسجّلة
- [ ] Workflow Designer UI (basic)
