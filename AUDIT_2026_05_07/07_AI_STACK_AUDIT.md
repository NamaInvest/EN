# 07 — فحص الـ AI Stack الكامل (AI/LLM Application Stack Audit)

> فحص التطبيق من زاوية **stack الـ AI الحديث**: Prompt Engineering، Workflow & Orchestration، Backend، Data/RAG، Frontend، Infrastructure، Testing.
> المقارنة مع: **Microsoft Copilot for D365، SAP Joule، Oracle Fusion AI، NetSuite Bill Capture/SuiteAnalytics AI، Odoo AI Studio، Salesforce Einstein**.
> المخرج: 28 فجوة — كل واحدة بـ **برومنت جاهز + سيناريو + فلو بيانات**.

---

## ملخص تنفيذي

### النتيجة الإجمالية

| الطبقة | التقييم | أكبر نقطة ضعف |
|---|:---:|---|
| 1. Prompt Engineering | **5/10** | لا few-shot، لا caching، لا token budget، لا streaming |
| 2. Workflow & Orchestration | **2/10** | لا LangChain، لا agentic framework، لا multi-step، لا tool calling |
| 3. Backend / API | **6/10** | rate-limit في-memory، logging console فقط، لا OpenAPI |
| 4. Data / Vector / RAG | **0/10** | **صفر** — لا embeddings، لا vector DB، لا knowledge base |
| 5. Frontend / UI-UX | **5/10** | useState يدوي، لا TanStack Query، لا i18n library، لا design tokens |
| 6. Infrastructure / DevOps | **4/10** | لا CI/CD، secrets في DB plain، لا OpenTelemetry |
| 7. Testing & QA | **2/10** | ملفان اختبار فقط، Jest مُثبَّت بدون استخدام، لا E2E |
| **الإجمالي** | **3.4/10** | **AI app احترافي يحتاج 6 أشهر هندسة** |

### اكتشافات حرجة

🔴 **API keys في DB كنص خام** — أي SQL injection أو read leak يكشف Gemini key.
🔴 **`ignoreBuildErrors: true` في next.config.ts** — TypeScript strict مجرد ديكور.
🔴 **0 tests للمحرك المحاسبي** (484 API بدون اختبار) — المرجع التنظيمي يطلب test coverage.
🟠 **AI auditor يرسل بيانات مالية لـ Telegram** — قد يكسر PDPL إن لم يكن مُصرَّح.
🟠 **داء الـ regenerate**: الـ CFO يوميًا يولد نفس البرومنت لنفس الأرقام بدون caching.

---

## الجزء الأول — مقارنة مع المعايير العالمية

### الـ AI Stack الكلاسيكي vs Namasoft

| الطبقة | المعيار 2026 | Namasoft اليوم | الفجوة |
|---|---|---|---|
| LLM Provider | Multi-provider (OpenAI + Anthropic + Gemini) مع failover | Gemini فقط + Ollama يتيم | OK |
| Prompt Mgmt | LangSmith / PromptLayer / Langfuse | Inline strings | كبيرة |
| Orchestration | LangChain / LangGraph / Mastra / CrewAI | لا شيء | كبيرة جداً |
| Vector DB | pgvector / Pinecone / Qdrant / Weaviate | لا شيء | كبيرة جداً |
| RAG Pattern | Hybrid (vector + keyword) + Re-ranking | لا شيء | كبيرة جداً |
| Tool/Function Calling | Native function calling (OpenAI/Gemini) | استعلامات يدوية ثم prompt | كبيرة |
| Streaming | SSE / WebSocket مع stream | كل شيء blocking | كبيرة |
| Caching | Redis + prompt cache (Anthropic/Gemini) | لا شيء | كبيرة |
| Observability | Langfuse / Helicone / LangSmith | console.error فقط | كبيرة |
| Evals | Promptfoo / Braintrust / DeepEval | لا شيء | كبيرة |
| Guardrails | NeMo Guardrails / Lakera / Guardrails AI | لا شيء | كبيرة |
| Cost Control | Token budget + per-tenant quota | لا شيء | كبيرة |

### المنافسون في ERP-AI

| النظام | ميزة AI الرئيسية | ما يفتقده Namasoft |
|---|---|---|
| **Microsoft Copilot for D365** | Natural language → action، Sales/Service/Field/Finance copilots | Function calling، semantic search على الفواتير |
| **SAP Joule** | Generative reports، Q&A على ACDOCA، embedded في كل screen | Vector search، multi-turn conversation memory |
| **Oracle Fusion AI** | Document IO، Adaptive Intelligence، Touchless AP | OCR pipeline ناضج، AI-driven approvals |
| **NetSuite Bill Capture** | OCR إلى Bill، vendor matching automatic | تحسين نموذج OCR، training per vendor |
| **Odoo 18 AI Studio** | AI fields، image-to-product، meeting summarizer | AI primitives في الـ studio (drag-drop) |
| **Salesforce Einstein** | Predictive scoring، next-best-action، Trust Layer | Privacy-aware prompting، PII masking |

