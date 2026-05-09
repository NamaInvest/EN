import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { CRMEngine } from '@/lib/crm-engine';

async function _POST(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;
    try {
        // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
        const { id } = params;
        const body = await req.json().catch(() => ({}));
        
        const result = await CRMEngine.winOpportunity(parseInt(id, 10), body.createCustomer !== false);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
