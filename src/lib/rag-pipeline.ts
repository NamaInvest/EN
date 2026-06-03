/**
 * RAG Pipeline — P3.9 (Production Grade with pgvector + Gemini)
 * ─────────────────────────────────────────────────────────────────────────────
 * Retrieval-Augmented Generation for AI CFO Assistant.
 *
 * Features:
 *   - Document chunking (500 chars, 50 overlap)
 *   - pgvector HNSW semantic search via raw SQL
 *   - BM25 keyword fallback
 *   - Hybrid RRF scoring (Reciprocal Rank Fusion)
 *   - Gemini embedding (text-embedding-004, 768 dims)
 *   - Citation tracking per answer
 *   - Context window management (≤3000 tokens)
 *   - Tenant-scoped retrieval
 */

import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ route: 'RAG' });

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RagDocument {
  id:       string;
  content:  string;
  metadata: Record<string, unknown>;
  score?:   number;
}

export interface RagCitation {
  documentId: string;
  title:      string;
  excerpt:    string;
  score:      number;
  source:     'vector' | 'keyword' | 'hybrid';
}

export interface RagResponse {
  answer:     string;
  citations:  RagCitation[];
  tokensUsed: number;
  latencyMs:  number;
  docCount:   number;
}

export interface RagQueryOptions {
  limit?:      number;  // top-k results (default: 6)
  maxContext?: number;  // max context chars (default: 3000)
  tenantId?:   string;
  hybrid?:     boolean; // use hybrid search (default: true)
}

// ── Chunking ──────────────────────────────────────────────────────────────────

export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) chunks.push(chunk);
    start = end - overlap;
    if (start >= text.length) break;
  }
  return chunks;
}

// ── Cosine similarity (float arrays) ─────────────────────────────────────────

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

// ── Embedding via Gemini API ──────────────────────────────────────────────────

async function embed(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text }] }, taskType: 'RETRIEVAL_QUERY' }),
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.embedding?.values ?? null;
  } catch {
    return null;
  }
}

// ── pgvector HNSW Search ──────────────────────────────────────────────────────

async function vectorSearch(
  queryEmbedding: number[],
  tenantId: string,
  limit: number
): Promise<RagDocument[]> {
  const prisma = getPrisma();
  try {
    // pgvector cosine distance operator: <=>
    const embStr = `[${queryEmbedding.join(',')}]`;
    const rows = await (prisma as any).$queryRawUnsafe(`
      SELECT
        id::text AS id,
        content,
        metadata::text AS metadata,
        1 - (embedding <=> '${embStr}'::vector) AS score
      FROM knowledge_documents
      WHERE tenant_id = $1
        AND is_active = true
        AND embedding IS NOT NULL
      ORDER BY embedding <=> '${embStr}'::vector
      LIMIT $2
    `, tenantId, limit) as any[];

    return rows.map((r: any) => ({
      id:       r.id,
      content:  r.content,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata ?? {}),
      score:    Number(r.score),
    }));
  } catch {
    return [];
  }
}

// ── BM25-like Keyword Search ──────────────────────────────────────────────────

async function keywordSearch(
  query: string,
  tenantId: string,
  limit: number
): Promise<RagDocument[]> {
  const prisma = getPrisma();
  const terms  = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (!terms.length) return [];

  try {
    // PostgreSQL full-text search with ts_rank
    const tsQuery = terms.join(' | ');
    const rows = await (prisma as any).$queryRawUnsafe(`
      SELECT
        id::text,
        content,
        metadata::text,
        ts_rank(to_tsvector('simple', content), to_tsquery('simple', $1)) AS score
      FROM knowledge_documents
      WHERE tenant_id = $2
        AND is_active = true
        AND to_tsvector('simple', content) @@ to_tsquery('simple', $1)
      ORDER BY score DESC
      LIMIT $3
    `, tsQuery, tenantId, limit) as any[];

    return rows.map((r: any) => ({
      id:       r.id,
      content:  r.content,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata ?? {}),
      score:    Number(r.score),
    }));
  } catch {
    return [];
  }
}

// ── Reciprocal Rank Fusion ────────────────────────────────────────────────────

function rrfFusion(
  vectorResults: RagDocument[],
  keywordResults: RagDocument[],
  k = 60
): RagDocument[] {
  const scores = new Map<string, { doc: RagDocument; score: number; source: string }>();

  vectorResults.forEach((doc, rank) => {
    const rrfScore = 1 / (k + rank + 1);
    scores.set(doc.id, { doc, score: rrfScore, source: 'vector' });
  });

  keywordResults.forEach((doc, rank) => {
    const rrfScore = 1 / (k + rank + 1);
    const existing = scores.get(doc.id);
    if (existing) {
      existing.score += rrfScore;
      existing.source = 'hybrid';
    } else {
      scores.set(doc.id, { doc, score: rrfScore, source: 'keyword' });
    }
  });

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map(v => ({ ...v.doc, score: v.score }));
}