---

## الجزء الثاني — الفحص التفصيلي والفجوات (28 فجوة + برومنتس)

# 1️⃣ Prompt Engineering — System Prompt + Context

## الوضع الحالي

11 موقع يستدعي LLM. **6 من 8** لديها system prompt. **2 من 8** فقط بها few-shot examples. **0 من 8** تستخدم caching أو streaming أو token budget management.

| API | System Prompt | JSON Schema | Few-shot | Streaming | Cache |
|---|:---:|:---:|:---:|:---:|:---:|
| `/ai/cfo` | ✅ Arabic, persona-driven | ⚠️ free + JSON | ✅ | ❌ | ❌ |
| `/ai/copilot` | ✅ Strict JSON | ✅ | ✅ (1) | ❌ | ❌ |
| `/ai/fraud-monitoring` | ✅ Role-based | ✅ | ❌ | ❌ | ❌ |
| `/ai-cfo/report` | ✅ Expert CFO | ✅ | ❌ | ❌ | ❌ |
| `/purchases/ocr` | ✅ Tax invoice expert | ✅ | ❌ | ❌ | ❌ |
| `/stocktake/vision` | ✅ Warehouse expert | ✅ | ❌ | ❌ | ❌ |
| `/ai-auditor` | ✅ Auditor tone | ⚠️ free text | ❌ | ❌ | ❌ |
| `/explain` (Ollama) | ✅ Section explainer | ⚠️ free | ❌ | ❌ | ❌ |

---

### AI-01 · مكتبة Prompt Management مركزية (P0)

**الوضع:** البرومنتس inline strings مكررة في ملفات API. لا إصدارات، لا اختبار A/B، لا قياس أداء.

**المعيار العالمي:** كل البرومنتس في DB أو ملفات يُصدَّرون بـ version + يُختبرون عبر eval suite.

**Schema:**
```prisma
model PromptTemplate {
  id           String @id @default(cuid())
  tenantId     String?  // null = global default
  key          String   // "cfo.daily_summary", "copilot.system"
  version      Int
  systemPrompt String   @db.Text
  userTemplate String   @db.Text  // with {{placeholders}}
  examples     Json     // few-shot examples
  outputSchema Json?    // JSON schema if structured
  modelHint    String?  // "gemini-2.5-flash" | "gpt-4o-mini"
  temperature  Float    @default(0.3)
  maxTokens    Int      @default(2048)
  active       Boolean  @default(true)
  evalScore    Float?   // last eval run score
  createdBy    String
  createdAt    DateTime @default(now())
  @@unique([tenantId, key, version])
}

model PromptUsageLog {
  id           String @id @default(cuid())
  tenantId     String
  promptKey    String
  promptVersion Int
  model        String
  promptTokens Int
  completionTokens Int
  latencyMs    Int
  success      Boolean
  errorCode    String?
  costUsd      Decimal? @db.Decimal(10,6)
  createdAt    DateTime @default(now())
  @@index([tenantId, promptKey, createdAt])
}
```

**برومنت:**
```
/erp-build-feature prompt-management-system

1. Schema: PromptTemplate + PromptUsageLog
2. Core lib: src/lib/prompts/registry.ts
   - getPrompt(key, vars) → renders template with placeholders
   - logUsage(key, version, tokens, latency, cost)
3. Migrate 11 inline prompts to PromptTemplate seeds
4. Wrapper: src/lib/llm-client.ts
   - callLLM(promptKey, vars) → resolves prompt → calls Gemini → logs usage
   - support multi-provider via config (Gemini/OpenAI/Anthropic/Ollama)
5. Admin UI: /admin/prompts page
   - list templates, edit, version history, eval score
   - "Test Prompt" form with sample vars
6. Cost dashboard: /admin/llm-costs
   - per-tenant per-prompt spend last 30 days
```

**سيناريو:** CFO Marketing يلاحظ أن `cfo.daily_summary` يُكلف 0.04$ يومياً × 1000 tenant = 40$/يوم = 14,600$/سنة. يفتح Admin → Prompts → cfo.daily_summary → ينشئ v2 أقصر بـ 30% → يختبر في sandbox → يفعّل v2 → الكلفة تنزل إلى 30$ يومياً.

**فلو:**
```
API call /api/ai/cfo →
  callLLM('cfo.daily_summary', {tenantData})
    → registry.getPrompt resolves template
    → render with vars
    → call Gemini
    → logUsage(tokens, latency, cost)
    → return result
```

---

### AI-02 · Prompt Caching (Anthropic/Gemini Context Cache) (P0)

