import { NextRequest, NextResponse } from 'next/server';
import { CRMEngine } from '@/lib/crm-engine';

export async function POST(
    req: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
    try {
        const { id } = params;
        const body = await req.json().catch(() => ({}));
        
        const result = await CRMEngine.winOpportunity(parseInt(id, 10), body.createCustomer !== false);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
