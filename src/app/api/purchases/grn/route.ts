import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const grns = await prisma.goodsReceiptNote.findMany({
            include: {
                supplier: { select: { name: true } },
                order: { select: { orderNo: true } },
                receiver: { select: { fullName: true } },
                stock: { select: { name: true } },
                details: {
                    include: { product: { select: { name: true, unit: true } } }
                }
            },
            orderBy: { id: 'desc' }
        });

        return NextResponse.json(grns);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();
        const { supplierId, orderId, stockId, notes, items } = body;

        const agg = await prisma.goodsReceiptNote.aggregate({ _max: { grnNo: true } });
        const nextNo = (agg._max.grnNo || 3000) + 1;

        const grn = await prisma.$transaction(async (tx) => {
            const newGrn = await tx.goodsReceiptNote.create({
                data: {
                    grnNo: nextNo,
                    supplierId: supplierId ? parseInt(supplierId) : null,
                    orderId: orderId ? parseInt(orderId) : null,
                    stockId: stockId ? parseInt(stockId) : 1,
                    notes: notes,
                    receivedBy: decoded.userId,
                    status: 'received',
                    details: {
                        create: items.map((i: any) => ({
                            productId: parseInt(i.productId),
                            productName: i.productName,
                            quantity: parseFloat(i.quantity),
                            acceptedQty: parseFloat(i.acceptedQty) || parseFloat(i.quantity),
                            rejectedQty: parseFloat(i.rejectedQty) || 0
                        }))
                    }
                }
            });

            for (const item of items) {
                const accepted = parseFloat(item.acceptedQty) || parseFloat(item.quantity);
                if (accepted > 0) {
                    await tx.product.update({
                        where: { id: parseInt(item.productId) },
                        data: { currentStock: { increment: accepted } }
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: parseInt(item.productId),
                            stockId: stockId ? parseInt(stockId) : 1,
                            type: 'in',
                            quantity: accepted,
                            referenceType: 'GRN',
                            referenceId: newGrn.id,
                            userId: decoded.userId,
                            notes: 'استلام بضاعة سند إدخال رقم ' + nextNo
                        }
                    });
                }
            }
            return newGrn;
        });

        return NextResponse.json(grn);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
