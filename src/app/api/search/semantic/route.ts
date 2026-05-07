import { NextResponse } from 'next/server';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { searchDocuments } from '@/lib/document-embeddings';

/**
 * AI-17 — Semantic Search API
 * Searches across all indexed documents using vector similarity.
 */
export async function GET(request: Request) {
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const topK = parseInt(searchParams.get('k') || '10', 10);

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ error: 'Query too short' }, { status: 400 });
        }

        const results = await searchDocuments(query, tenantId, topK);

        return NextResponse.json({
            query,
            count: results.length,
            results: results.map(r => ({
                ...r,
                snippet: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
            })),
        });
    } catch (e: any) {
        console.error('Semantic search error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
