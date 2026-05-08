# 1️⃣1️⃣ Vector Databases | قواعد البيانات الشعاعية

## 🔍 الحالة الحالية

### ✅ الموجود
- **pgvector** في الكود (نظرياً)
- جدول `knowledgeDocument` مع column `embedding`
- `text-embedding-004` من Google

### 🔴 المشكلة الحقيقية (HARDENING.md H-02)
**pgvector في الكود لكن fallback إلى Brute-force JS cosine similarity** → بطيء + يستهلك ذاكرة كبيرة.

---

## 🎯 الخطة التفصيلية

### قرار: pgvector أم Qdrant؟

| المعيار | pgvector | Qdrant | Pinecone |
|---------|----------|--------|----------|
| التكلفة | مجاني | مجاني (self-host) | $70+/شهر |
| Latency p95 | ~50ms (HNSW) | ~30ms | ~20ms |
| Multi-tenant | tenantId filter | Collections per tenant | Namespaces |
| ACID مع DB | ✅ نفس الـ DB | ❌ منفصل | ❌ منفصل |
| Operational complexity | ✅ منخفض | متوسط | منخفض (managed) |
| Filter performance | ضعيف للـ pre-filter | ممتاز | ممتاز |
| Scale لـ 100M+ vectors | ضعيف | ممتاز | ممتاز |

**التوصية:** ابدأ بـ **pgvector** + HNSW (تلبي الاحتياج الحالي < 10M vectors).
انتقل لـ **Qdrant** عندما:
- vectors > 10M
- latency p95 > 200ms
- pre-filter performance يصبح bottleneck

---

### المرحلة 11.1 — Enable pgvector + HNSW (1 يوم)

```sql
-- prisma/migrations/20260601_pgvector_hnsw/migration.sql

-- 1. Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. تحقق من dimension
ALTER TABLE knowledge_documents
  ALTER COLUMN embedding TYPE vector(768)
  USING embedding::vector(768);

-- 3. HNSW index (يحدث الأداء الفعلي)
CREATE INDEX IF NOT EXISTS knowledge_docs_embedding_hnsw_idx
  ON knowledge_documents
  USING hnsw (embedding vector_cosine_ops)
  WITH (
    m = 16,                  -- max connections per layer
    ef_construction = 64     -- build quality
  );

-- 4. ضبط search quality at runtime:
-- SET hnsw.ef_search = 40;  -- runtime quality (default 40)
```

#### Verification
```sql
-- تحقق من استخدام الـ index
EXPLAIN ANALYZE
SELECT id, 1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS score
FROM knowledge_documents
WHERE tenant_id = 'tenant_1'
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- يجب أن نرى: "Index Scan using knowledge_docs_embedding_hnsw_idx"
```

---

### المرحلة 11.2 — Vector Store Adapter (3 أيام)

```typescript
// src/lib/vector/store/vector-store.interface.ts
export interface VectorStore {
  upsert(documents: VectorDocument[]): Promise<void>;
  search(query: SearchQuery): Promise<SearchResult[]>;
  delete(filter: VectorFilter): Promise<number>;
  count(filter?: VectorFilter): Promise<number>;
}

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface SearchQuery {
  embedding: number[];
  topK: number;
  filters?: VectorFilter;
  minScore?: number;
}

export interface VectorFilter {
  tenantId: string;
  sourceType?: string;
  dateRange?: { from: Date; to: Date };
  tags?: string[];
}
```

