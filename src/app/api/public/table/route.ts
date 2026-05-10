import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'public.table' });

// Public API - get table info by ID (no auth needed)
async function _GET(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        const { searchParams } = new URL(req.url);
        const tableId = searchParams.get('tableId');

        if (!tableId) {
            return NextResponse.json({ success: false, error: 'tableId required' });
        }

        // Try to find the table
        try {
            const table = await (prisma as any).table.findUnique({
                where: { id: parseInt(tableId) },
                include: { zone: true }
            });
            if (table) {
                return NextResponse.json({
                    success: true,
                    table: {
                        id: table.id,
                        name: table.name,
                        capacity: table.capacity,
                        zoneName: table.zone?.name || ''
                    }
                });
            }
        } catch (e: any) {
            log.error('src/app/api/public/table/route.ts', { error: e instanceof Error ? e.message : e });

            // Table model might not exist
        }

        return NextResponse.json({ success: true, table: { id: tableId, name: `T${tableId}`, capacity: 4, zoneName: '' } });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
