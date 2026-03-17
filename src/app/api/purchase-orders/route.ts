import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const orders = await prisma.purchaseOrder.findMany({ include: { items: true }, orderBy: { id: 'desc' } });
        return NextResponse.json(orders);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const last = await prisma.purchaseOrder.findFirst({ orderBy: { id: 'desc' } });
        const orderNumber = `PO${((last?.id || 0) + 1).toString().padStart(6, '0')}`;

        let total = 0;
        const items = (body.items || []).map((item: { productId: number; quantity: number; unitPrice: number }) => {
            const t = (item.quantity || 0) * (item.unitPrice || 0);
            total += t;
            return { productId: item.productId, quantity: item.quantity || 0, unitPrice: item.unitPrice || 0, total: t };
        });

        const taxAmount = total * 0.15;
        const order = await prisma.purchaseOrder.create({
            data: {
                orderNumber, supplierId: body.supplierId || null,
                orderDate: new Date().toISOString().split('T')[0],
                expectedDate: body.expectedDate || null,
                total, taxAmount, grandTotal: total + taxAmount,
                status: 'draft', notes: body.notes || null, createdBy: body.userId || null,
                items: { create: items },
            },
            include: { items: true },
        });
        return NextResponse.json(order, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
