import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { postStockTransfer } from '@/lib/auto-journal';
import { n } from '@/lib/decimal-utils';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runInventoryTx } from '@/lib/db/transaction';
import { assertPeriodWritable, PeriodLockViolation } from '@/lib/governance/period-lock';

const log = logger.child({ service: 'smart-transfers' });

async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Retrieve specifically 'transit_out' movements meaning items sent out but maybe not received
        const transits = await prisma.stockMovement.findMany({ 
            take: 100,
            where: { type: 'transit_out' },
            include: { 
                product: { select: { name: true } }, 
                stock: { select: { name: true, branch: { select: { name: true } } } },
                user: { select: { fullName: true } }
            },
            orderBy: { id: 'desc' }
        });

        const activeTransits = [];
        const completedTransits = [];

        // Parsing notes safely
        for (const tr of transits) {
            let meta = { status: 'unknown', receiverStockId: 0, transferRef: '' };
            try { 
                if (tr.notes) meta = JSON.parse(tr.notes); 
            } catch {
                // ignore json parse error
            }
            
            // To get receiver name without N+1 problem, ideally fetch all stocks once, but let's query gracefully
            const receiverStock = await prisma.stock.findUnique({ 
                where: { id: meta.receiverStockId || 0 }, 
                select: { name: true, branch: { select: { name: true } } } 
            });

            const formatted = {
                id: tr.id,
                reference: meta.transferRef || `TRX-${tr.id}`,
                productName: tr.product?.name || 'Unknown',
                quantity: Math.abs(n(tr.quantity)),
                senderStock: tr.stock?.branch?.name ? `${tr.stock.branch.name} - ${tr.stock.name}` : (tr.stock?.name || 'Unknown'),
                receiverStock: receiverStock?.branch?.name ? `${receiverStock.branch.name} - ${receiverStock.name}` : (receiverStock?.name || 'Unknown'),
                receiverStockId: meta.receiverStockId,
                status: meta.status,
                date: tr.date,
                senderName: tr.user?.fullName || 'System'
            };

            if (meta.status === 'pending') {
                activeTransits.push(formatted);
            } else {
                completedTransits.push(formatted);
            }
        }

        return NextResponse.json({ activeTransits, completedTransits });

    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

