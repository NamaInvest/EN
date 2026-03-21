import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { orderNo: parseInt(search) || -1 },
                { customer: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // @ts-ignore
        const orders = await prisma.salesOrder.findMany({
            where,
            include: { customer: true, salesRep: true, details: true },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'خطأ في جلب بيانات أوامر البيع' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json();
        const { customerId, salesRepId, notes, items, subtotal, taxValue, total } = body;

        // @ts-ignore
        const lastOrder = await prisma.salesOrder.findFirst({ orderBy: { orderNo: 'desc' } });
        const newOrderNo = lastOrder ? lastOrder.orderNo + 1 : 1000;

        // @ts-ignore
        const order = await prisma.salesOrder.create({
            data: {
                orderNo: newOrderNo,
                customerId: customerId ? parseInt(customerId) : null,
                salesRepId: salesRepId ? parseInt(salesRepId) : null,
                userId: auth.userId,
                notes,
                subtotal: parseFloat(subtotal),
                taxValue: parseFloat(taxValue),
                total: parseFloat(total),
                status: 'pending',
                details: {
                    create: items.map((i: any) => ({
                        productId: parseInt(i.productId),
                        productName: i.productName,
                        quantity: parseFloat(i.quantity),
                        price: parseFloat(i.price),
                        total: parseFloat(i.quantity) * parseFloat(i.price)
                    }))
                }
            },
            include: { details: true }
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