**الوضع:** كل استدعاء CFO يعيد إرسال نفس الـ system prompt + tenant context (~3000 tokens) → 90% من التكلفة هدر.

**المعيار:** Gemini Context Cache (TTL 1h)، Anthropic Prompt Caching (90% discount on cached tokens).

**Schema:**
```prisma
model LlmContextCache {
  id           String @id @default(cuid())
  tenantId     String
  cacheKey     String   // hash of system prompt + static context
  provider     String   // "gemini" | "anthropic"
  providerCacheId String  // returned by API
  tokenCount   Int
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  @@unique([tenantId, cacheKey])
}
```

**برومنت:**
```
/erp-build-feature llm-prompt-caching

1. Schema: LlmContextCache
2. wrap llm-client.ts:
   - on call: hash(systemPrompt + staticContext) → lookup cache
   - if hit + not expired: pass cacheId in request
   - if miss: create cache via provider API → store id
3. Gemini: createCachedContent({contents, ttl})
4. Anthropic: cache_control: { type: "ephemeral" } on system block
5. Track savings via PromptUsageLog.cachedTokens
6. Dashboard widget: "AI Cache Hit Rate" + "Savings This Month"
```

**سيناريو:** CFO API يستدعي Gemini 50 مرة يومياً بـ نفس system prompt 3000 tokens. مع caching → 1 طلب يبني cache (1h TTL) + 49 يستخدمونه بـ خصم 75% على tokens المحفوظة → توفير 60% من فاتورة الذكاء.

**فلو:**
```
First call (cache miss):
  cache.create(systemPrompt, ttl=1h) → cacheId
  store LlmContextCache(tenantId, cacheKey, providerCacheId, expiresAt)
  call Gemini with cacheId → response

Subsequent calls (cache hit):
  lookup LlmContextCache → providerCacheId
  call Gemini referencing cacheId (no resending system prompt)
  save 75% on those tokens
```

---

### AI-03 · Streaming Responses (P1)

**الوضع:** كل استدعاء blocking. CFO report يأخذ 8 ثوانٍ — المستخدم يرى spinner.

**المعيار:** Server-Sent Events (SSE) مع `streamText` من Vercel AI SDK.

**برومنت:**
```
/erp-build-feature llm-streaming

1. install: @ai-sdk/google + ai (Vercel AI SDK v5)
2. Convert /api/ai/cfo to streaming:
   import { streamText } from 'ai'
   import { google } from '@ai-sdk/google'
   const result = streamText({ model: google('gemini-2.5-flash'), prompt, system })
   return result.toAIStreamResponse()
3. Client in /finance/cfo page:
   import { useChat } from '@ai-sdk/react'
   const { messages, input, append, isLoading } = useChat({ api: '/api/ai/cfo' })
4. Render messages.content مع typewriter effect
5. Apply same to /ai/copilot, /ai-cfo/report, /explain
```

**سيناريو:** CFO يفتح Dashboard → الإجابة تظهر كلمة بكلمة خلال 1.5 ثانية بدلاً من spinner 8 ثوانٍ. تجربة احترافية.

---

### AI-04 · Few-shot + Chain-of-Thought + Output Validation (P1)

**الوضع:** فقط `/ai/copilot` لديه example واحد. باقي البرومنتس بدون.

**برومنت:**
```
/erp-build-feature prompt-few-shot-cot

لكل PromptTemplate في النظام:
1. أضف 3-5 few-shot examples تغطي الحالات الشائعة + الحدودية
2. لـ المهام التحليلية (CFO, fraud, audit): أضف "think step by step" + chain-of-thought
3. كل output structured: ضع Zod schema strict
4. على client: parse + retry on schema violation (max 2)
5. تتبّع schema_violation_rate في PromptUsageLog
```

---

### AI-05 · Token Budget Management (P1)

**الوضع:** `/ai-cfo/report/route.ts` يجلب كل المنتجات + البيانات → قد يتجاوز 1M tokens في tenant كبير.

**برومنت:**
```
/erp-build-feature llm-token-budget

1. wrap كل LLM call بـ:
   - estimate tokens (using tiktoken or @anthropic-ai/tokenizer)
   - if > model.contextWindow * 0.7: chunk + summarize first
   - if > 0.9: hard fail + alert
2. نمط chunking لـ CFO:
   summarize per cost-center → roll up
3. نمط chunking لـ OCR كبير:
   scan multi-page PDFs page-by-page
4. Hard tenant quota: max 10M tokens/month per tier
5. Dashboard: token usage gauge per tenant
```

---

### AI-06 · Guardrails / PII Masking (P1)

**الوضع:** الـ AI auditor يرسل صافي الربح + رواتب لـ Telegram. لا masking.

