# 36 - بنية الذكاء الاصطناعي (AI Architecture Deep Dive)

> Chains + RAG + Vector + Prompts + Multi-Agent + MCP — البنية التحتية للـ AI

---

## 🏗 الهرم المعماري للـ AI

```
┌─────────────────────────────────────┐
│   User-Facing AI Features            │
│  (Copilot, CFO, Auditor, NLQ, ...)  │
├─────────────────────────────────────┤
│   AI Engines (src/lib/ai/)           │
│  (finetuning, governance, vision)    │
├─────────────────────────────────────┤
│   LangChain Orchestrator             │
│  (chains, agents, tools)             │
├─────────────────────────────────────┤
│   RAG Pipeline                       │
│  (retrieval + augmentation)          │
├─────────────────────────────────────┤
│   Vector Store (pgvector)            │
│  (embeddings + similarity search)    │
├─────────────────────────────────────┤
│   Prompt Library                     │
│  (registry + cache + ab-testing)     │
├─────────────────────────────────────┤
│   LLM Provider (Gemini)              │
│  + cost tracking + quotas            │
└─────────────────────────────────────┘
```

---

## 🔗 LangChain Orchestrator

### الـ Files:
| الملف | الغرض |
|---|---|
| `langchain-orchestrator.ts` | تنسيق Chains |
| `langchain-chains.ts` | Chains المعرفة |
| `src/lib/orchestrator/index.ts` | core |
| `src/lib/orchestrator/streaming.ts` | Streaming responses |
| `src/lib/orchestrator/tool-registry.ts` | تسجيل الأدوات |
| `src/lib/orchestrator/tools/` | الأدوات الفعلية |

### الـ Chains (في `src/lib/chains/`):
| المجلد | الغرض |
|---|---|
| `base/chain.interface.ts` | الواجهة الأساسية |
| `sequential/invoice-process.chain.ts` | معالجة الفاتورة بالتسلسل |
| `parallel/multi-report.chain.ts` | تقارير متعددة بالتوازي |
| `react/` | ReAct pattern (Reasoning + Acting) |
| `reflexion/` | Reflexion (Self-improvement) |
| `router/` | Router (يختار chain مناسب) |

### مثال Sequential Chain:
```typescript
// Invoice Processing Chain:
1. OCR على صورة الفاتورة → Gemini Vision
2. استخراج المعلومات (supplier, items, totals)
3. التحقق من الـ VAT calculation
4. مطابقة مع PO
5. إنشاء PurchaseInvoice في النظام
6. JE تلقائي
7. إرسال تأكيد
```

### مثال Parallel Chain:
```typescript
// Multi-Report Generation:
// تنفذ بالتوازي لـ سرعة أعلى:
- Sales report
- Purchases report
- Inventory report
- Treasury report
- Aggregated dashboard
```

### مثال ReAct Agent:
```typescript
User: "ما هي مبيعات اليوم؟"
Agent:
  Thought: I need to query the sales database
  Action: getDailySales()
  Observation: Total: 5,234 SAR, Count: 23 invoices
  Thought: I have the answer
  Final Answer: "مبيعات اليوم: 5,234 ريال (23 فاتورة)"
```

---

## 📚 RAG (Retrieval Augmented Generation)

### الـ Pipeline (في `src/lib/rag/`):
```
1. Query Transformation
   ↓
2. Retrieval (from vector store)
   ↓
3. Augmentation (build context)
   ↓
4. Generation (LLM)
   ↓
5. Citation (link to sources)
   ↓
6. Evaluation (quality check)
```

### الـ Subdirectories:
| المجلد | الغرض |
|---|---|
| `pipeline.ts` | core pipeline |
| `sources.ts` | sources management |
| `augmentation/` | بناء السياق |
| `citations/` | إضافة المراجع |
| `evaluation/` | تقييم الجودة |
| `query-transformers/` | تحويل الاستعلام |
| `retrievers/` | استرجاع الوثائق |

