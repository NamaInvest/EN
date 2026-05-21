# F2 — Business Flows

## الحالة الحالية
- `BUSINESS_FLOWS_GUIDE.md` ✓ (18 فلو موصوفة)
- `docs/MASTER_PACK/08-business-flows/` (4 nodes)
- `.ai-brain/05-business-logic.md`
- لا BPMN 2.0 XML
- لا تمثيل بصري قابل للتعديل

## الفلوهات الـ18 الموجودة
1. Quote-to-Cash (Q2C)
2. Procure-to-Pay (P2P)
3. Hire-to-Retire (H2R)
4. Record-to-Report (R2R)
5. Plan-to-Produce (P2P MFG)
6. Acquire-to-Retire (Assets)
7. POS Flow
8. JE Approval Workflow
9. Period Close (16-step)
10. ZATCA Submission
11. WPS Run
12. Invoice State Machine
13. MO State Machine
14. Bank Reconciliation
15. Customer Onboarding
16. Approval Routing
17. Three-Way Match
18. Architecture Flow

## الفجوة
- لا BPMN لكل flow (للمحللين)
- لا Mermaid sequence diagrams
- لا coverage matrix flow→test
- لا simulation للـ what-if

## 🎯 Ready Prompt

```
المهمة: تحويل 18 فلو إلى deliverables قابلة للتنفيذ.

السياق:
- BUSINESS_FLOWS_GUIDE.md يصف الفلوهات نصياً
- LangGraph chains (A2) ستنفذها

المخرجات لكل فلو من الـ 18:

1) BPMN 2.0 XML:
   docs/MASTER_PACK/08-business-flows/bpmn/<flow>.bpmn
   - قابل للتعديل في bpmn.io
   - يتضمن lanes (روابط الأدوار)
   - boundary events للأخطاء
   - decision gateways

2) Mermaid sequence diagram:
   docs/MASTER_PACK/08-business-flows/sequence/<flow>.md
   مثال Q2C:
   ```mermaid
   sequenceDiagram
     Customer->>POS: Order request
     POS->>CreditCheck: Check limit
     CreditCheck-->>POS: OK
     POS->>Inventory: Reserve stock
     POS->>SalesInvoice: Create
     SalesInvoice->>AutoJournal: Post JE
     SalesInvoice->>ZATCA: Submit
     ZATCA-->>SalesInvoice: ICV+UUID
     SalesInvoice-->>Customer: Receipt + QR
   ```

3) State machine (XState):
   docs/MASTER_PACK/08-business-flows/state-machines/<flow>.ts
   - export const machine = createMachine({ ... })
   - يُستخدم في src/lib/chains/

4) Coverage matrix:
   docs/MASTER_PACK/08-business-flows/COVERAGE_MATRIX.md
   لكل flow:
   | Flow | API endpoints | UI pages | Tests | Stories | Status |
   | Q2C | /api/sales/*, /api/pos/* | /pos, /sales | tests/e2e/q2c.spec.ts | US-q2c-* | ✅ |

5) Interactive flow simulator:
   src/app/(dashboard)/admin/flow-simulator/page.tsx:
   - Select flow
   - Set initial state + inputs
   - Step through nodes
   - See state changes + outputs
   - Useful for training + debugging

6) Flow versioning:
   كل تغيير في BPMN/state-machine = ADR
   docs/MASTER_PACK/08-business-flows/changelog/<flow>-v<N>.md

القيود:
- BPMN must validate (use camunda validator)
- Mermaid diagrams render correctly in GitHub
- State machines have no orphan states
- Every flow has reverse (cancel/refund) path
```

## السيناريو

محلل أعمال جديد ينضم للفريق:

1. يفتح `docs/MASTER_PACK/08-business-flows/bpmn/quote-to-cash.bpmn`
2. يفتحه في bpmn.io (free)
3. يرى الـ flow كاملاً:
   - 12 task
   - 3 gateway
   - 2 boundary event (credit-limit, out-of-stock)
4. يقترح تعديل: إضافة "loyalty check" بعد credit check
5. يحفظ النسخة المعدّلة → يرفعها كـ PR
6. Dev يحوّل التعديل إلى code (state machine + chain)
7. PM يوافق على ADR

CFO يريد يفهم WPS:
1. يفتح `docs/MASTER_PACK/08-business-flows/sequence/wps-run.md`
2. يرى Mermaid diagram يُعرض في GitHub
3. كل خطوة مُوضحة: من → إلى → ما الذي يحدث
4. يفهم في 5 دقائق بدلاً من قراءة 50 صفحة كود

## Data Flow

```
[Flow execution]
User triggers action (e.g. "Run Payroll")
   ↓
src/lib/chains/payment-run.chain.ts (from A2)
   ↓
XState machine starts
   ↓
For each transition:
   - log event to outbox
   - record to flow_executions table
   ↓
On completion:
   - emit final event
   - audit log

[Flow analytics]
flow_executions table grows
   ↓
Daily aggregation:
   - avg duration per flow
   - bottleneck nodes (longest avg)
   - failure rates per node
   - common error paths
   ↓
/admin/flow-analytics dashboard
   ↓
PM identifies slow nodes → optimization

[Flow simulation]
Dev opens /admin/flow-simulator
   ↓
Selects flow: Q2C
   ↓
Sets inputs: customer=#123, products=[{id:5,qty:2}]
   ↓
Click "Step Through"
   ↓
For each node:
   show inputs → action → outputs
   highlight in BPMN diagram
   ↓
Final state: invoice created, JE posted, ZATCA UUID
   ↓
Useful for training new staff + debugging issues
```

## ملفات المُنتَج

- `docs/MASTER_PACK/08-business-flows/bpmn/<flow>.bpmn` × 18
- `docs/MASTER_PACK/08-business-flows/sequence/<flow>.md` × 18
- `docs/MASTER_PACK/08-business-flows/state-machines/<flow>.ts` × 18
- `docs/MASTER_PACK/08-business-flows/COVERAGE_MATRIX.md`
- `docs/MASTER_PACK/08-business-flows/changelog/`
- `src/app/(dashboard)/admin/flow-simulator/page.tsx`
- `src/app/(dashboard)/admin/flow-analytics/page.tsx`
- `prisma/schema.prisma` — FlowExecution model (new)