```typescript
// src/lib/vector/store/pgvector.adapter.ts
export class PgvectorStore implements VectorStore {
  constructor(private prisma: PrismaClient) {}

  async upsert(documents: VectorDocument[]): Promise<void> {
    // Batch insert with raw SQL for performance
    const values = documents.map(doc =>
      Prisma.sql`(${doc.id}, ${doc.metadata.tenantId}, ${doc.content}, ${doc.embedding}::vector, ${doc.metadata}::jsonb)`
    );

    await this.prisma.$executeRaw`
      INSERT INTO knowledge_documents (id, tenant_id, content, embedding, metadata)
      VALUES ${Prisma.join(values)}
      ON CONFLICT (id) DO UPDATE
      SET content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
    `;
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const { embedding, topK, filters, minScore = 0 } = query;

    // Set HNSW search quality
    await this.prisma.$executeRaw`SET LOCAL hnsw.ef_search = 40`;

    const results = await this.prisma.$queryRaw<SearchResult[]>`
      SELECT
        id,
        content,
        metadata,
        1 - (embedding <=> ${embedding}::vector) AS score
      FROM knowledge_documents
      WHERE tenant_id = ${filters!.tenantId}
        AND is_active = true
        ${filters?.sourceType ? Prisma.sql`AND metadata->>'sourceType' = ${filters.sourceType}` : Prisma.empty}
        ${filters?.dateRange ? Prisma.sql`AND (metadata->>'date')::timestamp BETWEEN ${filters.dateRange.from} AND ${filters.dateRange.to}` : Prisma.empty}
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT ${topK}
    `;

    return results.filter(r => r.score >= minScore);
  }

  async delete(filter: VectorFilter): Promise<number> {
    const result = await this.prisma.knowledgeDocument.updateMany({
      where: { tenantId: filter.tenantId, /* ... */ },
      data: { isActive: false, deletedAt: new Date() },
    });
    return result.count;
  }

  async count(filter?: VectorFilter): Promise<number> {
    return await this.prisma.knowledgeDocument.count({
      where: { tenantId: filter?.tenantId, isActive: true },
    });
  }
}
```

```typescript
// src/lib/vector/store/qdrant.adapter.ts (للمستقبل)
import { QdrantClient } from '@qdrant/js-client-rest';

export class QdrantStore implements VectorStore {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async upsert(documents: VectorDocument[]): Promise<void> {
    const collection = this.getCollectionName(documents[0].metadata.tenantId);

    await this.client.upsert(collection, {
      points: documents.map(doc => ({
        id: doc.id,
        vector: doc.embedding,
        payload: { content: doc.content, ...doc.metadata },
      })),
    });
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const collection = this.getCollectionName(query.filters!.tenantId);

    const results = await this.client.search(collection, {
      vector: query.embedding,
      limit: query.topK,
      filter: this.buildFilter(query.filters),
      score_threshold: query.minScore,
      with_payload: true,
    });

    return results.map(r => ({
      id: r.id as string,
      content: r.payload!.content as string,
      metadata: r.payload as any,
      score: r.score,
    }));
  }

  private getCollectionName(tenantId: string): string {
    return `namasoft_${tenantId}`;
  }
}
```

---

### المرحلة 11.3 — Embedding Cache (2 أيام)

```typescript
// src/lib/vector/embedding/cache.ts
export class EmbeddingCache {
  constructor(private redis: Redis) {}

  async get(text: string, model: string): Promise<number[] | null> {
    const key = this.buildKey(text, model);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(text: string, model: string, embedding: number[]): Promise<void> {
    const key = this.buildKey(text, model);
    await this.redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(embedding));
  }

  private buildKey(text: string, model: string): string {
    const hash = crypto.createHash('sha256').update(`${model}:${text}`).digest('hex');
    return `embed:${model}:${hash}`;
  }
}

// src/lib/vector/embedding/gemini.embedder.ts
export class GeminiEmbedder {
  constructor(
    private genAI: GoogleGenerativeAI,
    private cache: EmbeddingCache
  ) {}

  async embed(text: string): Promise<number[]> {
    // Check cache
    const cached = await this.cache.get(text, 'text-embedding-004');
    if (cached) return cached;

    // Embed via API
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    // Cache
    await this.cache.set(text, 'text-embedding-004', embedding);

    return embedding;
  }

  async embedBatch(texts: string[], options: { batchSize?: number } = {}): Promise<number[][]> {
    const batchSize = options.batchSize || 100;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      // Check cache for batch
      const cached = await Promise.all(batch.map(t => this.cache.get(t, 'text-embedding-004')));
      const missingIndices = cached.map((c, idx) => c === null ? idx : -1).filter(i => i !== -1);
      const missingTexts = missingIndices.map(idx => batch[idx]);

      // Embed missing
      let newEmbeddings: number[][] = [];
      if (missingTexts.length > 0) {
        const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const batchResult = await model.batchEmbedContents({
          requests: missingTexts.map(t => ({ content: { parts: [{ text: t }], role: 'user' } })),
        });
        newEmbeddings = batchResult.embeddings.map(e => e.values);

        // Cache new
        await Promise.all(
          missingTexts.map((t, idx) =>
            this.cache.set(t, 'text-embedding-004', newEmbeddings[idx])
          )
        );
      }

      // Merge cached + new
      const merged = batch.map((_, idx) => {
        const cachedEmb = cached[idx];
        if (cachedEmb) return cachedEmb;
        const newIdx = missingIndices.indexOf(idx);
        return newEmbeddings[newIdx];
      });

      results.push(...merged);
    }

    return results;
  }
}
```

