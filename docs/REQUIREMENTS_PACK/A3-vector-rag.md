# A3 — Vector DB / RAG / Data & Storage

## الحالة الحالية
- `src/lib/rag/pipeline.ts` ✓ (موجود فعلياً)
- `src/lib/vector/{chunking,embedding,ingestion,retrieval,store}` ✓
- `scripts/run-ragas-eval.ts` ✓
- Prisma model: `KnowledgeChunk` ✓
- لا توجد وثيقة معمارية موحّدة
- لم يُختبَر tenant isolation للـ vector store

## الفجوة (مقابل Oracle Vector / Pinecone Enterprise)
- لا cost dashboard للـ embeddings
- لا A/B testing للـ chunking strategies
- لا re-indexing scheduled

## 🎯 Ready Prompt

```
المهمة: توثيق + تقوية الـ RAG pipeline الموجودة.

السياق:
- src/lib/rag/ و src/lib/vector/ موجودان
- KnowledgeChunk model في Prisma
- scripts/run-ragas-eval.ts موجود

المخرجات:
1) docs/MASTER_PACK/04-data/RAG_ARCHITECTURE.md:
   - Embedding model + dimensions + cost per 1M tokens
   - Chunking strategy (size, overlap, splitter)
   - Index structure (pgvector? HNSW?)
   - Tenant namespace strategy (يجب تأكيد العزل)
   - Reranking model + top-K
   - Citation tracker contract

2) RAGAS evaluation:
   - Run scripts/run-ragas-eval.ts
   - Tabulate: faithfulness, relevancy, recall per module
   - Output: docs/MASTER_PACK/04-data/RAGAS_RESULTS.md

3) Tenant isolation test:
   - tests/rag/tenant-isolation.test.ts
   - Ensure tenant A cannot retrieve tenant B chunks
   - Must include red-team queries

4) Cost dashboard:
   - src/app/(dashboard)/admin/rag-cost/page.tsx
   - Daily embedding costs (tokens × $/1M)
   - Top consumers per module
   - Alert if cost > $50/day

5) Re-indexing job:
   - src/app/api/cron/rag-reindex/route.ts
   - Weekly: detect documents updated since last index
   - Incremental upsert to vector store

القيود:
- لا embedding بدون tenantId namespace
- كل query يُفلتر بـ tenantId قبل reranking
- max 8 chunks per response (token budget)
```

## السيناريو

محاسب يسأل: **"إيش بنود مصاريف التسويق الشهر الماضي؟"**

1. الـ Copilot يستلم السؤال
2. RAG pipeline:
   - **Embed**: text-embedding model يحوّل السؤال إلى vector
   - **Retrieve**: pgvector search بـ filter `tenantId = X`
   - **Top-K=20**: استرجاع أعلى 20 chunk (فواتير + JE + policies)
3. **Rerank**: cross-encoder يُعيد ترتيب الـ20 ويأخذ أعلى 8
4. **Augment**: 8 chunks تُضاف لـ prompt + question
5. Gemini يجيب مع citations لكل bullet
6. الـ Citation Tracker يُسجّل: query → cited chunks → confidence

## Data Flow

```
[Indexing path]
Document write (Invoice / JE / Policy)
   ↓
outbox event: "document.created"
   ↓
/api/ai/ingest worker
   ↓
src/lib/vector/chunking/split() → 500-token chunks
   ↓
src/lib/vector/embedding/embed() → vectors[]
   ↓
src/lib/vector/store/upsert({
   namespace: `tenant_${tenantId}`,
   chunks: [...]
})
   ↓
KnowledgeChunk table updated

[Query path]
User question (Arabic)
   ↓
/api/ai/copilot/chat
   ↓
src/lib/vector/embedding/embedQuery()
   ↓
src/lib/vector/retrieval/search({
   query: vector,
   filter: { tenantId: <X> },
   topK: 20
})
   ↓
src/lib/vector/retrieval/rerank(top20) → top8
   ↓
src/lib/rag/pipeline.ts
   ↓ (assemble context)
augmented_prompt = system + retrieved_chunks + question
   ↓
Gemini 2.5-flash
   ↓
response + citations[chunk_id, score, source_file]
   ↓
src/lib/rag/citations/tracker.ts logs:
   { query_hash, cited_chunks, response_quality }
   ↓
UI: response + clickable citations

[Monitoring path]
Daily cron @ 02:00
   ↓
/api/cron/rag-cost-rollup
   ↓
Aggregate embedding token usage from logs
   ↓
Update RagCostSummary table
   ↓
UI: /admin/rag-cost shows trends + alerts
```

## ملفات المُنتَج

- `docs/MASTER_PACK/04-data/RAG_ARCHITECTURE.md`
- `docs/MASTER_PACK/04-data/RAGAS_RESULTS.md`
- `tests/rag/tenant-isolation.test.ts`
- `src/app/(dashboard)/admin/rag-cost/page.tsx`
- `src/app/api/cron/rag-reindex/route.ts`
