import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const transfers = await prisma.stockTransfer.findMany({ include: { details: true }, orderBy: { id: 'desc' } });
        return NextResponse.json(transfers);
    } catch (e) {
        console.error(e);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const last = await prisma.stockTransfer.findFirst({ orderBy: { transferNo: 'desc' } });
        const transferNo = (last?.transferNo || 0) + 1;

        const fromStockId = body.fromStockId ? parseInt(body.fromStockId) : null;
        const toStockId = body.toStockId ? parseInt(body.toStockId) : null;
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
