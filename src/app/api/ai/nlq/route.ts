import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { NLQEngine } from '@/lib/nlq-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (!body.question) return NextResponse.json({ error: 'مطلوب: question' }, { status: 400 });
        const result = await NLQEngine.query(prisma, body.question);
        return NextResponse.json(result);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
