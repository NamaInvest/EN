import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';

async function _GET(req: Request) {

    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const action = searchParams.get('action');
        const tableName = searchParams.get('tableName');

        let where: any = {};
        if (action) where.action = action;
        if (tableName) where.tableName = tableName;

        const logs = await prisma.auditLog.findMany({
            where,
            include: { user: { select: { fullName: true, username: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
