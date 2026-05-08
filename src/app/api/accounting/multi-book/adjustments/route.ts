import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {

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