### Query Transformers:
- **HyDE (Hypothetical Document Embeddings):** يولد إجابة افتراضية ثم يبحث عنها
- **Query Decomposition:** يكسر السؤال المعقد لأسئلة فرعية
- **Step-Back Prompting:** يولد سؤال أعم أولاً
- **Multi-Query:** يولد عدة صيغ للسؤال

### Retrievers:
- **Dense:** vector similarity (cosine)
- **Sparse:** BM25 (keyword matching)
- **Hybrid:** الاثنين معاً
- **Reranking:** Cross-encoder للترتيب

### الـ Knowledge Base:
- وثائق المشروع (CLAUDE.md, BUSINESS_FLOWS, etc.)
- API documentation
- FAQs
- Help articles
- العقود والـ policies

### المسار:
- `/api/ai/rag` — RAG endpoint
- `/api/ai/chat` — Chat with RAG
- `kb-rag-engine.ts` — Knowledge Base RAG

---

## 🔢 Vector Store

### الـ Engine: pgvector (PostgreSQL extension)

### الـ Files:
| الملف | الغرض |
|---|---|
| `vector-store.ts` | core |
| `document-embeddings.ts` | تضمينات الوثائق |
| `src/lib/vector/chunking/` | تقسيم النصوص |
| `src/lib/vector/embedding/` | توليد embeddings |
| `src/lib/vector/ingestion/` | إدخال البيانات |
| `src/lib/vector/retrieval/` | الاسترجاع |
| `src/lib/vector/store/` | التخزين |

### Chunking Strategies:
| الاستراتيجية | الوصف |
|---|---|
| **Fixed-size** | حجم ثابت (مثل 500 token) |
| **Sentence-based** | حسب الجمل |
| **Paragraph-based** | حسب الفقرات |
| **Semantic** | حسب المعنى (AI-based) |
| **Recursive** | تقسيم متدرج |

### Embedding Models:
- **Gemini Embedding** (text-embedding-004): الافتراضي
- **OpenAI Embeddings** (اختياري)
- **Cohere Embed** (اختياري)

### الـ Schema:
```prisma
KnowledgeChunk {
    id, source, sourceType
    content, contentHash
    embedding  // pgvector type
    metadata: Json
    chunkIndex
    
    @@index([embedding], type: HNSW)  // pgvector index
}
```

### Similarity Search:
```sql
-- بحث Cosine similarity:
SELECT id, content, 1 - (embedding <=> '$query_embedding'::vector) AS similarity
FROM knowledge_chunk
ORDER BY embedding <=> '$query_embedding'::vector
LIMIT 10;
```

---

## 📝 Prompt Engineering

### الـ Files:
| الملف | الغرض |
|---|---|
| `prompt-registry.ts` | سجل البرومبتس |
| `prompt-cache.ts` | كاش للسرعة |
| `few-shot-examples.ts` | أمثلة few-shot |
| `token-budget.ts` | إدارة الـ tokens |
| `src/lib/prompts/registry.ts` | core registry |
| `src/lib/prompts/ab-testing/` | A/B testing للبرومبتس |
| `src/lib/prompts/eval/` | تقييم البرومبتس |
| `src/lib/prompts/library/` | مكتبة البرومبتس |
| `src/lib/prompts/system/` | system prompts |

### Prompt Templates:
```typescript
// مثال:
const cfoPrompt = {
    id: 'cfo-daily-report',
    version: '2.1',
    system: `أنت مدير مالي خبير في الـ SOCPA و IFRS...`,
    user: `بناءً على البيانات التالية: {data}, قدم تحليلاً يومياً...`,
    variables: ['data'],
    model: 'gemini-2.5-flash',
    temperature: 0.3,
    maxTokens: 2000
};
```