**برومنت:**
```
/erp-build-feature ai-guardrails-pii

1. Install: presidio-cli OR custom
2. src/lib/pii-mask.ts:
   - maskNationalId, maskIban, maskSalary, maskName
3. wrap كل llm input: scan + mask قبل الإرسال
4. wrap output: validate لا يحتوي PII
5. Audit log: PiiMaskingEvent (what was masked, when)
6. Tenant setting: "Allow PII to AI providers" Y/N (default N)
```

---

# 2️⃣ Workflow & Orchestration

## الوضع الحالي

**0 إطار agentic. كل AI call واحد-طلب-واحد-إجابة.** لا multi-step، لا tool calling، لا agent loops.

---

### AI-07 · Function/Tool Calling (P0)

**الوضع:** الكود يجلب البيانات من DB ثم يحقنها في prompt. الـ LLM لا يستطيع طلب بيانات إضافية.

**المعيار:** Gemini/OpenAI tool calling — LLM يقرر متى يستدعي function (`getCustomerBalance`, `runReport`).

**Schema:**
```prisma
model AiToolDefinition {
  id          String @id @default(cuid())
  tenantId    String?
  name        String   // "getCustomerBalance", "createJournalEntry"
  description String   @db.Text
  parameters  Json     // JSON schema
  handlerType String   // "DB_QUERY" | "API_CALL" | "MUTATION"
  permission  String   // role required
  active      Boolean
}

model AiToolCallLog {
  id          String @id @default(cuid())
  tenantId    String
  toolName    String
  arguments   Json
  result      Json?
  success     Boolean
  durationMs  Int
  invokedBy   String  // userId or "agent"
  createdAt   DateTime @default(now())
}
```

**برومنت:**
```
/erp-build-feature ai-function-calling

1. Schema: AiToolDefinition + AiToolCallLog
2. Define 20 core tools:
   - getCustomerBalance(customerId)
   - getInvoiceById(id)
   - searchProducts(query)
   - getAccountBalance(accountCode)
   - getCashPosition()
   - listOpenInvoices(customerId, status?)
   - calculateAtp(productId, qty, date)
   - getCreditCheck(customerId, amount)
   - createDraftInvoice(payload)
   - postExpense(payload)
   - getNitaqatStatus()
   - getZakatBase(year)
   - listPendingApprovals(userId)
   - + 7 أخرى

3. lib: src/lib/ai/tools.ts
   - registerTool(def, handler)
   - executeTool(name, args, userId) با permission check + audit log

4. wrapper llm-client:
   - pass tools to Gemini/OpenAI
   - on tool_call: execute → return result → loop until done
   - max 5 iterations

5. Apply to /ai/copilot first
6. UI: in copilot chat, show "🔧 used getCustomerBalance(...)" expand for details
```

**سيناريو:** مدير يكتب في الـ copilot: "كم رصيد عميل XYZ؟ وأرسل له كشف حساب." الـ LLM:
1. يستدعي `getCustomerBalance("XYZ")` → 12,450 ر.س.
2. يستدعي `generateStatement("XYZ", "May 2026")` → PDF
3. يستدعي `sendStatementByEmail(statementId)` → success
4. يردّ على المدير: "رصيد XYZ هو 12,450 ر.س. أرسلت له كشف حساب على X@.com."

**فلو:**
```
User → Copilot: "ما رصيد عميل XYZ؟"
  ↓
Gemini decides → tool_call: getCustomerBalance({customerId: "XYZ"})
  ↓
executeTool → permission check → DB query → return 12450
  ↓
Gemini → tool_call: generateStatement(...)
  ↓
... loop until Gemini emits final answer
  ↓
Save AiToolCallLog rows + ConversationMessage
```

---

### AI-08 · LangChain / LangGraph Integration (P1)

**الوضع:** لا workflow framework. كل Multi-step منطق ad-hoc.

**برومنت:**
```
/erp-build-feature langchain-integration

1. install: langchain @langchain/google-genai @langchain/community
2. ابدأ بـ /ai/copilot:
   - استبدل ad-hoc loop بـ AgentExecutor
   - createOpenAIToolsAgent / createReactAgent
   - tools = src/lib/ai/tools.ts (من AI-07)
3. Multi-step examples to migrate:
   - "Generate VAT return" — chain: pull invoices → group by tax code → call ZATCA template → save draft
   - "Investigate this anomaly" — chain: fetch JE → fetch source doc → fetch related JEs → summarize
4. Memory: BufferMemory per ConversationId
5. tracing: integrate Langfuse SDK (free tier)
```

---

### AI-09 · Background Agent Worker (Inngest/BullMQ) (P1)

**الوضع:** `/ai-auditor` يعمل عبر cron HTTP route — هش، لا retries، لا visibility.

**برومنت:**
```
/erp-build-feature ai-background-jobs

1. install: bullmq + redis (already in docker-compose)
2. src/queues/ai-jobs.ts:
   - daily-audit queue
   - prompt-eval queue
   - ocr-batch queue
   - embed-knowledge-base queue
3. workers in src/workers/ai-worker.ts
4. retry policy: exponential, max 3
5. monitoring: bullboard at /admin/queues
6. migrate cron HTTP → enqueue + worker
```

