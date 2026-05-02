import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { WPSGenerator } from '@/lib/wps-generator';

export async function POST(
    request: Request,
    { params }: { params: { batchId: string } }
) {
    try {
        const batchId = parseInt(params.batchId);
        
        await WPSGenerator.submitToBank(batchId);

        return NextResponse.json({
            message: 'Batch marked as uploaded successfully',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
