---
version: 1.0
last_updated: 2026-05-12
---

# RAG Pipeline & Vector Storage

> Retrieval-Augmented Generation للمستندات والـ knowledge base ودعم AI Copilot.

## البنية العامة

```
Documents (PDFs, Word, code, docs/, prompts)
       │
       ├── Tika / pdf-parse / mammoth (extract text)
       │
       ▼
   Chunking (overlap = 200 tokens, size = 1000 tokens)
       │
       ▼
   Embedding (OpenAI text-embedding-3-small or Cohere multilingual-v3)
       │
       ▼
   Vector Store (pgvector or Qdrant)
       │
       ▼
   Query: embed question → kNN search → top 10 chunks → rerank → top 5
       │
       ▼
   LLM with context window: [system, retrieved chunks, question]
```

## Schema (pgvector)

```sql
-- prisma/migrations/xxx_add_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_chunks (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id   TEXT NOT NULL,
  document_id TEXT NOT NULL,
  content     TEXT NOT NULL,
  metadata    JSONB,
  embedding   vector(1536) NOT NULL,
  token_count INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_doc FOREIGN KEY (document_id) REFERENCES knowledge_documents(id)
);

CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON knowledge_chunks (tenant_id, document_id);
CREATE INDEX ON knowledge_chunks USING GIN (metadata jsonb_path_ops);
```

## Models (Prisma)

```prisma
model KnowledgeDocument {
  id          String   @id @default(cuid())
  tenantId    String
  title       String
  source      String   // 'manual-upload' | 'crawled' | 'api'
  sourceUri   String?
  contentType String   // 'pdf' | 'docx' | 'md' | 'html'
  status      String   // 'PROCESSING' | 'INDEXED' | 'FAILED'
  hash        String   // content hash for dedup
  tags        String[]
  createdAt   DateTime @default(now())
  chunks      KnowledgeChunk[]
  
  @@unique([tenantId, hash])
  @@index([tenantId, status])
}

model KnowledgeChunk {
  id         String   @id @default(cuid())
  tenantId   String
  documentId String
  content    String   @db.Text
  metadata   Json?
  // embedding stored via raw SQL (pgvector)
  tokenCount Int
  position   Int      // chunk index in document
  createdAt  DateTime @default(now())
  document   KnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@index([tenantId, documentId])
}
```

## Ingestion Pipeline

```typescript
// src/lib/rag-pipeline.ts
import { encoding_for_model } from "tiktoken";
import { OpenAIEmbeddings } from "@langchain/openai";

export class RagPipeline {
  private embedder = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    dimensions: 1536,
  });
  
  async ingestDocument(input: {
    tenantId: string;
    title: string;
    contentType: string;
    sourceUri?: string;
    rawContent: Buffer | string;
    tags?: string[];
  }): Promise<KnowledgeDocument> {
    
    // 1. Extract text
    const text = await this.extractText(input.contentType, input.rawContent);
    const hash = await this.hashContent(text);
    
    // 2. Dedup check
    const existing = await prisma.knowledgeDocument.findUnique({
      where: { tenantId_hash: { tenantId: input.tenantId, hash } },
    });
    if (existing) return existing;
    
    // 3. Create document
    const doc = await prisma.knowledgeDocument.create({
      data: {
        tenantId: input.tenantId,
        title: input.title,
        source: 'manual-upload',
        sourceUri: input.sourceUri,
        contentType: input.contentType,
        status: 'PROCESSING',
        hash,
        tags: input.tags ?? [],
      },
    });
    
    // 4. Chunk
    const chunks = this.chunkText(text, { chunkSize: 1000, overlap: 200 });
    
    // 5. Embed in batches
    const batchSize = 50;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await this.embedder.embedDocuments(batch.map(c => c.text));
      
      // 6. Persist with raw SQL for vector
      for (let j = 0; j < batch.length; j++) {
        const vec = embeddings[j];
        await prisma.$executeRawUnsafe(
          `INSERT INTO knowledge_chunks (id, tenant_id, document_id, content, metadata, embedding, token_count, position)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5::vector, $6, $7)`,
          input.tenantId,
          doc.id,
          batch[j].text,
          JSON.stringify(batch[j].metadata),
          `[${vec.join(',')}]`,
          batch[j].tokenCount,
          i + j
        );
      }
    }
    
    // 7. Mark indexed
    return await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: { status: 'INDEXED' },
    });
  }
  
  private chunkText(text: string, { chunkSize, overlap }: { chunkSize: number; overlap: number }) {
    const enc = encoding_for_model("gpt-4");
    const tokens = enc.encode(text);
    const chunks: { text: string; tokenCount: number; metadata: any }[] = [];
    
    for (let i = 0; i < tokens.length; i += (chunkSize - overlap)) {
      const slice = tokens.slice(i, i + chunkSize);
      const text = new TextDecoder().decode(enc.decode(slice));
      chunks.push({
        text,
        tokenCount: slice.length,
        metadata: { startToken: i, endToken: i + slice.length },
      });
    }
    
    enc.free();
    return chunks;
  }
  
  async retrieve(query: {
    tenantId: string;
    question: string;
    topK?: number;
    filter?: { documentIds?: string[]; tags?: string[] };
  }): Promise<{ content: string; metadata: any; score: number }[]> {
    
    // 1. Embed query
    const [queryEmbedding] = await this.embedder.embedDocuments([query.question]);
    
    // 2. kNN search with tenant + filter
    let sql = `
      SELECT id, content, metadata, 1 - (embedding <=> $1::vector) AS score
      FROM knowledge_chunks
      WHERE tenant_id = $2
    `;
    const params: any[] = [`[${queryEmbedding.join(',')}]`, query.tenantId];
    
    if (query.filter?.documentIds?.length) {
      sql += ` AND document_id = ANY($${params.length + 1})`;
      params.push(query.filter.documentIds);
    }
    
    sql += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(query.topK ?? 10);
    
    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
    
    // 3. Rerank (optional, with Cohere reranker)
    // ...
    
    return rows.map(r => ({
      content: r.content,
      metadata: r.metadata,
      score: r.score,
    }));
  }
}
```

