import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { BankFeedEngine } from '@/lib/bank-feed-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const status = req.nextUrl.searchParams.get('status') || undefined;
    try { return NextResponse.json(await BankFeedEngine.getEntries(prisma, user.tenantId || '', status)); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'import_csv') {
            const entries = BankFeedEngine.parseCSV(body.csvContent || '');
            return NextResponse.json(await BankFeedEngine.importStatement(prisma, { bankAccountId: body.bankAccountId || 1, entries, tenantId: user.tenantId || '' }));
        }
        if (body.action === 'auto_match') return NextResponse.json(await BankFeedEngine.autoMatch(prisma, body.entryId));
        return NextResponse.json({ error: 'action required' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