const _POSTSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  senderStockId: z.union([z.string(), z.number()]).optional(),
  receiverStockId: z.union([z.string(), z.number()]).optional(),
  quantity: z.number().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed2.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed2.error.flatten().fieldErrors }, { status: 400 });
        }
        const { productId, senderStockId, receiverStockId, quantity } = body;

        if (!productId || !senderStockId || !receiverStockId || quantity <= 0) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const tenantId = (await import('@/lib/governance/tenant-guard')).requireTenantId(req as any);

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const overrideContext = buildOverrideContextFromRequest(req as any, {
            tenantId,
            actorId: String(user?.userId || '0'),
            actorRole: user?.role || 'USER'
        });

        // ── Period Lock Enforcement ────────────────────────────────────────
        try {
            await assertPeriodWritable({
                tenantId,
                postingDate: new Date(),
                operationType: 'DISPATCH_SMART_TRANSFER',
                module: 'inventory',
                actor: String(user?.userId || 'SYSTEM'),
                overrideContext
            });
        } catch (err) {
            if (err instanceof PeriodLockViolation) {
                return NextResponse.json({
                    error: err.message,
                    code: err.code
                }, { status: err.code === 'LOCKED' ? 409 : 422 });
            }
            throw err;
        }
        // ────────────────────────────────────────────────────────────────────

        // Validate sender stock availability
        const currentStock = await prisma.productStock.findFirst({
            where: { productId: Number(productId), stockId: Number(senderStockId) }
        });

        if (!currentStock || n(currentStock.quantity) < quantity) {
            return NextResponse.json({ error: 'الكمية غير متوفرة في المستودع المرسل' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 400 });

        const transferRef = `TRX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Phase 1: Dispatch (Transit Out) using Prisma Transaction
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const dispatchAction = await runInventoryTx(prisma, async (tx: any) => {
            const updateAction = await tx.productStock.update({
                where: { id: currentStock.id },
                data: { quantity: { decrement: Number(quantity) } }
            });
            const createAction = await tx.stockMovement.create({
                data: {
                    productId: Number(productId),
                    stockId: Number(senderStockId), // Origin
                    type: 'transit_out',
                    quantity: -Math.abs(Number(quantity)),
                    date: new Date(),
                    userId: ((user as any).userId || (user as any).id || 1) as number,
                    notes: JSON.stringify({
                        status: 'pending',
                        receiverStockId: Number(receiverStockId),
                        transferRef: transferRef
                    })
                }
            });
            return [updateAction, createAction];
        });

        const movementId = dispatchAction[1].id;
        try {
            await postStockTransfer({
                movementId: movementId,
                reference: transferRef,
                type: 'transit_out',
                totalCost: (n(product.buyPrice) || 0) * Number(quantity),
                productName: product.name,
                userId: ((user as any).userId || (user as any).id || 1) as number,
            });
        } catch (je: unknown) {
            log.error('Auto Journal Transit Out Error', je);
        }

        return NextResponse.json({ success: true, message: 'تم إرسال الإرسالية بنجاح، البضاعة الآن في الطريق.', dispatchCheck: movementId });

    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

const _PUTSchema = z.object({
  movementId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const { movementId } = body;
        if (!movementId) return NextResponse.json({ error: 'No ID provided' }, { status: 400 });

        const tenantId = (await import('@/lib/governance/tenant-guard')).requireTenantId(req as any);

        const { buildOverrideContextFromRequest } = await import('@/lib/governance/override-context');
        const overrideContext = buildOverrideContextFromRequest(req as any, {
            tenantId,
            actorId: String(user?.userId || '0'),
            actorRole: user?.role || 'USER'
        });

        // ── Period Lock Enforcement ────────────────────────────────────────
        try {
            await assertPeriodWritable({
                tenantId,
                postingDate: new Date(),
                operationType: 'RECEIVE_SMART_TRANSFER',
                module: 'inventory',
                actor: String(user?.userId || 'SYSTEM'),
                overrideContext
            });
        } catch (err) {
            if (err instanceof PeriodLockViolation) {
                return NextResponse.json({
                    error: err.message,
                    code: err.code
                }, { status: err.code === 'LOCKED' ? 409 : 422 });
            }
            throw err;
        }
        // ────────────────────────────────────────────────────────────────────

        const tr = await prisma.stockMovement.findUnique({ 
            where: { id: parseInt(movementId) },
            include: { product: true } 
        });
        if (!tr || tr.type !== 'transit_out') return NextResponse.json({ error: 'Invalid Movement' }, { status: 400 });

        const meta = JSON.parse(tr.notes || '{}');
        if (meta.status === 'completed') {
            return NextResponse.json({ error: 'تم الاستلام مسبقاً' }, { status: 400 });
        }

        meta.status = 'completed';
        const receivingStockId = Number(meta.receiverStockId);
        const qty = Math.abs(n(tr.quantity));

        // Receive the goods natively via Prisma Transaction
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        await runInventoryTx(prisma, async (tx: any) => {
            // 1. Mark sender transit complete
            await tx.stockMovement.update({
                where: { id: tr.id },
                data: { notes: JSON.stringify(meta) }
            });

            // 2. Add to receiver ProductStock
            const receiverPS = await tx.productStock.findFirst({
                where: { productId: tr.productId, stockId: receivingStockId }
            });

            if (receiverPS) {
                await tx.productStock.update({
                    where: { id: receiverPS.id },
                    data: { quantity: { increment: qty } }
                });
            } else {
                await tx.productStock.create({
                    data: { productId: tr.productId, stockId: receivingStockId, quantity: qty }
                });
            }

            // 3. Log the transit_in
            await tx.stockMovement.create({
                data: {
                    productId: tr.productId,
                    stockId: receivingStockId,
                    type: 'transit_in',
                    quantity: qty,
                    referenceId: tr.id,
                    date: new Date(),
                    userId: ((user as any).userId || (user as any).id || 1) as number,
                    notes: `استلام الشحنة #${meta.transferRef || 'N/A'}`
                }
            });
        });

        try {
            await postStockTransfer({
                movementId: tr.id,
                reference: meta.transferRef,
                type: 'transit_in',
                totalCost: (n(tr.product?.buyPrice) || 0) * qty,
                productName: tr.product?.name || 'Unknown',
                userId: ((user as any).userId || (user as any).id || 1) as number,
            });
        } catch (je: unknown) {
            log.error('Auto Journal Transit In Error', je);
        }

        return NextResponse.json({ success: true, message: 'تم ادخال البضاعة بنجاح إلى المستودع الهدف!' });

    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });

    const isUnique = await lockIdempotencyKey(tenantString, 'smart_transfer_post', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });

    try {
        const response = await _POST(req);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'smart_transfer_post', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'smart_transfer_post', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'smart_transfer_post', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => {
    const { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } = await import('@/lib/idempotency');
    const tenantString = req.headers.get('x-tenant') || 'default';
    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) return NextResponse.json({ error: "Missing x-idempotency-key header." }, { status: 400 });

    const isUnique = await lockIdempotencyKey(tenantString, 'smart_transfer_put', idempotencyKey);
    if (!isUnique) return NextResponse.json({ error: "Duplicate request detected or currently processing" }, { status: 409 });

    try {
        const response = await _PUT(req);
        if (response.status >= 200 && response.status < 400) await completeIdempotencyKey(tenantString, 'smart_transfer_put', idempotencyKey);
        else await unlockIdempotencyKey(tenantString, 'smart_transfer_put', idempotencyKey);
        return response;
    } catch (e) {
        await unlockIdempotencyKey(tenantString, 'smart_transfer_put', idempotencyKey);
        throw e;
    }
}, { rateLimit: 'DEFAULT' });
