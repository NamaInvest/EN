import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { apiError } from '@/lib/api-error';

const StockTransferItemSchema = z.object({
    productId: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))),
    productName: z.string().optional().nullable(),
    quantity: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v))),
});

const StockTransferSchema = z.object({
    fromStockId: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).optional().nullable(),
    toStockId: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).optional().nullable(),
    userId: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(StockTransferItemSchema).min(1, 'يجب تحديد صنف واحد على الأقل للتحويل'),
});
export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const transfers = await prisma.stockTransfer.findMany({ include: { details: true }, orderBy: { id: 'desc' } });
        return NextResponse.json(transfers);
    } catch (e) {
        console.error(e);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        const parsed = StockTransferSchema.safeParse(rawBody);
        if (!parsed.success) {
            return apiError({ message: 'بيانات التحويل غير صالحة', errors: parsed.error.format() }, 'الرجاء التأكد من إدخال كافة حقول التحويل بشكل صحيح', { status: 400 });
        }
        const body = parsed.data;
        const last = await prisma.stockTransfer.findFirst({ orderBy: { transferNo: 'desc' } });
        const transferNo = (last?.transferNo || 0) + 1;

        const fromStockId = body.fromStockId ? Number(body.fromStockId) : null;
        const toStockId = body.toStockId ? Number(body.toStockId) : null;
        const items = body.items || [];

        if (fromStockId && toStockId) {
            for (const item of items) {
                const sourceStock = await prisma.productStock.findUnique({
                    where: { productId_stockId: { productId: item.productId, stockId: fromStockId } }
                });
                if (!sourceStock || sourceStock.quantity < item.quantity) {
                    return NextResponse.json({ error: `الكمية ${item.productName} عبر المصدر غير كافية للتحويل.` }, { status: 400 });
                }
            }
        }

        const transfer = await prisma.$transaction(async (tx) => {
            const tr = await tx.stockTransfer.create({
                data: {
                    transferNo,
                    fromStockId,
                    toStockId,
                    userId: body.userId || null,
                    notes: body.notes || null,
                    details: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            productName: item.productName || '',
                            quantity: item.quantity || 0,
                        })),
                    },
                },
                include: { details: true },
            });

            if (fromStockId && toStockId) {
                for (const item of items) {
                    await tx.productStock.update({
                        where: { productId_stockId: { productId: item.productId, stockId: fromStockId } },
                        data: { quantity: { decrement: item.quantity } }
                    });
                    
                    const existingTarget = await tx.productStock.findUnique({
                        where: { productId_stockId: { productId: item.productId, stockId: toStockId } }
                    });

                    if (existingTarget) {
                        await tx.productStock.update({
                            where: { productId_stockId: { productId: item.productId, stockId: toStockId } },
                            data: { quantity: { increment: item.quantity } }
                        });
                    } else {
                        await tx.productStock.create({
                            data: {
                                productId: item.productId, 
                                stockId: toStockId, 
                                quantity: item.quantity
                            }
                        });
                    }
                }
            }
            return tr;
        });

        return NextResponse.json(transfer, { status: 201 });
    } catch (e: any) {
        console.error("Transfer Error:", e);
        return NextResponse.json({ error: e.message || 'فشل' }, { status: 500 });
    }
}
