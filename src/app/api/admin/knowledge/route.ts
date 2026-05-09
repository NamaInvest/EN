import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { addDocumentToVectorMine } from '@/lib/vector-store';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);

        // Don't return embeddings, just metadata
        const docs = await prisma.knowledgeDocument.findMany({
            take: 100,
            where: { tenantId: tenantId },
            select: { id: true, title: true, createdAt: true, metadata: true },
            orderBy: { createdAt: 'desc' }
        });
        
        return NextResponse.json(docs);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  title: z.any().optional(),
  content: z.any().optional(),
  category: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const tenantId = resolveTenant(request as any);
        // Use the VectorMine function to embed and store
        const docId = await addDocumentToVectorMine(
            tenantId,
            data.title,
            data.content,
            { category: data.category || 'General', author: auth.userId }
        );

        return NextResponse.json({ success: true, docId });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'ADMIN' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'ADMIN' });
