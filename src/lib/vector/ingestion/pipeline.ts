import { getPrisma } from '@/lib/prisma';
import { BusinessContext } from '../../context/business-context';
import { RecursiveCharacterSplitter } from '../chunking/recursive-splitter';

export interface KnowledgeSource {
  type: string;
  extract(): Promise<any[]>;
}

export interface IngestResult {
  documentsProcessed: number;
  chunksCreated: number;
  tokensEmbedded: number;
  cost: number;
}

export class IngestionPipeline {
  async ingest(source: KnowledgeSource, ctx: BusinessContext): Promise<IngestResult> {
    const prisma = getPrisma();
    console.log(`[IngestionPipeline] Starting ingestion for source ${source.type}, tenant ${ctx.tenant.id}`);

    // 1. Extract
    const rawDocs = await source.extract();

    // 2. Normalize stub
    const normalized = rawDocs.map(doc => ({ id: doc.id || '1', title: doc.title || 'Doc', content: doc.content || '', metadata: {} }));

    // 3. Chunk
    const splitter = new RecursiveCharacterSplitter();
    const chunks = normalized.flatMap(doc =>
      splitter.split(doc.content).map(chunk => ({
        ...chunk,
        sourceDocId: doc.id,
        sourceTitle: doc.title,
        sourceType: source.type,
        metadata: doc.metadata,
      }))
    );

    // 4. Embed Stub
    console.log(`[IngestionPipeline] Mock embedding ${chunks.length} chunks`);
    const embedded = chunks.map(() => [0.1, 0.2, 0.3]); // Dummy vector

    // 5. Store Stub (can't upsert vector easily without proper prisma extensions, so just mock)
    console.log(`[IngestionPipeline] Mock storing ${chunks.length} chunks into knowledgeDocument table`);

    return {
      documentsProcessed: rawDocs.length,
      chunksCreated: chunks.length,
      tokensEmbedded: chunks.reduce((acc, c) => acc + c.length, 0),
      cost: 0.01,
    };
  }
}
