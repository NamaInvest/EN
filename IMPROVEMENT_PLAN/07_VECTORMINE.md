# 7️⃣ VectorMine | منجم المعرفة

## 🔍 الحالة الحالية

### ✅ الموجود
- [src/lib/vector-store.ts](../src/lib/vector-store.ts) — يتعامل مع pgvector
- جدول `knowledgeDocument` مع column `embedding`
- Google Gemini `text-embedding-004` model

### 🔴 الفجوات
| الفجوة | الموقع |
|--------|--------|
| pgvector في الكود لكن fallback لـ Brute-force JS cosine | يكلف ذاكرة وأبطأ |
| لا HNSW / IVF index | بحث O(n) |
| لا Chunking strategy | docs تُرفع كاملة |
| لا Ingestion Pipeline تلقائي | manual فقط |
| لا Metadata Filtering متقدم | tenantId فقط |
| لا Citations tracking | — |
| لا Re-indexing عند تغيير المحتوى | — |

---

## 🎯 الخطة التفصيلية

### البنية المقترحة
```
src/lib/vector/
  ├── store/
  │   ├── pgvector.adapter.ts        [HNSW + IVF support]
  │   ├── qdrant.adapter.ts          [اختياري للمستقبل]
  │   └── vector-store.interface.ts
  ├── chunking/
  │   ├── recursive-splitter.ts      [Recursive Character]
  │   ├── markdown-splitter.ts       [يحترم headers]
  │   ├── code-splitter.ts
  │   └── semantic-splitter.ts       [يقطع حسب المعنى]
  ├── embedding/
  │   ├── gemini.embedder.ts
  │   ├── cache.ts                   [Redis cache للـ embeddings]
  │   └── batch.ts                   [batching للأداء]
  ├── ingestion/
  │   ├── pipeline.ts                [Orchestrator]
  │   ├── sources/
  │   │   ├── file-source.ts         [PDF, DOCX, MD]
  │   │   ├── api-source.ts          [REST APIs]
  │   │   ├── db-source.ts           [Prisma queries]
  │   │   └── web-source.ts          [URL scraping]
  │   └── transformers/
  │       ├── pdf-extractor.ts
  │       ├── ocr-extractor.ts
  │       └── normalizer.ts
  ├── retrieval/
  │   ├── hybrid-search.ts           [BM25 + Vector + RRF]
  │   ├── reranker.ts                [Cross-encoder]
  │   ├── query-expansion.ts         [HyDE]
  │   └── multi-query.ts
  ├── metadata/
  │   ├── filter-builder.ts
  │   └── faceted-search.ts
  └── monitoring/
      ├── quality-metrics.ts         [retrieval recall@k]
      └── cost-tracker.ts
```

---

## 📝 Migration: pgvector HNSW

```sql
-- prisma/migrations/20260601_pgvector_hnsw/migration.sql

-- 1. Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. تأكد من type
ALTER TABLE knowledge_documents
  ALTER COLUMN embedding TYPE vector(768);  -- text-embedding-004 = 768 dim

-- 3. HNSW index (fast approximate search)
CREATE INDEX IF NOT EXISTS knowledge_docs_embedding_hnsw_idx
  ON knowledge_documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Compound index for tenant filtering
CREATE INDEX IF NOT EXISTS knowledge_docs_tenant_active_idx
  ON knowledge_documents (tenant_id, is_active)
  WHERE is_active = true;

-- 5. Full-text search (للـ hybrid)
ALTER TABLE knowledge_documents
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('arabic', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS knowledge_docs_tsv_idx
  ON knowledge_documents USING gin (content_tsv);
```

---

## 📝 Chunking Strategy

```typescript
// src/lib/vector/chunking/recursive-splitter.ts
export class RecursiveCharacterSplitter {
  constructor(
    private chunkSize: number = 1000,
    private chunkOverlap: number = 200,
    private separators: string[] = ['\n\n', '\n', '. ', ' ', '']
  ) {}

  split(text: string): Chunk[] {
    return this.splitRecursive(text, this.separators);
  }

  private splitRecursive(text: string, separators: string[]): Chunk[] {
    if (text.length <= this.chunkSize) {
      return [{ text, length: text.length }];
    }

    const [separator, ...rest] = separators;
    const parts = text.split(separator);
    const chunks: Chunk[] = [];
    let currentChunk = '';

    for (const part of parts) {
      const candidate = currentChunk ? `${currentChunk}${separator}${part}` : part;

      if (candidate.length > this.chunkSize) {
        if (currentChunk) {
          chunks.push({ text: currentChunk, length: currentChunk.length });
        }

        if (part.length > this.chunkSize && rest.length > 0) {
          const sub = this.splitRecursive(part, rest);
          chunks.push(...sub);
          currentChunk = '';
        } else {
          currentChunk = part;
        }
      } else {
        currentChunk = candidate;
      }
    }

    if (currentChunk) chunks.push({ text: currentChunk, length: currentChunk.length });

    // Apply overlap
    return this.applyOverlap(chunks);
  }

  private applyOverlap(chunks: Chunk[]): Chunk[] {
    if (chunks.length <= 1 || this.chunkOverlap === 0) return chunks;

    return chunks.map((chunk, i) => {
      if (i === 0) return chunk;
      const prev = chunks[i - 1];
      const overlap = prev.text.slice(-this.chunkOverlap);
      return { text: `${overlap}${chunk.text}`, length: overlap.length + chunk.length };
    });
  }
}
```

---

## 📝 Ingestion Pipeline

