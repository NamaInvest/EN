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
    const emb    = await getEmbeddings();
    const vector = await emb.embedQuery(content);

    const prisma = getPrisma();
    const doc    = await prisma.knowledgeDocument.create({
        data: { tenantId, title, content, embedding: vector, metadata },
    });

    logger.info({ tenantId }, 'vector-store: document indexed', { docId: doc.id, title });
    return doc.id;
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
    const emb         = await getEmbeddings();
    const queryVector = await emb.embedQuery(query);
    const prisma      = getPrisma();

    // ── Try pgvector first ───────────────────────────────────────
    try {
        // pgvector syntax: ORDER BY embedding <=> '[...]'::vector LIMIT k
        const vectorLiteral = `[${queryVector.join(',')}]`;
        const rows: any[] = await (prisma as any).$queryRaw`
            SELECT id, title, content, metadata,
                   1 - (embedding <=> ${vectorLiteral}::vector) AS score
            FROM knowledge_documents
            WHERE tenant_id = ${tenantId}
            ORDER BY embedding <=> ${vectorLiteral}::vector
            LIMIT ${topK}
        `;
        logger.info({ tenantId }, 'vector-store: pgvector search', { hits: rows.length });
        return rows.map(r => ({ ...r, score: parseFloat(r.score) }));
    } catch {
        // Extension not enabled — fall through to JS fallback
        logger.warn({ tenantId }, 'vector-store: pgvector unavailable, using JS fallback');
    }

    // ── JS cosine fallback ───────────────────────────────────────
    const allDocs = await prisma.knowledgeDocument.findMany({
        where: { tenantId },
        take: 500,
        select: { id: true, title: true, content: true, embedding: true, metadata: true },
    });

    const scored = allDocs.map((doc: any) => {
        const vec   = doc.embedding as number[] | null;
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
    const docs = await searchVectorMine(tenantId, userQuery, 3);
    let ctx = 'Here is the relevant company knowledge:\n\n';
    for (const [i, doc] of docs.entries()) {
        if (doc.score > 0.5) {
            ctx += `--- Document ${i + 1}: ${doc.title} ---\n${doc.content}\n\n`;
        }
    }
    return ctx;
}

