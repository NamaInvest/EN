import { NextRequest, NextResponse } from 'next/server';
import { BankStatementEngine } from '@/lib/bank-statement-engine';

export async function POST(req: NextRequest) {

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const bankAccountId = formData.get('bankAccountId') as string;
        const formatHint = formData.get('formatHint') as string;
        const userId = formData.get('userId') as string;

        if (!file || !bankAccountId) {
            return NextResponse.json({ error: 'Missing file or bankAccountId' }, { status: 400 });
        }

        const fileContent = await file.text();
        
        const result = await BankStatementEngine.processUpload(
            parseInt(bankAccountId, 10),
            file.name,
            fileContent,
            formatHint,
            userId || 'SYSTEM'
        );

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
