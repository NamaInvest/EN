import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction } from '@/lib/db/transaction';

const log = logger.child({ service: 'sales.delivery-notes' });

async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const dnotes = await prisma.deliveryNote.findMany({ take: 100,
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
        log.error(e);
        return NextResponse.json({ error: 'Server Error', details: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  salesOrderId: z.union([z.string(), z.number()]).optional(),
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { customerId, salesOrderId, items } = body;

        const agg = await prisma.deliveryNote.aggregate({ _max: { noteNo: true } });
        const nextNo = (agg._max.noteNo || 5000) + 1;

        const note = await prisma.$transaction(async (tx) => {
            const newNote = await tx.deliveryNote.create({
                data: {
                    noteNo: nextNo,
                    customerId: customerId ? parseInt(customerId) : null,
                    salesOrderId: salesOrderId ? parseInt(salesOrderId) : null,
                    userId: decoded.userId,
                    status: 'delivered',
                    details: {
                        create: items.map((i: any) => ({
                            productId: parseInt(i.productId),
                            productName: i.productName,
                            quantity: parseFloat(i.quantity)
                        }))
                    }
                }
            });

            // Outbound Inventory deduction
            for (const item of items) {
                const qty = parseFloat(item.quantity) || 0;
                if (qty > 0) {
                    await tx.product.update({
                        where: { id: parseInt(item.productId) },
                        data: { currentStock: { decrement: qty } }
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: parseInt(item.productId),
                            stockId: 1, // Default main warehouse
                            type: 'out',
                            quantity: qty,
                            referenceType: 'DeliveryNote',
                            referenceId: newNote.id,
                            userId: decoded.userId,
                            notes: 'صرف بضاعة إذن تسليم مبيعات رقم ' + nextNo
                        }
                    });
                }
            }
            return newNote;
        });

        return NextResponse.json(note);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error', details: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
