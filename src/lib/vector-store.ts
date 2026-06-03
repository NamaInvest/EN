import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Lazy-load embeddings to prevent build failure if @langchain/google-genai not installed
let _embeddings: any = null;
async function getEmbeddings() {
    if (!_embeddings) {
        try {
            const { GoogleGenerativeAIEmbeddings } = await import('@langchain/google-genai');
            _embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GEMINI_API_KEY,
                modelName: 'text-embedding-004',
            });
        } catch {
            logger.warn({}, 'vector-store: @langchain/google-genai not available — using zero embeddings');
            _embeddings = { embedQuery: async () => new Array(768).fill(0) };
        }
    }
    return _embeddings;
}

/**
 * Cosine similarity fallback — used when pgvector is unavailable.
 */
function cosineSimilarity(A: number[], B: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < A.length; i++) {
        dot   += A[i] * B[i];
        normA += A[i] * A[i];
        normB += B[i] * B[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * VectorMine — store a document with its embedding.
 */
export async function addDocumentToVectorMine(
    tenantId: string,
    title: string,
    content: string,
    metadata: Record<string, any> = {}
): Promise<number> {
    if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach in vector-store: tenantId is strictly required.');
    const emb    = await getEmbeddings();
    const vector = await emb.embedQuery(content);

    const prisma = getPrisma();
    const doc    = await prisma.knowledgeDocument.create({
        data: { 
            tenantId, 
            title, 
            content, 
            metadata,
            chunks: {
                create: {
                    tenantId,
                    chunkIndex: 0,
                    content,
                    embedding: vector,
                    tokenCount: Math.ceil(content.length / 4)
                }
            }
        },
    });

    logger.info({ tenantId }, 'vector-store: document indexed', { docId: doc.id, title });
    return doc.id as unknown as number;
}

/**
 * VectorMine — semantic search.
 * Tries native pgvector (<=> operator) first; falls back to JS cosine if the extension
 * is unavailable or the column type is plain JSON.
 */
export async function searchVectorMine(
    tenantId: string,
    query: string,
    topK = 5
): Promise<Array<{ id: number; title: string; content: string; score: number; metadata: any }>> {
    if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach in vector-store: tenantId is strictly required.');
    const emb         = await getEmbeddings();
    const queryVector = await emb.embedQuery(query);
    const prisma      = getPrisma();

    // ── Try pgvector first ───────────────────────────────────────
    try {
        // pgvector syntax: ORDER BY embedding <=> '[...]'::vector LIMIT k
        const vectorLiteral = `[${queryVector.join(',')}]`;
        const rows: any[] = await (prisma as any).$queryRaw`
            SELECT d.id, d.title, d.content, d.metadata,
                   1 - (c.embedding_vec <=> ${vectorLiteral}::vector) AS score
            FROM knowledge_documents d
            JOIN knowledge_chunks c ON d.id = c.document_id
            WHERE d.tenant_id = ${tenantId}
            ORDER BY c.embedding_vec <=> ${vectorLiteral}::vector
            LIMIT ${topK}
        `;
        logger.info({ tenantId, hits: rows.length }, 'vector-store: pgvector search');
        return rows.map(r => ({ ...r, score: parseFloat(r.score) }));
    } catch {
        // Extension not enabled — fall through to JS fallback
        logger.warn({ tenantId }, 'vector-store: pgvector unavailable, using JS fallback');
    }

    // ── JS cosine fallback ───────────────────────────────────────
    const allDocs = await prisma.knowledgeDocument.findMany({
        where: { tenantId },
        take: 500,
        select: { id: true, title: true, content: true, metadata: true, chunks: { select: { embedding: true } } },
    });

    const scored = allDocs.map((doc: any) => {
        const vec   = doc.chunks?.[0]?.embedding as number[] | null;
        const score = vec ? cosineSimilarity(queryVector, vec) : 0;
        return { id: doc.id, title: doc.title, content: doc.content, score, metadata: doc.metadata };
    });

    scored.sort((a: any, b: any) => b.score - a.score);
    return scored.slice(0, topK);
}

/**
 * RAG context builder — retrieves top-K documents and formats them as a context string.
 */
export async function queryRAG(tenantId: string, userQuery: string): Promise<string> {
    if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach in vector-store: tenantId is strictly required.');
    const docs = await searchVectorMine(tenantId, userQuery, 3);
    let ctx = 'Here is the relevant company knowledge:\n\n';
    for (const [i, doc] of docs.entries()) {
        if (doc.score > 0.5) {
            ctx += `--- Document ${i + 1}: ${doc.title} ---\n${doc.content}\n\n`;
        }
    }
    return ctx;
}

/**
 * G11: pgvector chunk-level semantic search.
 * Uses the KnowledgeChunk table with vector column from add_pgvector migration.
 * Falls back gracefully if pgvector extension is not enabled.
 */
export async function searchChunksPgVector(
    tenantId: string,
    query: string,
    topK = 10,
    similarityThreshold = 0.7,
): Promise<Array<{ id: string; documentId: string; chunkText: string; metadata: any; similarity: number }>> {
    if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach in vector-store: tenantId is strictly required.');
    const emb         = await getEmbeddings();
    const queryVector = await emb.embedQuery(query);
    const prisma      = getPrisma();

    try {
        const vectorStr = `[${queryVector.join(',')}]`;
        const rows: any[] = await (prisma as any).$queryRawUnsafe(`
            SELECT id, "documentId", "chunkText", metadata,
                   1 - (embedding <=> '${vectorStr}'::vector) AS similarity
            FROM "KnowledgeChunk"
            WHERE "tenantId" = $1
              AND embedding IS NOT NULL
              AND 1 - (embedding <=> '${vectorStr}'::vector) >= $2
            ORDER BY embedding <=> '${vectorStr}'::vector
            LIMIT $3
        `, tenantId, similarityThreshold, topK);
        return rows.map((r: any) => ({ ...r, similarity: parseFloat(r.similarity) }));
    } catch {
        logger.warn({}, 'searchChunksPgVector: pgvector unavailable, returning empty');
        return [];
    }
}

/**
 * G11: Ingest a document into pgvector-backed chunk store.
 * Chunks text by ~500 tokens with 50-token overlap.
 * Stores embedding per chunk for fast ANN retrieval.
 */
export async function ingestDocumentChunks(
    tenantId: string,
    documentId: string,
    text: string,
): Promise<number> {
    if (!tenantId || tenantId === 'default') throw new Error('Tenant isolation breach in vector-store: tenantId is strictly required.');
    const CHUNK_SIZE   = 2000;   // ~500 tokens in chars (4 chars/token avg)
    const OVERLAP      = 200;    // ~50 tokens overlap
    const emb          = await getEmbeddings();
    const prisma       = getPrisma();

    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
        if (i + CHUNK_SIZE >= text.length) break;
    }

    let inserted = 0;
    for (const [idx, chunk] of chunks.entries()) {
        const vector = await emb.embedQuery(chunk);
        const vectorStr = `[${vector.join(',')}]`;

        try {
            await (prisma as any).$executeRawUnsafe(`
                INSERT INTO "KnowledgeChunk" (id, "tenantId", "documentId", "chunkText", "chunkIndex", metadata, embedding, "createdAt")
                VALUES (
                    gen_random_uuid()::text, $1, $2, $3, $4,
                    '{}'::jsonb,
                    '${vectorStr}'::vector,
                    NOW()
                )
                ON CONFLICT DO NOTHING
            `, tenantId, documentId, chunk, idx);
        } catch {
            // pgvector not available — store without embedding (JS fallback still works)
            await (prisma as any).knowledgeChunk?.create?.({
                data: { tenantId, documentId, chunkText: chunk, chunkIndex: idx, metadata: {} },
            }).catch(() => null);
        }
        inserted++;
    }

    logger.info({ tenantId, documentId, chunks: inserted }, 'ingestDocumentChunks: indexed');
    return inserted;
}
