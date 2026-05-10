/**
 * AI-16 — Document Embedding Pipeline
 * Auto-indexes invoices, POs, contracts into vector store for semantic search.
 */
import { addDocumentToVectorMine, searchVectorMine } from './vector-store';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'document-embeddings' });

interface DocumentSource {
    type: 'INVOICE' | 'PO' | 'CONTRACT' | 'PRODUCT' | 'POLICY';
    id: string;
    tenantId: string;
    title: string;
    content: string;
    metadata?: Record<string, any>;
}

/**
 * Ingest a document into the knowledge base with embeddings.
 */
export async function ingestDocument(doc: DocumentSource): Promise<string> {
    const chunks = chunkDocument(doc.content, 500, 50);
    const docId = `${doc.type}:${doc.id}`;

    for (let i = 0; i < chunks.length; i++) {
        await addDocumentToVectorMine(
            doc.tenantId,
            `${doc.title} [chunk ${i+1}/${chunks.length}]`,
            chunks[i],
            {
                ...doc.metadata,
                sourceType: doc.type,
                sourceId: doc.id,
                chunkIndex: i,
                totalChunks: chunks.length,
            }
        );
    }

    return docId;
}

/**
 * Search documents semantically.
 */
export async function searchDocuments(
    query: string,
    tenantId: string,
    topK: number = 5
): Promise<{ content: string; title: string; score: number; sourceType: string }[]> {
    const results = await searchVectorMine(tenantId, query, topK);
    return results.map((r: any) => ({
        content: r.content,
        title: r.title || '',
        score: r.score || 0,
        sourceType: r.metadata?.sourceType || '',
    }));
}

/**
 * Chunk text with overlap for better retrieval.
 */
function chunkDocument(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let i = 0;

    while (i < words.length) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        chunks.push(chunk);
        i += chunkSize - overlap;
    }

    return chunks;
}

/**
 * Batch ingest multiple documents (for cron jobs).
 */
export async function batchIngest(documents: DocumentSource[]): Promise<{ 
    processed: number; 
    failed: number; 
    errors: string[] 
}> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const doc of documents) {
        try {
            await ingestDocument(doc);
            processed++;
        } catch (err: any) {
            failed++;
            errors.push(`${doc.type}:${doc.id} — ${err.message}`);
        }
    }

    return { processed, failed, errors };
}