---

### المرحلة 11.4 — Multi-tenant Isolation (2 أيام)

```sql
-- Row-Level Security (RLS) for ultimate isolation
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON knowledge_documents
  USING (tenant_id = current_setting('app.tenant_id'));

-- في الكود قبل أي query:
await prisma.$executeRaw`SET app.tenant_id = ${tenantId}`;
```

---

### المرحلة 11.5 — Embedding Versioning (2 أيام)

```typescript
// عندما نغيّر embedding model، نحتاج إعادة فهرسة
model KnowledgeDocument {
  // ...
  embedding         Unsupported("vector(768)")
  embeddingVersion  String  @default("text-embedding-004") @map("embedding_version")
  embeddingModel    String  @default("text-embedding-004") @map("embedding_model")
}

// Re-indexing job
async function reindexAll(newModel: string) {
  const stale = await prisma.knowledgeDocument.findMany({
    where: { embeddingVersion: { not: newModel } },
    take: 1000,
  });

  for (const doc of stale) {
    const newEmbedding = await embedder.embed(doc.content, newModel);
    await prisma.$executeRaw`
      UPDATE knowledge_documents
      SET embedding = ${newEmbedding}::vector,
          embedding_version = ${newModel},
          updated_at = NOW()
      WHERE id = ${doc.id}
    `;
  }
}
```

---

### المرحلة 11.6 — Benchmark (3 أيام)

```typescript
// scripts/benchmark-vector.ts
const BENCHMARK_QUERIES = 1000;
const TENANTS = 10;
const DOCS_PER_TENANT = 100_000;

async function benchmark() {
  // Setup: insert 1M vectors
  for (const tenant of tenants) {
    await insertDocuments(tenant, DOCS_PER_TENANT);
  }

  // Measure
  const latencies: number[] = [];
  for (let i = 0; i < BENCHMARK_QUERIES; i++) {
    const start = performance.now();
    await store.search({
      embedding: randomEmbedding(),
      topK: 10,
      filters: { tenantId: randomTenant() },
    });
    latencies.push(performance.now() - start);
  }

  console.log({
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    avg: latencies.reduce((a, b) => a + b) / latencies.length,
  });
}

// النتائج المتوقعة:
// p50: 8ms
// p95: 50ms
// p99: 150ms
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Index type | لا | HNSW |
| Search algorithm | Brute-force JS | Native pgvector |
| Latency p95 | ~2000ms | < 100ms |
| Embedding cache | لا | Redis 7-day TTL |
| Multi-tenant isolation | tenantId filter | RLS + filter |
| Versioning | لا | model + version tracked |
| Benchmark | لم يُقاس | موثّق |

---

## ⏱️ الجدول الزمني
- **المدة:** 13 يوم عمل
- **الفريق:** 1 senior backend + DBA
- **الأولوية:** 🟠 عالية (يفتح RAG quality)

---

## ✅ معايير القبول
- [x] HNSW index فعّال على pgvector
- [x] VectorStore interface موحّد (pgvector + qdrant ready)
- [x] Embedding cache يعمل في Redis
- [x] Multi-tenant isolation عبر RLS
- [x] Re-indexing job يدعم تغيير model
- [x] Benchmark > 1000 query/s with p95 < 100ms
- [x] Decision document: متى ننتقل لـ Qdrant