// ── Main RAG Pipeline ─────────────────────────────────────────────────────────

export const ragPipeline = {
  /**
   * Ingest document into pgvector store
   */
  async ingest(
    id: string,
    content: string,
    metadata: Record<string, unknown> = {},
    tenantId: string
  ): Promise<{ chunkCount: number; embedded: boolean }> {
    if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach: tenantId is strictly required.');
    const prisma  = getPrisma();
    const chunks  = chunkText(content);
    let embedded  = false;

    for (let i = 0; i < chunks.length; i++) {
      const chunkId  = `${id}_chunk_${i}`;
      const chunkMeta = { ...metadata, sourceId: id, chunkIndex: i, totalChunks: chunks.length };
      const embedding = await embed(chunks[i]);
      embedded = embedded || !!embedding;

      await (prisma as any).knowledgeDocument.upsert({
        where:  { id: chunkId },
        create: {
          id:         chunkId,
          tenantId,
          content:    chunks[i],
          metadata:   chunkMeta,
          isActive:   true,
          ...(embedding ? { embedding } : {}),
        },
        update: {
          content:  chunks[i],
          metadata: chunkMeta,
          isActive: true,
          ...(embedding ? { embedding } : {}),
        },
      }).catch((e: any) => log.error(`ingest chunk failed: ${e.message}`));
    }

    log.info(`RAG ingest complete: id=${id}, chunks=${chunks.length}, embedded=${embedded}`);
    return { chunkCount: chunks.length, embedded };
  },

  /**
   * Hybrid RAG query: semantic + keyword + RRF fusion
   */
  async query(
    question: string,
    options: RagQueryOptions = {}
  ): Promise<RagResponse> {
    const start     = Date.now();
    const limit     = options.limit     ?? 6;
    const maxCtx    = options.maxContext ?? 3000;
    const tenantId  = options.tenantId;
    if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach: tenantId is strictly required for RAG queries.');
    const useHybrid = options.hybrid    ?? true;

    // 1. Embed query
    const queryEmbedding = await embed(question);

    // 2. Parallel search
    const [vecResults, kwResults] = await Promise.all([
      queryEmbedding ? vectorSearch(queryEmbedding, tenantId, limit) : Promise.resolve([]),
      useHybrid       ? keywordSearch(question, tenantId, limit)      : Promise.resolve([]),
    ]);

    // 3. Fuse results
    const fused = queryEmbedding
      ? rrfFusion(vecResults, kwResults)
      : kwResults;

    // 4. Build context (respect max window)
    let context = '';
    const citations: RagCitation[] = [];

    for (const doc of fused.slice(0, limit)) {
      if (context.length + doc.content.length > maxCtx) break;
      context += `\n---\n${doc.content}`;
      const meta = doc.metadata as any;
      citations.push({
        documentId: doc.id,
        title:      meta.title ?? meta.sourceId ?? doc.id,
        excerpt:    doc.content.slice(0, 120),
        score:      Math.round((doc.score ?? 0) * 1000) / 1000,
        source:     (vecResults.find(v => v.id === doc.id) && kwResults.find(k => k.id === doc.id))
                    ? 'hybrid' : vecResults.find(v => v.id === doc.id) ? 'vector' : 'keyword',
      });
    }

    // 5. Answer placeholder (caller passes context to LLM)
    const answer = citations.length > 0
      ? `تم العثور على ${citations.length} مصدر ذي صلة.`
      : 'لم يتم العثور على معلومات كافية في قاعدة المعرفة.';

    return {
      answer,
      citations,
      tokensUsed:  context.length,
      latencyMs:   Date.now() - start,
      docCount:    fused.length,
    };
  },

  /**
   * Get RAG store stats for a tenant
   */
  async stats(tenantId: string): Promise<{ documents: number; chunks: number; embedded: number }> {
    if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach: tenantId is strictly required.');
    const prisma = getPrisma();
    try {
      const [total, withEmbedding] = await Promise.all([
        (prisma as any).knowledgeDocument.count({ where: { tenantId, isActive: true } }),
        (prisma as any).knowledgeDocument.count({ where: { tenantId, isActive: true, embedding: { not: null } } }),
      ]);
      return { documents: total, chunks: total, embedded: withEmbedding ?? 0 };
    } catch {
      return { documents: 0, chunks: 0, embedded: 0 };
    }
  },

  /** Simple keyword-only search (no DB) */
  search(query: string): RagDocument[] {
    return []; // in-memory removed — use DB via query()
  },

  /** No-op: DB backed now */
  ingestSync(id: string, content: string, metadata: Record<string, unknown> = {}): string[] {
    log.warn('ingestSync() is deprecated — use async ingest()');
    return [];
  },
};
