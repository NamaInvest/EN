// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';

async function _GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userIdStr = searchParams.get('userId');
        const limitStr = searchParams.get('limit') || '50';
        
        if (!userIdStr) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const userId = parseInt(userIdStr);
        const limit = parseInt(limitStr);

        const attempts = await prisma.mfaAttempt.findMany({
            where: { userId },
            orderBy: { attemptedAt: 'desc' },
            take: limit
        });

        return NextResponse.json(attempts);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AUTH' });
