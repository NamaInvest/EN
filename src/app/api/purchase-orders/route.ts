import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const where: Record<string, unknown> = {};
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        }

        const orders = await prisma.purchaseOrder.findMany({ 
            where,
            include: { details: true, supplier: true, user: { select: { fullName: true } } }, 
            orderBy: { id: 'desc' } 
        });
        return NextResponse.json(orders);
    } catch (e) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userId = body.userId ? parseInt(body.userId) : null;
        let branchId = body.branchId ? parseInt(body.branchId) : null;
        
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const last = await prisma.purchaseOrder.findFirst({ orderBy: { id: 'desc' } });
        const orderNo = ((last?.orderNo || 0) + 1);

        let subtotal = 0;
        const details = (body.items || []).map((item: any) => {
            const qty = parseFloat(item.quantity) || 1;
            const price = parseFloat(item.price) || 0;
            const itemSub = qty * price;
            const tax = itemSub * 0.15;
            subtotal += itemSub;
            return { 
                productId: parseInt(item.productId), 
                productName: item.productName || '',
                quantity: qty, 
                price: price, 
                taxRate: 15,
                taxValue: tax,
                total: itemSub + tax
            };
        });

        const taxValue = subtotal * 0.15;
        const total = subtotal + taxValue;

        const order = await prisma.purchaseOrder.create({
            data: {
                orderNo, 
                supplierId: body.supplierId ? parseInt(body.supplierId) : null,
                stockId: body.stockId ? parseInt(body.stockId) : 1,
                date: new Date(),
                subtotal, taxValue, total,
                status: 'pending', notes: body.notes || null, 
                userId, branchId,
                details: { create: details },
            },
            include: { details: true },
        });
        return NextResponse.json(order, { status: 201 });
    } catch (e) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
