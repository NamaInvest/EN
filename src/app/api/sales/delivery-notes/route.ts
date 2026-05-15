import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { assertTenant } from '@/lib/security/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';
import { InventoryService } from '@/lib/services/inventory.service';

const log = logger.child({ service: 'sales.delivery-notes' });

async function _GET(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const dnotes = await prisma.deliveryNote.findMany({ take: 100,
            where: { tenantId },
            include: {
                customer: { select: { name: true } },
                salesOrder: { select: { orderNo: true } },
                details: {
                    include: { product: { select: { name: true, unit: true } } }
                }
            },
            orderBy: { id: 'desc' }
        });

        return NextResponse.json(dnotes);
    } catch (e: any) {
        EnterpriseLogger.error("GET delivery notes error", { tenantId, userId: auth?.userId }, e);
        return NextResponse.json({ error: 'Server Error', details: e.message }, { status: 500 });
    }
}

const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  salesOrderId: z.union([z.string(), z.number()]).optional(),
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: NextRequest, auth: any) {
    const prisma = getPrisma(req as any);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { customerId, salesOrderId, items, stockId } = body;
        const targetStockId = stockId ? parseInt(stockId) : 1;

        const agg = await prisma.deliveryNote.aggregate({ 
            where: { tenantId },
            _max: { noteNo: true } 
        });
        const nextNo = (agg._max.noteNo || 5000) + 1;

        const note = await runInventoryTx(prisma, async (tx: any) => {
            const newNote = await tx.deliveryNote.create({
                data: {
                    tenantId,
                    noteNo: nextNo,
                    customerId: customerId ? parseInt(customerId) : null,
                    salesOrderId: salesOrderId ? parseInt(salesOrderId) : null,
                    userId: auth?.userId,
                    status: 'delivered',
                    details: {
                        create: items.map((i: any) => ({
                            tenantId,
                            productId: parseInt(i.productId),
                            productName: i.productName,
                            quantity: parseFloat(i.quantity)
                        }))
                    }
                }
            });

            for (const item of items) {
                const qty = parseFloat(item.quantity) || 0;
                if (qty > 0) {
                    const parsedProductId = parseInt(item.productId);
                    
                    await tx.product.update({
                        where: { id: parsedProductId, tenantId },
                        data: { currentStock: { decrement: qty } }
                    });

                    await InventoryService.adjustStock(tx, {
                        tenantId,
                        productId: parsedProductId,
                        stockId: targetStockId,
                        quantityChange: -qty,
                        reason: 'صرف بضاعة إذن تسليم مبيعات رقم ' + nextNo,
                        sourceType: 'DELIVERY_NOTE',
                        reference: `DN-${newNote.id}`
                    });

                    await InventoryService.recordMovement(tx, {
                        tenantId,
                        productId: parsedProductId,
                        stockId: targetStockId,
                        quantity: -qty,
                        type: 'OUT',
                        referenceType: 'DeliveryNote',
                        referenceId: newNote.id,
                        notes: 'صرف بضاعة إذن تسليم مبيعات رقم ' + nextNo
                    });
                }
            }

            const { logAuditEvent } = await import('@/lib/audit-trail');
            await logAuditEvent(tx as any, {
                tenantId,
                userId: auth?.userId || null,
                action: 'CREATE',
                entityType: 'DeliveryNote',
                entityId: newNote.id,
                route: '/api/sales/delivery-notes',
                newData: { noteNo: newNote.noteNo, customerId: newNote.customerId },
                ipAddress: req.headers.get('x-forwarded-for') || null,
            });

            EnterpriseLogger.traceInventoryTx(
                `DELIVERY_NOTE_${newNote.id}`,
                'DELIVERY_NOTE_POSTED',
                tenantId,
                { noteId: newNote.id, noteNo: newNote.noteNo }
            );

            return newNote;
        }, `DELIVERY_NOTE_POST`);

        return NextResponse.json(note);
    } catch (e: any) {
        EnterpriseLogger.error("POST delivery note error", { tenantId, userId: auth?.userId }, e);
        return NextResponse.json({ error: 'Server Error', details: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req, auth }) => _GET(req as any, auth), { rateLimit: 'DEFAULT', roles: ['admin', 'owner', 'sales'] });

export const POST = withRoute(async ({ req, auth }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = auth?.tenantId || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });
    const isUnique = await lockIdempotencyKey(tenantString, 'delivery_note_post', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });
    try {
        const response = await _POST(req as any, auth);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'delivery_note_post', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'delivery_note_post', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'delivery_note_post', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'FINANCIAL', roles: ['admin', 'owner', 'sales'] });
