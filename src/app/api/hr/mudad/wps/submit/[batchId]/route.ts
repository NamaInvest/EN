import { NextRequest, NextResponse } from 'next/server';
import { MudadEngine } from '@/lib/saudi-gov/mudad';

export async function POST(
    req: NextRequest, 
    { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
    try {
        const { batchId } = params;
        const result = await MudadEngine.submitWPSBatch(batchId);
        
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
