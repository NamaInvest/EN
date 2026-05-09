import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { BankFeedEngine } from '@/lib/bank-feed-engine';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const status = req.nextUrl.searchParams.get('status') || undefined;
    try { return NextResponse.json(await BankFeedEngine.getEntries(prisma, user.tenantId || '', status)); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
