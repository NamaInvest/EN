import { NextRequest, NextResponse } from 'next/server';
import { CRMEngine } from '@/lib/crm-engine';

export async function POST(
    req: NextRequest, 
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await req.json().catch(() => ({}));
        
        const result = await CRMEngine.convertLeadToOpportunity(parseInt(id, 10), body);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
