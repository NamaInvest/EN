import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.customer-statements.bulk.hist' });

async function _GET(req: NextRequest) {

    try {
        const batches = await prisma.statementBatch.findMany({
            orderBy: { startedAt: 'desc' },
            take: 20,
            include: {
                dispatchLogs: {
                    select: {
                        id: true,
                        status: true,
                        customerId: true
                    },
                    take: 5 // Just preview the first 5 logs for summary
                }
            }
        });

        return NextResponse.json({ success: true, batches });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
