/**
 * POST /api/ai/ingest — Ingest documents into RAG (pgvector)
 * ─────────────────────────────────────────────────────────────────────────────
 * Accepts plain text documents, chunks them, embeds via Gemini,
 * and upserts into the pgvector knowledge_documents table.
 * ADMIN role required.
 *
 * ragPipeline.ingest(id, content, metadata, tenantId)
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { ragPipeline } from '@/lib/rag-pipeline';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai.ingest' });

const IngestSchema = z.object({
  id:       z.string().min(1).max(255).optional(),
  content:  z.string().min(10).max(500_000),
  title:    z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const BulkIngestSchema = z.object({
  documents: z.array(IngestSchema).min(1).max(50),
});

async function handler(ctx: any) {
  // Only ADMIN can ingest documents
  if (!['admin', 'superadmin', 'ADMIN'].includes(ctx.auth.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Admin role required to ingest documents' }, { status: 403 });
  }

  const body      = await ctx.req.json().catch(() => ({}));
  const tenantId  = (ctx.auth.tenantId as string) ?? 'default';

  // ── Bulk mode ────────────────────────────────────────────────────────────────
  if ('documents' in body) {
    const parsed = BulkIngestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const results = await Promise.allSettled(
      parsed.data.documents.map(doc => {
        const docId = doc.id ?? `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        return ragPipeline.ingest(
          docId,
          doc.content,
          { title: doc.title, ...doc.metadata },
          tenantId,
        );
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed    = results.filter(r => r.status === 'rejected').length;
    return NextResponse.json({ ingested: succeeded, failed, total: results.length });
  }

  // ── Single document ──────────────────────────────────────────────────────────
  const parsed = IngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const docId  = parsed.data.id ?? `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const result = await ragPipeline.ingest(
    docId,
    parsed.data.content,
    { title: parsed.data.title, ...parsed.data.metadata },
    tenantId,
  );

  return NextResponse.json({
    id:         docId,
    status:     'ingested',
    chunkCount: result.chunkCount,
    embedded:   result.embedded,
  });
}

export const POST = withRoute(handler, { rateLimit: 'DEFAULT' });