---

### AI-10 · Multi-Turn Conversation Memory (P1)

**الوضع:** الـ copilot ينسى كل turn. لا context.

**Schema:**
```prisma
model AiConversation {
  id          String @id @default(cuid())
  tenantId    String
  userId      String
  title       String?
  startedAt   DateTime @default(now())
  endedAt     DateTime?
  messages    AiConversationMessage[]
}

model AiConversationMessage {
  id           String @id @default(cuid())
  conversationId String
  role         String   // "user" | "assistant" | "tool"
  content      String   @db.Text
  toolCalls    Json?
  toolResults  Json?
  promptTokens Int?
  completionTokens Int?
  createdAt    DateTime @default(now())
  conversation AiConversation @relation(fields: [conversationId], references: [id])
}
```

**برومنت:**
```
/erp-build-feature ai-conversation-memory

1. Schema: AiConversation + AiConversationMessage
2. wrap copilot:
   - on each message: append to conversation
   - on call: replay last N messages (or summarize old) as context
3. summarization: compress messages older than 10 turns into "summary so far"
4. UI: sidebar with conversation history
5. resume any past conversation
```

---

# 3️⃣ Backend / Logic / API

## الوضع الحالي

Next.js 16 + 645 routes + Zod validation + Clerk + JWT + AsyncLocalStorage multi-tenant + per-IP rate limit في-memory.

---

### AI-11 · Centralized API Validation Schema (P1)

**الوضع:** Zod scattered. لا OpenAPI. لا type-safe client.

**برومنت:**
```
/erp-build-feature api-validation-centralized

1. Create src/schemas/ folder بـ Zod schemas لكل entity
2. tRPC OR add zod-openapi:
   z.object({...}).openapi({ ref: 'SalesInvoice' })
3. Generate OpenAPI 3.1 spec: /api/openapi.json
4. Generate type-safe client: openapi-typescript
5. swagger UI at /api/docs (admin only)
6. CI step: validate OpenAPI doesn't break on PR
```

---

### AI-12 · Production-Grade Rate Limiting (Redis) (P1)

**الوضع:** in-memory Map → يضيع عند restart + لا يعمل في multi-instance.

**برومنت:**
```
/erp-build-feature redis-rate-limit

1. use Upstash @upstash/ratelimit OR ioredis
2. تيرس: per-IP + per-tenant + per-userId + per-route
3. quotas تختلف بـ tier (free/pro/enterprise)
4. middleware في next.config: applies to all /api/*
5. AI-specific: stricter limits على /api/ai/* (10/min)
6. dashboard: /admin/rate-limit-stats
```

---

### AI-13 · Structured Logging (Pino + JSON) (P1)

**الوضع:** console.error فقط. لا searchable في production.

**برومنت:**
```
/erp-build-feature structured-logging

1. install pino + pino-pretty (dev)
2. src/lib/logger.ts:
   - log.info({tenantId, userId, route}, "message")
   - context propagation via AsyncLocalStorage
3. replace كل console.* في src/app/api/* بـ logger
4. ship to ELK/Loki/Datadog via pino-transport
5. Sentry already captures errors — keep
6. correlation IDs (request id) في كل log line
```

---

### AI-14 · API Health + Observability (P1)

**الوضع:** /api/health موجود. لا metrics endpoint.

**برومنت:**
```
/erp-build-feature observability-otel

1. install @opentelemetry/api + auto-instrumentation
2. instrument: HTTP, Prisma, Gemini calls
3. export OTLP → Grafana/Datadog/Tempo
4. metrics: request_count, latency_p99, llm_token_count, db_query_count
5. traces: link API call → DB query → LLM call (single waterfall)
6. /admin/observability dashboard مع Grafana embed
```

---

# 4️⃣ Data & Storage / Vector Databases / RAG

## الوضع الحالي

**صفر vector DB. صفر embeddings. صفر RAG.** الـ AI يستخدم prompt injection خام فقط.

---

### AI-15 · pgvector + Knowledge Base RAG (P0)

**الوضع:** PostgreSQL موجود → pgvector extension يعمل بسطر SQL. لا حاجة لـ Pinecone.

**Schema:**
```prisma
model KnowledgeDocument {
  id          String @id @default(cuid())
  tenantId    String
  source      String   // "PRODUCT_DESC" | "INVOICE_TERMS" | "MANUAL_KB" | "UPLOADED_FILE"
  sourceId    String?
  title       String
  content     String   @db.Text
  metadata    Json     // {productId, customerId, language, ...}
  fileUrl     String?
  ingestedAt  DateTime @default(now())
  chunks      KnowledgeChunk[]
}

model KnowledgeChunk {
  id          String @id @default(cuid())
  tenantId    String
  documentId  String
  chunkIndex  Int
  content     String @db.Text
  // pgvector column added via raw SQL:
  // embedding vector(768)  // gemini text-embedding-004 dimension
  tokenCount  Int
  document    KnowledgeDocument @relation(fields: [documentId], references: [id])
  @@index([tenantId, documentId])
}
```

