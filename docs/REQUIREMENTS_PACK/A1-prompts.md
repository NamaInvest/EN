# A1 — Prompt Engineering + System Prompt + Context

## الحالة الحالية
- `docs/AI_EXECUTION_STANDARD.md` ✓ (الدستور الهندسي v2.0)
- `docs/AI_EXECUTION_QUICK_CARD.md` ✓
- `docs/MASTER_PACK/01-prompts/` — 12 nodes في graphify (نشط)
- لا يوجد catalog مفهرس لكل موديول

## الفجوة (مقابل SAP Joule / Salesforce Einstein)
- لا توجد مكتبة prompts مرتبة لكل من الـ167 قسم API
- لا يوجد System Prompt موحّد محمّل تلقائياً
- لا يوجد Context Manager (token budget)

## 🎯 Ready Prompt

```
المهمة: ابني Prompt Catalog لكل موديول في Namasoft.

السياق:
- المشروع: Namasoft ERP (Next.js 16 + Prisma)
- 167 API section, 109 dashboard module
- اقرأ public/openapi.json + .ai-brain/14-modules-map.md

المخرجات:
1) src/lib/prompts/system.master.md — System Prompt موحّد:
   - Role: ERP financial assistant for Saudi SMEs
   - Languages: Arabic primary, English secondary
   - Permitted: read TB/journals, propose JE drafts, query reports
   - Forbidden: write controlled accounts, bypass approvals, mix tenants
   - Output JSON schema: {answer_ar, answer_en, citations[], proposed_actions[]}

2) src/lib/prompts/<module>/catalog.json لكل موديول (12 prompt per module):
   intents: CREATE, READ, ANALYZE, RECONCILE, FORECAST, AUDIT,
            EXPLAIN, REVERSE, APPROVE, REJECT, SUMMARIZE, ESCALATE
   كل prompt يحتوي:
   - id, role, intent, system_prompt, user_template (Arabic-first)
   - required_context_files, tools_allowed, expected_output_schema
   - saudi_compliance_tags (ZATCA|GOSI|VAT|SOCPA|PDPL)

3) src/lib/ai/context-manager.ts — مدير الـ context:
   - 16K token budget split:
     - 30% RAG retrieved chunks (top-K=8 reranked)
     - 20% conversation history (last 3 turns)
     - 15% schema hints (relevant Prisma models)
     - 15% policies (.ai-brain/19-claude-rules.md excerpts)
     - 20% reserved for response
   - tiktoken-style token counter
   - graceful truncation (not random cut)

القيود:
- المحاسبة دائماً تشير إلى src/lib/auto-journal.ts
- TenantId لا يُتجاوز أبداً
- لا dependency جديد بلا موافقة
```

## السيناريو

محاسب يكتب في الـ Copilot: **"اشرح لي ليش التزمت السنوية زادت 12%"**

1. الـ AI يستلم الطلب
2. `system.master.md` يُحمّل أولاً (system prompt)
3. `context-manager.ts` يحسب budget:
   - 30% RAG: يستدعي pipeline → 8 chunks (TB current + last year)
   - 15% schema hints: Prisma models لـ Payroll + Employee
   - 15% policies: قواعد GOSI/WPS
4. Intent classifier يطابق "اشرح" → `ANALYZE`
5. يحمل `prompts/payroll/analyze.json`
6. الـ template يُملأ بالـ context
7. Gemini يرد مع: `answer_ar`, `proposed_actions: [{type: 'create_je', payload: {...}}]`
8. الواجهة تعرض الإجابة + زر "اعتماد القيد"

## Data Flow

```
User input (Arabic)
   ↓
/api/ai/copilot/chat (POST)
   ↓
[Auth Gate] withRoute → getUserFromRequest → requireTenantId
   ↓
src/lib/prompts/router.ts
   ↓ (intent classification)
prompts/<module>/<intent>.json (loaded)
   ↓
src/lib/ai/context-manager.ts
   ↓ (budget allocation)
   ├→ src/lib/rag/pipeline.ts (retrieve 8 chunks)
   ├→ src/lib/schema-hints.ts (Prisma model summaries)
   ├→ .ai-brain/19-claude-rules.md (policies)
   └→ conversation history (last 3)
   ↓
[system.master.md prepended] + augmented prompt
   ↓
Gemini 2.5-flash
   ↓
Response: {answer_ar, citations[], proposed_actions[]}
   ↓
UI displays with action buttons
   ↓ (if user clicks "approve")
src/lib/auto-journal.ts → createEntry()
   ↓
Audit log + outbox event
```

## ملفات المُنتَج

- `src/lib/prompts/system.master.md`
- `src/lib/prompts/<module>/catalog.json` (167 files)
- `src/lib/ai/context-manager.ts`
- `src/lib/prompts/router.ts`
