import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';

const log = logger.child({ service: 'product-stocks.location' });

const _POSTSchema = z.object({
  productStockId: z.union([z.string(), z.number()]).optional(),
  location: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!['admin', 'owner', 'inventory_manager'].includes(auth.role)) {
            return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
        }

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { productStockId, location } = body;

        if (!productStockId) {
            return NextResponse.json({ error: 'Missing productStockId' }, { status: 400 });
        }

        const updated = await runInventoryTx(prisma, async (tx: any) => {
            const existing = await tx.productStock.findFirst({ where: { id: parseInt(productStockId), tenantId: auth.tenantId } });
            if (!existing) throw new Error('Not found or unauthorized');

            return await tx.productStock.update({
                where: { id: parseInt(productStockId) },
                data: { location: location || null }
            });
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        log.error('Location Update Error:', error);
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
