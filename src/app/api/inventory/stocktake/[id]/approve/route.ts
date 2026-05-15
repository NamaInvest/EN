import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { InventoryAdjustmentService } from '@/lib/services/inventory-adjustment.service';

const log = logger.child({ service: 'inventory.stocktake.id.approve' });

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
        
        // Fetch stocktake and its items
        const stocktake = await prisma.stocktake.findUnique({
            where: { id },
            include: { items: { include: { product: true } } } as any
        });

        if (!stocktake) return NextResponse.json({ error: 'Stocktake not found' }, { status: 404 });
        if (stocktake.status === 'approved') return NextResponse.json({ error: 'Already approved' }, { status: 400 });

        const tenantId = req.headers.get('x-tenant') || 'default';
        const ipAddress = req.headers.get('x-forwarded-for') || null;

        // Use the strongly typed wrapper
        await runInventoryTx(prisma, async (tx) => {
            await InventoryAdjustmentService.approveStocktake(tx, stocktake, tenantId, ipAddress);
        }, `approve-stocktake-${id}`);

        return NextResponse.json({ success: true, message: 'Stocktake approved and stock updated' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: e.message === 'Already approved' ? 400 : 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
