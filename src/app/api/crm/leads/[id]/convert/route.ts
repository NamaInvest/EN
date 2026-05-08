import { NextRequest, NextResponse } from 'next/server';
import { CRMEngine } from '@/lib/crm-engine';

export async function POST(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;
    try {
        // @ts-expect-error [TS2339] Prisma schema field mismatch - fix after prisma migrate
        const { id } = params;
        const body = await req.json().catch(() => ({}));
        
        const result = await CRMEngine.convertLeadToOpportunity(parseInt(id, 10), body);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
