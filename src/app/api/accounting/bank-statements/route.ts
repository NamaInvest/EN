import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.bank-statements' });

async function _GET(req: NextRequest) {

    try {
        const statements = await prisma.bankStatement.findMany({
            orderBy: { importedAt: 'desc' },
            include: { bankAccount: true },
            take: 50
        });

        return NextResponse.json(statements);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