Migration SQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "KnowledgeChunk" ADD COLUMN embedding vector(768);
CREATE INDEX ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
```

**برومنت:**
```
/erp-build-feature pgvector-rag

1. Migration: pgvector extension + KnowledgeDocument + KnowledgeChunk
2. ingestion pipeline: src/lib/rag/ingest.ts
   - loadDocument(file/text)
   - chunk بـ langchain RecursiveCharacterTextSplitter (size 500, overlap 50)
   - embed via Gemini text-embedding-004
   - bulk insert KnowledgeChunk + embedding
3. retrieval: src/lib/rag/retrieve.ts
   - semanticSearch(query, tenantId, k=5)
   - hybrid: vector + keyword (PostgreSQL FTS)
   - rerank بـ Gemini (optional)
4. integrate في /ai/copilot:
   - before LLM call: retrieve top-K docs
   - inject as context
5. seed knowledge:
   - all product descriptions + terms
   - all customer/vendor profiles
   - SOCPA/ZATCA documentation chunks
   - help articles
6. UI: /admin/knowledge-base
   - upload PDF/DOCX
   - manual entries
   - search test
7. cron: re-embed when source changes
```

**سيناريو:** المستخدم يسأل copilot: "ما سياسة المرتجعات؟" → النظام:
1. embeds السؤال → vector
2. searches KnowledgeChunk → يجد 3 chunks (terms.pdf، policy_returns.md، invoice_template footer)
3. injects كـ context في prompt
4. Gemini يُجيب بدقة بناءً على المستندات الفعلية، لا hallucination.

**فلو:**
```
User question
  ↓
embed via Gemini text-embedding-004 → vector[768]
  ↓
SQL: SELECT id, content FROM "KnowledgeChunk"
     WHERE tenantId = X
     ORDER BY embedding <=> $1::vector
     LIMIT 5
  ↓
Optional rerank
  ↓
inject في system prompt: "Context: <chunks>"
  ↓
Gemini → answer with citations
  ↓
log AiToolCallLog(tool='kb_retrieve', args, result)
```

---

### AI-16 · Document Embedding Pipeline (P1)

**الوضع:** الفواتير والـ POs و invoices الواردة لا تُفهرس دلالياً.

**برومنت:**
```
/erp-build-feature document-embeddings

1. cron: every 5 minutes
2. select 100 invoices/POs/contracts where indexedAt is null
3. extract text (OCR if image, parse if PDF/DOCX)
4. chunk + embed
5. INSERT KnowledgeChunk with metadata
6. mark source as indexed
7. enables: "find me similar invoice from last quarter" semantic search
```

---

### AI-17 · Semantic Search UI (P1)

**Schema** سبق في AI-15.

**برومنت:**
```
/erp-build-feature semantic-search-ui

1. Replace GlobalSearch.tsx بـ semantic search:
   - input: type query → debounce → call /api/search/semantic
   - response: top 10 results عبر entity types
2. show snippet + highlight + source link
3. fallback to keyword search if results < 3
4. ui design: like Notion/Linear quick search
```

---

### AI-18 · ZATCA / SOCPA Knowledge Base Seed (P0)

**برومنت:**
```
/erp-build-feature compliance-kb-seed

1. Ingest في KnowledgeDocument:
   - ZATCA Implementing Regulations (Arabic)
   - VAT Implementing Regulations
   - Saudi Labor Law articles 1-200
   - PDPL law text
   - GOSI procedures
   - Mudad guides
2. tag بـ source, articleNumber, language
3. enables /ai/copilot يجاوب: "ما عقوبة تأخير الراتب؟" → "Article 90: 3,000 SAR per worker per month..."
```

---

# 5️⃣ Frontend / UI-UX

## الوضع الحالي

React 19 + Tailwind 4 + shadcn/ui + Recharts + 41 component. **لا form library، لا state library، لا i18n library، لا design tokens.**

---

### AI-19 · TanStack Query للبيانات (P1)

**برومنت:**
```
/erp-build-feature tanstack-query

1. install @tanstack/react-query
2. provider في src/app/layout.tsx
3. migrate fetch calls الكبيرة:
   - dashboard data
   - lists with pagination
   - real-time refresh
4. mutation hooks:
   - useCreateInvoice
   - useUpdateCustomer
5. devtools في development
```

---

### AI-20 · React Hook Form + Zod Resolver (P1)

**الوضع:** 99+ useState يدوي للنماذج.

**برومنت:**
```
/erp-build-feature react-hook-form

