import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { addDocumentToVectorMine } from '@/lib/vector-store';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

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

async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await request.json();
        
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
