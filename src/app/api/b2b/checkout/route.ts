import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getB2BUserFromRequest } from '@/lib/b2b-auth';

export async function POST(req: NextRequest) {
    try {
        const auth = getB2BUserFromRequest(req);
        if (!auth) return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });

        const { cart } = await req.json();

        if (!cart || cart.length === 0) {
            return NextResponse.json({ success: false, error: 'السلة فارغة' }, { status: 400 });
        }

        // Get the last order number
        const lastOrder = await prisma.salesOrder.findFirst({
            orderBy: { orderNo: 'desc' }
        });
        const orderNo = (lastOrder?.orderNo || 0) + 1;

        let subtotal = 0;
        let taxValue = 0;

        for (const item of cart) {
            const itemTotal = item.quantity * item.price;
            subtotal += itemTotal;
            taxValue += itemTotal * (item.taxRate / 100);
        }

        const total = subtotal + taxValue;

        const order = await prisma.salesOrder.create({
            data: {
                orderNo,
                customerId: auth.customerId,
                subtotal,
                taxValue,
                total,
                status: 'pending',
                notes: 'B2B Wholesale Portal Order',
                details: {
                    create: cart.map((c: any) => ({
                        productId: c.productId,
                        productName: c.name,
                        quantity: c.quantity,
                        price: c.price,
                        total: c.quantity * c.price,
                    }))
                }
            }
        });

        return NextResponse.json({ success: true, order });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
