import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const transfers = await prisma.stockTransfer.findMany({ include: { details: true }, orderBy: { id: 'desc' } });
        return NextResponse.json(transfers);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const last = await prisma.stockTransfer.findFirst({ orderBy: { transferNo: 'desc' } });
        const transferNo = (last?.transferNo || 0) + 1;

        const transfer = await prisma.stockTransfer.create({
            data: {
                transferNo,
                fromStockId: body.fromStockId ? parseInt(body.fromStockId) : null,
                toStockId: body.toStockId ? parseInt(body.toStockId) : null,
                userId: body.userId || null,
                notes: body.notes || null,
                details: {
                    create: (body.items || []).map((item: { productId: number; productName: string; quantity: number }) => ({
                        productId: item.productId,
                        productName: item.productName || '',
                        quantity: item.quantity || 0,
                    })),
                },
            },
            include: { details: true },
        });
        return NextResponse.json(transfer, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