1. install react-hook-form @hookform/resolvers zod
2. wrapper: src/components/forms/Form.tsx
   - { schema, defaultValues, onSubmit }
3. migrate top 20 forms (sales invoice, customer, employee, etc.)
4. inline validation messages bilingual
5. accessibility: aria-invalid + aria-describedby
```

---

### AI-21 · Design System Tokens + Storybook (P1)

**برومنت:**
```
/erp-build-feature design-system

1. extract tokens to src/design/tokens.ts
   - colors, spacing, typography, radii, shadows
2. CSS variables generated from tokens
3. Storybook for top 30 components
4. visual regression: Chromatic OR Loki
5. DESIGN.md ARCHITECTURE.md في root
```

---

### AI-22 · AI Copilot UX Polish (P0)

**الوضع:** AICopilotButton موجود لكن lacks streaming، history، tool calls visibility.

**برومنت:**
```
/erp-build-feature copilot-ux-v2

1. تحويل لـ ChatGPT-style:
   - streaming text typewriter
   - tool calls expanded ("🔧 fetched customer balance: 12,450 SAR")
   - copy button per message
   - regenerate button
   - thumbs up/down feedback (saved to PromptUsageLog)
2. side panel: conversation history (uses AiConversation)
3. ⌘+K shortcut to open
4. context-aware: show current page entity to copilot
   ("You're on customer XYZ — ask anything")
5. mobile responsive
6. dark mode parity
```

---

### AI-23 · i18n with next-intl (P1)

**الوضع:** Bilingual hardcoded. لا i18n library.

**برومنت:**
```
/erp-build-feature i18n-next-intl

1. install next-intl
2. messages/ar.json, messages/en.json
3. namespaces per module
4. RTL/LTR auto-switching
5. locale persistence per user
6. AI prompts متعددة اللغات (key.ar, key.en)
```

---

# 6️⃣ Infrastructure / DevOps

## الوضع الحالي

Docker + PostgreSQL + Redis + Sentry. **لا CI/CD. لا secrets manager. لا OpenTelemetry. .env سرّي يدوي.**

---

### AI-24 · GitHub Actions CI/CD Pipeline (P0)

**الوضع:** لا workflows. لا automated test/build/deploy.

**برومنت:**
```
/erp-build-feature github-actions-cicd

1. .github/workflows/ci.yml:
   - on: pull_request, push to main
   - jobs:
     a. lint (eslint)
     b. typecheck (tsc --noEmit) — وأزل ignoreBuildErrors!
     c. test (jest/vitest)
     d. build (next build)
     e. docker build + push to GHCR
   - cache: pnpm/npm + .next
2. .github/workflows/deploy.yml:
   - on: push to main + green CI
   - deploy via PM2/Docker SSH OR Vercel
3. branch protection: required checks
4. CODEOWNERS + PR template
```

---

### AI-25 · Secrets Management (Vault / Doppler / AWS) (P0)

**الوضع:** Gemini API key في DB plain text + .env.local.backup. كارثي.

**برومنت:**
```
/erp-build-feature secrets-manager

1. choose: Doppler (easy) أو AWS Secrets Manager
2. migrate من DB:
   - delete settings.gemini_api_key rows
   - load from Doppler at runtime
3. env vars schema validation: src/lib/env.ts using zod
4. rotate keys quarterly cron
5. audit: who accessed which secret when
6. Sentry redacts secrets في error reports
```

---

### AI-26 · Backup Automation + Point-In-Time Recovery (P0)

**الوضع:** Docker volume فقط. لا backups.

**برومنت:**
```
/erp-build-feature backup-pitr

1. PostgreSQL WAL archiving:
   - wal_level = replica
   - archive_command upload to S3
2. nightly pg_dump → S3 (encrypted)
3. cron: 3 hourly + 7 daily + 4 weekly + 12 monthly
4. test restore monthly (automated)
5. retention: 30 days hourly + 1 year daily
6. UI: /admin/backups list + restore-to-point button
```

---

### AI-27 · Multi-Tenant Resource Limits (P1)

**برومنت:**
```
/erp-build-feature tenant-quotas

1. Schema: TenantQuota (model uses, api calls, storage GB, AI tokens)
2. middleware: track usage per tenant
3. enforce hard limits + soft warnings
4. tier configs: free / pro / enterprise
5. dashboard: per-tenant usage trend
```

---

# 7️⃣ Testing & QA

## الوضع الحالي

**ملفان اختبار فقط** (auto-journal.test.ts، bnpl.test.ts) من ~1500 ملف. Jest + Vitest مُثبَّتان لكن غير مُستخدمين. ignoreBuildErrors:true → TypeScript strict مجرد ديكور.

---

### AI-28 · Test Pyramid Foundation (P0)

**برومنت:**
```
/erp-build-feature test-pyramid