## Sources to Index

Pre-load these into the tenant's KB on creation:

1. **System docs:** docs/MASTER_PACK/* (this folder)
2. **Module READMEs:** src/app/**/README.md
3. **CLAUDE.md** + BUSINESS_FLOWS_GUIDE.md + GLOBAL_ERP_GAP_ANALYSIS.md
4. **Saudi compliance KB:** ZATCA spec PDFs + GOSI guide + WPS spec + Saudi Labor Law
5. **SOCPA Chart of Accounts** template
6. **OpenAPI spec** (auto-regenerated nightly)

## Hybrid Search (Vector + Full-Text)

```typescript
// أفضل من vector فقط — يجمع الاثنين
async hybridSearch(tenantId: string, query: string, topK = 10) {
  // 1. Vector
  const vector = await this.retrieve({ tenantId, question: query, topK: topK * 2 });
  
  // 2. Full-text (pg_trgm or tsvector)
  const fts = await prisma.$queryRaw<any[]>`
    SELECT id, content, metadata,
      ts_rank(to_tsvector('arabic_english', content), plainto_tsquery(${query})) AS score
    FROM knowledge_chunks
    WHERE tenant_id = ${tenantId}
      AND to_tsvector('arabic_english', content) @@ plainto_tsquery(${query})
    ORDER BY score DESC
    LIMIT ${topK * 2}
  `;
  
  // 3. Reciprocal Rank Fusion (RRF)
  const fused = this.rrf(vector, fts, topK);
  return fused;
}

rrf(listA: Result[], listB: Result[], topK: number, k = 60) {
  const scores = new Map<string, number>();
  listA.forEach((r, i) => scores.set(r.id, (scores.get(r.id) ?? 0) + 1 / (k + i)));
  listB.forEach((r, i) => scores.set(r.id, (scores.get(r.id) ?? 0) + 1 / (k + i)));
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => ({ id, score }));
}
```

## Re-indexing Strategy

- **On document update:** delete old chunks + re-ingest
- **Weekly cron:** check for stale documents (last_indexed_at < updated_at)
- **Migration on embedding model change:** background job re-embeds all (with batching + rate limiting)

## Tenant Isolation

- `tenant_id` filter is MANDATORY in every retrieve
- Cross-tenant search forbidden (handled at SQL layer + index includes tenant_id)
- Embedding caches keyed by content hash (shared across tenants when content identical — e.g., ZATCA spec)
