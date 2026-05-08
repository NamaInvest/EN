// src/lib/rag/pipeline.ts
// Main RAG orchestrator: query transformation → retrieval → reranking → generation → citations.

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PgvectorStore } from '../vector/store/pgvector.adapter';
import { GeminiEmbedder } from '../vector/embedding/gemini.embedder';
import { HyDETransformer } from './query-transformers/hyde.transformer';
import { MultiQueryTransformer } from './query-transformers/multi-query.transformer';
import { CitationTracker, type Citation } from './citations/tracker';

export interface RAGRequest {
  query: string;
  tenantId: string;
  filters?: {
    sourceType?: string;
    dateRange?: { from: Date; to: Date };
    tags?: string[];
  };
  options?: {
    topK?: number;
    minScore?: number;
    enableHyDE?: boolean;
    enableMultiQuery?: boolean;
    enableCitations?: boolean;
    efSearch?: number;
  };
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface RAGResponse {
  answer: string;
  citations: Citation[];
  retrievedChunks: RetrievedChunk[];
  metadata: {
    queryTimeMs: number;
    retrievalTimeMs: number;
    generationTimeMs: number;
    chunksRetrieved: number;
    chunksUsed: number;
    queriesGenerated: number;
  };
}

export class RAGPipeline {
  constructor(
    private store: PgvectorStore,
    private embedder: GeminiEmbedder,
    private llm: ChatGoogleGenerativeAI,
    private hyde: HyDETransformer,
    private multiQuery: MultiQueryTransformer,
    private citationTracker: CitationTracker
  ) {}

  async run(request: RAGRequest): Promise<RAGResponse> {
    const totalStart = performance.now();
    const opts = {
      topK: 10,
      minScore: 0.5,
      enableHyDE: false,
      enableMultiQuery: false,
      enableCitations: true,
      efSearch: 40,
      ...request.options,
    };

    // ── Step 1: Query Transformation ──────────────────────────────────────
    const queries: string[] = [request.query];

    if (opts.enableHyDE) {
      const hypothetical = await this.hyde.transform(request.query);
      queries.push(hypothetical);
    }

    if (opts.enableMultiQuery) {
      const variations = await this.multiQuery.generate(request.query);
      queries.push(...variations);
    }

    // ── Step 2: Embed all queries ──────────────────────────────────────────
    const embeddings = await this.embedder.embedBatch(queries);

    // ── Step 3: Retrieve from all query embeddings ─────────────────────────
    const retrievalStart = performance.now();
    const allChunks: RetrievedChunk[] = [];

    for (const embedding of embeddings) {
      const results = await this.store.search({
        embedding,
        topK: opts.topK * 2,
        filters: { tenantId: request.tenantId, ...request.filters },
        minScore: opts.minScore,
      });
      allChunks.push(...results.map(r => ({
        id: r.id,
        documentId: r.metadata?.documentId || r.id,
        chunkIndex: r.metadata?.chunkIndex || 0,
        content: r.content,
        score: r.score,
        metadata: r.metadata
      })));
    }

    // Deduplicate by chunk id, keep highest score
    const seen = new Map<string, RetrievedChunk>();
    for (const chunk of allChunks) {
      const existing = seen.get(chunk.id);
      if (!existing || chunk.score > existing.score) {
        seen.set(chunk.id, chunk);
      }
    }

    const uniqueChunks = Array.from(seen.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.topK);

    const retrievalTimeMs = performance.now() - retrievalStart;

    // ── Step 4: Build context ──────────────────────────────────────────────
    const context = this.buildContext(uniqueChunks);

    // ── Step 5: Generate answer ────────────────────────────────────────────
    const generationStart = performance.now();

    const systemPrompt = `أنت مساعد ذكي في نظام Namasoft ERP السعودي.
أجب على السؤال استناداً إلى السياق المقدم فقط.
إذا لم تجد الإجابة في السياق، قل ذلك صراحةً.
أشر إلى المصادر بصيغة [المصدر N] عند استخدامها.`;

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `السياق:\n${context}\n\nالسؤال: ${request.query}`,
      },
    ]);

    const answer = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const generationTimeMs = performance.now() - generationStart;

    // ── Step 6: Extract citations ──────────────────────────────────────────
    const citations = opts.enableCitations
      ? this.citationTracker.extract(answer, uniqueChunks)
      : [];

    return {
      answer,
      citations,
      retrievedChunks: uniqueChunks,
      metadata: {
        queryTimeMs: performance.now() - totalStart,
        retrievalTimeMs,
        generationTimeMs,
        chunksRetrieved: allChunks.length,
        chunksUsed: uniqueChunks.length,
        queriesGenerated: queries.length,
      },
    };
  }

  private buildContext(chunks: RetrievedChunk[]): string {
    return chunks
      .map(
        (chunk, i) =>
          `[المصدر ${i + 1}]\n` +
          `المحتوى: ${chunk.content}\n` +
          (chunk.metadata?.title ? `العنوان: ${chunk.metadata.title}\n` : '') +
          (chunk.metadata?.sourceType ? `النوع: ${chunk.metadata.sourceType}\n` : '') +
          `التطابق: ${(chunk.score * 100).toFixed(0)}%`
      )
      .join('\n\n---\n\n');
  }
}
