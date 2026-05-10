import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { postStockTransfer } from '@/lib/auto-journal';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'smart-transfers' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req as any);
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
            try { if (tr.notes) meta = JSON.parse(tr.notes); } catch (e: any) {}
            
            // To get receiver name without N+1 problem, ideally fetch all stocks once, but let's query gracefully
            const receiverStock = await prisma.stock.findUnique({ where: { id: meta.receiverStockId || 0 }, select: { name: true, branch: { select: { name: true } } } });

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

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
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
        const user = getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        const { productId, senderStockId, receiverStockId, quantity } = body;

        if (!productId || !senderStockId || !receiverStockId || quantity <= 0) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

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
        const dispatchAction = await prisma.$transaction([
            // Deduct from sender natively
            prisma.productStock.update({
                where: { id: currentStock.id },
                data: { quantity: { decrement: Number(quantity) } }
            }),
            // Create the transit log
            prisma.stockMovement.create({
                data: {
                    productId: Number(productId),
                    stockId: Number(senderStockId), // Origin
                    type: 'transit_out',
                    quantity: -Math.abs(Number(quantity)),
                    date: new Date(),
                    userId: (user as any).id || 1,
                    notes: JSON.stringify({
                        status: 'pending',
                        receiverStockId: Number(receiverStockId),
                        transferRef: transferRef
                    })
                }
            })
        ]);

        const movementId = dispatchAction[1].id;
        try {
            await postStockTransfer({
                movementId: movementId,
                reference: transferRef,
                type: 'transit_out',
                totalCost: (n(product.buyPrice) || 0) * Number(quantity),
                productName: product.name,
                userId: (user as any).id || 1,
            });
        } catch (je: unknown) {
            log.error('Auto Journal Transit Out Error', je);
        }

        return NextResponse.json({ success: true, message: 'تم إرسال الإرسالية بنجاح، البضاعة الآن في الطريق.', dispatchCheck: movementId });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  movementId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _PUT(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { movementId } = body;

        if (!movementId) return NextResponse.json({ error: 'No ID provided' }, { status: 400 });

        const tr = await prisma.stockMovement.findUnique({ 
            where: { id: parseInt(movementId) },
            include: { product: true } 
        });
        if (!tr || tr.type !== 'transit_out') return NextResponse.json({ error: 'Invalid Movement' }, { status: 400 });

        let meta = JSON.parse(tr.notes || '{}');
        if (meta.status === 'completed') {
            return NextResponse.json({ error: 'تم الاستلام مسبقاً' }, { status: 400 });
        }

        meta.status = 'completed';
        const receivingStockId = Number(meta.receiverStockId);
        const qty = Math.abs(n(tr.quantity));

        // Receive the goods natively via Prisma Transaction
        await prisma.$transaction(async (tx) => {
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
                    userId: (user as any).id || 1,
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
                userId: (user as any).id || 1,
            });
        } catch (je: unknown) {
            log.error('Auto Journal Transit In Error', je);
        }

        return NextResponse.json({ success: true, message: 'تم ادخال البضاعة بنجاح إلى المستودع الهدف!' });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
