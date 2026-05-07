import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { GlobalSearchEngine } from '@/lib/global-search-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    const query = req.nextUrl.searchParams.get('q') || '';
    const lang = req.nextUrl.searchParams.get('lang') || 'ar';
    try {
        const results = await GlobalSearchEngine.search(prisma, query, lang);
        return NextResponse.json({ results });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
