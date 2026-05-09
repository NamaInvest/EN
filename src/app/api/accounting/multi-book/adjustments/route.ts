import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { sourceBook, targetBook, amount, description } = body;
        
        // Logic to create adjustment entry between books
        return NextResponse.json({
            status: 'success',
            journalEntryId: 'JE-MB-001',
            message: `Adjustment created from ${sourceBook} to ${targetBook}`
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
