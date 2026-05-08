import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
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
            take: 100,
            where,
            include: { customer: { select: { id: true, name: true, phone: true,  } }, salesRep: true, details: true },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (error: any) {
        return NextResponse.json({ error: 'خطأ في جلب بيانات أوامر البيع' }, { status: 500 });
    }
}

export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json();
        const { customerId, salesRepId, notes, items, subtotal, taxValue, total, isTaxInclusive, isDropShip } = body;

        // @ts-ignore
        const lastOrder = await prisma.salesOrder.findFirst({ orderBy: { orderNo: 'desc' } });
        const newOrderNo = lastOrder ? lastOrder.orderNo + 1 : 1000;

        // Process items to respect inclusive tax
        const finalItems = items.map((i: any) => {
            let p = parseFloat(i.price);
            if (isTaxInclusive) p = p / 1.15;
            return {
                productId: parseInt(i.productId),
                productName: i.productName,
                quantity: parseFloat(i.quantity),
                price: p,
                total: parseFloat(i.quantity) * p
            };
        });

        // @ts-ignore
        const order = await (prisma.salesOrder as any).create({
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
                isDropShip: !!isDropShip,
                details: {
                    create: finalItems
                }
            },
            include: { details: true }
        });

        // 🚀 Auto-generate Purchase Order for Drop Shipping (The Magic Trigger)
        if (isDropShip) {
            const lastPo = await prisma.purchaseOrder.findFirst({ orderBy: { orderNo: 'desc' } });
            const newPoNo = lastPo ? lastPo.orderNo + 1 : 2000;
            
            await (prisma.purchaseOrder as any).create({
                data: {
                    orderNo: newPoNo,
                    salesOrderId: order.id,
                    userId: auth.userId,
                    // Note: This is a draft PO, cost can be updated by procurement later
                    subtotal: parseFloat(subtotal), 
                    taxValue: parseFloat(taxValue),
                    total: parseFloat(total),
                    status: 'pending',
                    notes: `أمر شراء آلي (شحن مباشر - Drop Ship) لطلب المبيعات #${newOrderNo}`,
                    details: {
                        create: finalItems.map((fi: any) => ({
                            productId: fi.productId,
                            productName: fi.productName,
                            quantity: fi.quantity,
                            price: fi.price,
                            total: fi.total
                        }))
                    }
                }
            });
        }

        return NextResponse.json(order, { status: 201 });
    } catch (error: any) {
        return apiError(error, 'حدث خطأ في المعالجة', { context: 'sales-orders' });
    }
}
