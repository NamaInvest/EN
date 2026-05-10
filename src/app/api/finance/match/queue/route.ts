import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.match.queue' });

const prisma = new PrismaClient();

async function _GET(req: NextRequest) {

    try {
        const queue = await prisma.invoiceMatchResult.findMany({ take: 100,
            where: {
                status: {
                    in: ['HOLD_PRICE', 'HOLD_QTY', 'HOLD_TOTAL', 'MANUAL_REVIEW']
                }
            },
            // @ts-expect-error [TS2322] Type assignment mismatch - pending strict types
            include: {
                // we would normally include invoice details here, simplified for now
            }
        });
        return NextResponse.json(queue);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