### A/B Testing:
```typescript
// تجربة prompts مختلفة:
const variant = await getPromptVariant('cfo-daily-report');
// يرجع variant A أو B بناءً على المستخدم
// يسجل الأداء لكل واحد
// بعد فترة → اختر الأفضل
```

### Few-Shot Examples:
```typescript
const examples = [
    { input: "مبيعات اليوم؟", output: { type: 'sales_query', range: 'today' } },
    { input: "كم العملاء؟", output: { type: 'customer_count' } },
    // ...
];
```

### Token Budget Management:
```typescript
const budget = {
    maxInputTokens: 4000,
    maxOutputTokens: 1000,
    contextStrategy: 'truncate' | 'summarize' | 'select'
};

if (estimateTokens(context) > budget.maxInputTokens) {
    context = await summarize(context, budget.maxInputTokens / 2);
}
```

---

## 🤖 AI Engines (`src/lib/ai/`)

### 1. AI Fine-tuning Engine
```typescript
// ai-finetuning-engine.ts
// لـ fine-tuning Gemini على بيانات الشركة
async function fineTune(domain: string, trainingData: Array<{input, output}>) {
    // إنشاء fine-tuning job
    // يستغرق ساعات
    // النتيجة: model خاص بالـ tenant
}
```

### 2. AI Governance Engine
```typescript
// ai-governance-engine.ts
// إدارة استخدام AI:
// - Policy enforcement (e.g., no PII)
// - Compliance checks
// - Audit trail
// - Cost limits
async function checkPolicy(request: AIRequest) {
    if (containsPII(request.input)) return reject();
    if (exceedsBudget(request.tenant)) return reject();
    if (violatesPolicy(request.feature)) return reject();
    return allow();
}
```

### 3. AI Vision Engine
```typescript
// ai-vision-engine.ts
// معالجة الصور:
// - OCR (للفواتير)
// - Object detection (للجرد)
// - Face recognition (للحضور)
// - Document classification
async function processImage(image: Buffer, task: 'OCR' | 'COUNT' | 'FACE') {
    // يستخدم Gemini Vision أو نموذج محلي
}
```

### 4. AI Voice Engine
```typescript
// ai-voice-engine.ts
// معالجة الصوت:
// - Speech-to-Text
// - Text-to-Speech
// - Voice biometrics
async function transcribe(audio: Buffer, language: 'ar' | 'en') {
    // يستخدم Gemini Audio
}
```

### 5. Multi-Agent Engine
```typescript
// multi-agent-engine.ts
// تعاون عدة agents:
// - Sales Agent
// - Accountant Agent
// - Auditor Agent
// - يتبادلون المعلومات
async function runMultiAgent(task: string) {
    // مثلاً: "أنشئ تقرير شامل عن العميل X"
    // Sales Agent: يجمع بيانات المبيعات
    // Accountant: يجمع الـ AR aging
    // Auditor: يفحص الـ anomalies
    // → تقرير شامل
}
```

---

## 🔌 MCP (Model Context Protocol)

### الغرض:
- بروتوكول موحد لإعطاء الـ LLMs الوصول للأدوات والبيانات
- يجعل الـ Copilot قادراً على استدعاء أي أداة في النظام

### الـ File:
- `mcp-bridge.ts`
- المكتبة: `@modelcontextprotocol/sdk`

### Available Tools (للـ AI):
```typescript
const tools = [
    {
        name: 'searchInvoices',
        description: 'Search sales invoices by various criteria',
        parameters: { customerId, dateFrom, dateTo, status }
    },
    {
        name: 'createPurchaseRequisition',
        description: 'Create a new PR',
        parameters: { items, urgency, justification }
    },
    {
        name: 'getInventoryStatus',
        description: 'Get current inventory for products',
        parameters: { productIds }
    },
    {
        name: 'getJournalEntry',
        description: 'Fetch a specific JE',
        parameters: { entryNumber }
    },
    // ... 50+ tools
];
```

