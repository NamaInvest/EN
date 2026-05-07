import { getPrisma } from '@/lib/prisma';

// Lazy-load embeddings to prevent build failure if @langchain/google-genai not installed
let _embeddings: any = null;
async function getEmbeddings() {
    if (!_embeddings) {
        try {
            const { GoogleGenerativeAIEmbeddings } = await import("@langchain/google-genai");
            _embeddings = new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GEMINI_API_KEY,
                modelName: "text-embedding-004",
            });
        } catch {
            console.warn('⚠️ @langchain/google-genai not available, using dummy embeddings');
            _embeddings = { embedQuery: async () => new Array(768).fill(0) };
        }
    }
    return _embeddings;
}

/**
 * Calculates cosine similarity between two numeric arrays
 */
function cosineSimilarity(A: number[], B: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < A.length; i++) {
        dotProduct += A[i] * B[i];
        normA += A[i] * A[i];
        normB += B[i] * B[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * VectorMine: Native Vector DB fallback implementation.
 * Stores a document, generates an embedding, and saves to KnowledgeDocument.
 */
export async function addDocumentToVectorMine(tenantId: string, title: string, content: string, metadata: any = {}) {
    // 1. Generate embedding
    const emb = await getEmbeddings();
    const vector = await emb.embedQuery(content);

    // 2. Save to database using Prisma JSON field
    const prisma = getPrisma();
    const doc = await prisma.knowledgeDocument.create({
        data: {
            tenantId,
            title,
            content,
            embedding: vector, // Array of floats saved as JSON
            metadata
        }
    });

    return doc.id;
}

/**
 * VectorMine: Native Search implementation.
 * Performs a brute-force cosine similarity search across tenant documents.
 * In a large-scale scenario, this would be swapped out for pgvector natively or Pinecone.
 */
export async function searchVectorMine(tenantId: string, query: string, topK: number = 3) {
    const emb = await getEmbeddings();
    const queryVector = await emb.embedQuery(query);

    const prisma = getPrisma();
    // Fetch all documents for the tenant
    // Note: This is an in-memory brute force since pgvector is unavailable locally.
    const allDocs = await prisma.knowledgeDocument.findMany({
        where: { tenantId },
        select: { id: true, title: true, content: true, embedding: true, metadata: true }
    });

    const results = allDocs.map((doc: any) => {
        const docVector = doc.embedding as number[] | null;
        const score = docVector ? cosineSimilarity(queryVector, docVector) : 0;
        return {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            score,
            metadata: doc.metadata
        };
    });

    // Sort descending by score and pick topK
    results.sort((a: any, b: any) => b.score - a.score);
    return results.slice(0, topK);
}

/**
 * High-level orchestration function to query the RAG pipeline.
 */
export async function queryRAG(tenantId: string, userQuery: string): Promise<string> {
    // 1. Retrieve
    const contextDocs = await searchVectorMine(tenantId, userQuery, 3);
    
    // 2. Augment context
    let contextStr = "Here is the relevant company knowledge:\n\n";
    contextDocs.forEach((doc: any, idx: number) => {
        if (doc.score > 0.6) { // basic threshold
            contextStr += `--- Document ${idx + 1}: ${doc.title} ---\n${doc.content}\n\n`;
        }
    });

    // 3. Optional: Pass this into LangChain orchestrator (omitted here, handled upstream)
    return contextStr;
}