1. unit tests (Vitest):
   - target: 60% coverage على src/lib/*
   - priority: auto-journal.ts, period-close.ts, year-end-engine.ts, wht-engine.ts, costing.ts
   - 100+ tests للمحرك المحاسبي

2. integration tests (Vitest + supertest):
   - target: 80 critical APIs
   - test transactional integrity
   - test multi-tenant isolation
   - فحص ZATCA flows

3. E2E tests (Playwright):
   - install @playwright/test
   - top 10 user journeys:
     a. Login + create sales invoice + ZATCA submit
     b. PO → GRN → 3-way match
     c. Payroll run with WPS
     d. Period close → year-end
     e. Approval workflow
     ... 5 more
   - run on every PR

4. AI evals (Promptfoo):
   - install promptfoo
   - eval suite per prompt template
   - regression: "did the new prompt v2 break anything?"
   - run on prompt template changes

5. coverage report → Codecov
6. CI gate: PR fails if coverage drops > 2%
7. ابدأ بإزالة ignoreBuildErrors في next.config.ts ✓
```

**سيناريو:** Developer ينشئ PR يعدل auto-journal.ts. CI يُشغّل:
- 145 unit test للمحرك → 144 pass، 1 fail (kashف regression في WHT)
- 80 integration tests → all pass
- 10 E2E (subset relevant) → all pass
- 25 prompt evals → all pass
- Coverage: 62% → 61.8% (within threshold)
→ PR يُسمح بالـ merge، الخطأ في WHT أُصلح قبل production.

---

## الجزء الثالث — خارطة الطريق المتكاملة (6 أشهر)

| الشهر | الفئة | البنود |
|---|---|---|
| **1** | Critical Fixes | AI-25 secrets، AI-26 backup، AI-28 (start) test pyramid، AI-24 CI/CD |
| **2** | Foundation | AI-01 prompt mgmt، AI-02 caching، AI-15 pgvector RAG، AI-13 structured logging |
| **3** | AI Capabilities | AI-07 function calling، AI-08 LangChain، AI-22 copilot UX v2، AI-18 KB seed |
| **4** | Data + Search | AI-16 doc embeddings، AI-17 semantic search، AI-10 conversation memory |
| **5** | Stack Maturity | AI-11 OpenAPI، AI-12 Redis rate limit، AI-14 OpenTelemetry، AI-19 TanStack Query |
| **6** | Polish + Scale | AI-03 streaming، AI-04 few-shot/CoT، AI-05 token budget، AI-06 PII guardrails، AI-20-21-23 frontend |

---

## النتيجة النهائية المتوقعة

| الطبقة | اليوم | بعد 6 أشهر |
|---|:---:|:---:|
| Prompt Engineering | 5/10 | **9/10** |
| Workflow & Orchestration | 2/10 | **8/10** |
| Backend / API | 6/10 | **9/10** |
| Data / RAG | 0/10 | **8/10** |
| Frontend / UI-UX | 5/10 | **8/10** |
| Infrastructure / DevOps | 4/10 | **8/10** |
| Testing & QA | 2/10 | **8/10** |
| **الإجمالي** | **3.4/10** | **8.3/10** |

### القدرة التنافسية

- يتفوق على **Odoo 18 AI Studio** في: orchestration، RAG، tool calling، compliance.
- يقترب من **NetSuite Bill Capture** في: OCR pipeline + vendor matching.
- يقترب من **Microsoft Copilot for D365** في: function calling + grounded answers.
- يبقى دون **SAP Joule** في: integration بكل screen + voice interface.

---

## القاعدة الذهبية

> **هذه ليست ميزات إضافية — هذه أساسات تطبيق AI احترافي عام 2026.**
>
> أنت تبني ERP يدّعي أنه "AI-powered" لكن الـ stack ينقصه: لا تتبع برومنتات، لا cache، لا RAG، لا CI/CD، لا backup. أي عميل enterprise جدي سيرفض الشراء.
>
> ابدأ بـ AI-25 (secrets) و AI-26 (backup) فوراً — هذان غير قابليْن للتأجيل.

---

## كيف تستخدم هذا الملف

```
1. اختر AI-XX
2. انسخ البرومنت
3. ابدأ chat جديد:
   "اقرأ d:/namasoft9-3-main/AUDIT_2026_05_07/07_AI_STACK_AUDIT.md ونفّذ AI-15 (pgvector RAG) كاملاً"
4. ستحصل على Migration + lib + APIs + UI + tests
```

---

**نهاية فحص الـ AI Stack — 2026-05-07**

**ملخص الفجوات:** 28 بند • 10 P0 • 18 P1
**الفئات:** Prompt(6) + Workflow(4) + Backend(4) + RAG(4) + Frontend(5) + Infra(4) + Testing(1)