### الـ Flow:
```
1. المستخدم يكتب: "ابحث عن فواتير العميل أحمد آخر شهر"
2. Copilot يحلل النية
3. يستدعي MCP tool: searchInvoices({ customerName: 'أحمد', dateFrom, dateTo })
4. النتائج تُرجع للـ Copilot
5. Copilot يصيغها للمستخدم
```

---

## 💰 Cost Tracking & Quotas

### Per-Request:
```prisma
AIRequestLog {
    userId, tenantId
    feature, model
    inputTokens, outputTokens
    cost  // USD أو SAR
    duration
    status
    createdAt
}
```

### Per-Tenant:
```prisma
AITokensUsage {
    tenantId
    period (monthly)
    feature
    totalInputTokens, totalOutputTokens
    totalCost
    requestCount
}
```

### الـ Quota Enforcement:
```typescript
// في كل AI request:
const quota = await getMonthlyQuota(tenantId, plan);
const used = await getMonthlyUsage(tenantId);

if (used >= quota) {
    throw new Error('AI quota exceeded for this month');
}
```

### Plans:
| Plan | AI Tokens/شهر |
|---|---|
| Free | 100K |
| Basic | 1M |
| Professional | 10M |
| Enterprise | غير محدود |

---

## 📊 AI Evaluation

### الـ Engine: `ai-eval.ts`

### Metrics:
- **Accuracy:** هل الإجابة صحيحة؟
- **Relevance:** هل تطابق السؤال؟
- **Faithfulness:** هل تستند على المصادر (RAG)؟
- **Latency:** كم استغرقت؟
- **Cost:** كم كلفت؟
- **User Satisfaction:** thumbs up/down

### A/B Testing Framework:
```typescript
// مقارنة versions:
runEvaluation({
    promptA: 'cfo-prompt-v1',
    promptB: 'cfo-prompt-v2',
    testCases: [...],
    metrics: ['accuracy', 'cost', 'latency']
});
// → نتائج مفصلة
```

---

## 🎭 الـ Personas (4)

### من `ai-personas.ts`:
1. **Copilot** — المساعد العام
2. **Accountant** — المحاسب الآلي
3. **Sales Rep** — مندوب المبيعات
4. **Auditor** — المدقق

### كل persona له:
- System prompt مختلف
- Tools متاحة
- Temperature (creativity vs precision)
- Max tokens

---

## 🛡 الأمان والـ Privacy

### Privacy Filter:
```typescript
// قبل إرسال البيانات لـ Gemini:
function privacyFilter(data) {
    return data
        .replace(/[0-9]{10}/g, 'XXXXXXXXXX')  // National IDs
        .replace(/SA[0-9]{22}/g, 'IBAN_REDACTED')  // IBANs
        .replace(/[A-Z0-9]{12}/g, 'PASSPORT_REDACTED');
}
```

### Data Residency:
- Gemini servers قد تكون خارج السعودية
- للبيانات الحساسة: استخدم نموذج محلي (إذا متاح)
- أو إخفاء قبل الإرسال

### Audit Trail:
- كل AI request يُسجل
- اسم الـ user، الوقت، الـ prompt، الـ response
- لا يُحذف (للـ compliance)

---

## 🎯 Best Practices

1. ✅ **استخدم Prompt Registry** بدلاً من inline prompts
2. ✅ **Cache responses** للاستفسارات المتكررة
3. ✅ **Privacy Filter** قبل كل request
4. ✅ **Cost tracking** لكل feature
5. ✅ **Streaming** للـ responses الطويلة
6. ✅ **Fallback** على rule-based لو فشل LLM
7. ✅ **Multi-model** (Gemini + OpenAI fallback)
8. ✅ **Human in the loop** للقرارات الحرجة
9. ❌ **لا تثق 100%** في AI للقرارات المالية
10. ✅ **اختبر A/B** للـ prompts قبل deployment
