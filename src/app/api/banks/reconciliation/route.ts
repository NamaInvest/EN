import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { BankReconciliationEngine } from '@/lib/bank-reconciliation-ui-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'parse') {
            const lines = BankReconciliationEngine.parseCSV(body.csv);
            return NextResponse.json({ lines, count: lines.length });
        }
        if (body.action === 'match') {
            const results = await BankReconciliationEngine.autoMatch(prisma, body.bankAccountId, body.lines);
            return NextResponse.json({ results });
        }
        if (body.action === 'summary') {
            const summary = await BankReconciliationEngine.getSummary(prisma, body.bankAccountId);
            return NextResponse.json(summary);
        }
        return NextResponse.json({ error: 'action: parse | match | summary' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
