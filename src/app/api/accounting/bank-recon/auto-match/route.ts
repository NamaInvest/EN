import { NextRequest, NextResponse } from 'next/server';
import { BankReconEngine } from '@/lib/bank-recon-engine';

export async function POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { statementId, userId } = body;

        if (!statementId) {
            return NextResponse.json({ error: 'Missing statementId' }, { status: 400 });
        }

        const result = await BankReconEngine.autoMatch(statementId, userId || 1);

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