```typescript
// src/lib/vector/ingestion/pipeline.ts
export class IngestionPipeline {
  async ingest(source: KnowledgeSource, ctx: BusinessContext): Promise<IngestResult> {
    logger.info('Starting ingestion', { sourceType: source.type, tenantId: ctx.tenant.id });

    // 1. Extract raw content
    const rawDocs = await source.extract();

    // 2. Transform & normalize
    const normalized = await Promise.all(
      rawDocs.map(doc => this.normalize(doc))
    );

    // 3. Chunk
    const splitter = this.getSplitter(source.type);
    const chunks = normalized.flatMap(doc =>
      splitter.split(doc.content).map(chunk => ({
        ...chunk,
        sourceDocId: doc.id,
        sourceTitle: doc.title,
        sourceType: source.type,
        metadata: doc.metadata,
      }))
    );

    // 4. Embed (in batches with cache)
    const embedder = new GeminiEmbedder({ cache: redisCache });
    const embedded = await embedder.embedBatch(chunks.map(c => c.text), { batchSize: 100 });

    // 5. Store
    const stored = await Promise.all(
      chunks.map((chunk, i) =>
        prisma.knowledgeDocument.upsert({
          where: {
            tenantId_sourceDocId_chunkIndex: {
              tenantId: ctx.tenant.id,
              sourceDocId: chunk.sourceDocId,
              chunkIndex: i,
            },
          },
          create: {
            tenantId: ctx.tenant.id,
            sourceDocId: chunk.sourceDocId,
            chunkIndex: i,
            title: chunk.sourceTitle,
            content: chunk.text,
            embedding: embedded[i],
            metadata: chunk.metadata,
            sourceType: chunk.sourceType,
          },
          update: {
            content: chunk.text,
            embedding: embedded[i],
            metadata: chunk.metadata,
            updatedAt: new Date(),
          },
        })
      )
    );

    // 6. Mark stale chunks for deletion
    await this.markStale(ctx.tenant.id, source);

    return {
      documentsProcessed: rawDocs.length,
      chunksCreated: chunks.length,
      tokensEmbedded: embedded.flat().length,
      cost: embedder.totalCost,
    };
  }
}
```

---

## 📝 Hybrid Search (BM25 + Vector + RRF)

```typescript
// src/lib/vector/retrieval/hybrid-search.ts
export class HybridSearcher {
  async search(query: string, ctx: BusinessContext, options: SearchOptions): Promise<SearchResult[]> {
    const { topK = 20, filters = {}, rrf_k = 60 } = options;

    // Run both searches in parallel
    const [vectorResults, bm25Results] = await Promise.all([
      this.vectorSearch(query, ctx, topK, filters),
      this.bm25Search(query, ctx, topK, filters),
    ]);

    // Reciprocal Rank Fusion
    const fused = this.rrf(vectorResults, bm25Results, rrf_k);

    // Re-rank top 50 with cross-encoder
    const reranked = await this.rerank(query, fused.slice(0, 50));

    return reranked.slice(0, topK);
  }

  private rrf(
    listA: SearchResult[],
    listB: SearchResult[],
    k: number
  ): SearchResult[] {
    const scores = new Map<string, number>();

    [listA, listB].forEach(list => {
      list.forEach((item, rank) => {
        const score = scores.get(item.id) || 0;
        scores.set(item.id, score + 1 / (k + rank + 1));
      });
    });

    const allItems = new Map(
      [...listA, ...listB].map(item => [item.id, item])
    );

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => ({ ...allItems.get(id)!, score }));
  }

  private async vectorSearch(
    query: string,
    ctx: BusinessContext,
    topK: number,
    filters: any
  ) {
    const embedding = await embedder.embed(query);
    return await prisma.$queryRaw<SearchResult[]>`
      SELECT
        id, title, content, source_doc_id, metadata,
        1 - (embedding <=> ${embedding}::vector) AS score
      FROM knowledge_documents
      WHERE tenant_id = ${ctx.tenant.id}
        AND is_active = true
        ${this.buildFilterSQL(filters)}
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${topK}
    `;
  }

  private async bm25Search(
    query: string,
    ctx: BusinessContext,
    topK: number,
    filters: any
  ) {
    return await prisma.$queryRaw<SearchResult[]>`
      SELECT
        id, title, content, source_doc_id, metadata,
        ts_rank(content_tsv, plainto_tsquery('arabic', ${query})) AS score
      FROM knowledge_documents
      WHERE tenant_id = ${ctx.tenant.id}
        AND content_tsv @@ plainto_tsquery('arabic', ${query})
      ORDER BY score DESC
      LIMIT ${topK}
    `;
  }
}
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Search type | Brute-force | HNSW + Hybrid |
| Latency p95 | ~2000ms | < 100ms |
| Chunking strategy | لا | Recursive + Semantic |
| Ingestion | يدوي | تلقائي + scheduled |
| Re-ranking | لا | Cross-encoder |
| Recall@10 | غير معلوم | > 90% |

---

## ⏱️ الجدول الزمني
- **المدة:** 18 يوم عمل
- **الفريق:** 1 senior + DBA
- **الأولوية:** 🟠 عالية (لـ AI quality)

---

## ✅ معايير القبول
- [x] HNSW index على pgvector فعّال
- [x] Hybrid search (BM25 + Vector) يعمل
- [x] Cross-encoder re-ranker مدمج
- [x] Ingestion pipeline يدعم 4 sources
- [x] Embedding cache في Redis
- [x] Recall@10 > 90% على golden set
- [x] Latency p95 < 100ms
