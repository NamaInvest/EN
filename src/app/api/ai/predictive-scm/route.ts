import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        // Phase 4: Predictive SCM Logic
        // 1. Identify low stock items (currentStock <= minQuantity * 1.5)
        const lowStockProducts = await prisma.product.findMany({
            where: {
                active: true,
                minQuantity: { gt: 0 }
            }
        });

        const itemsToOrder = lowStockProducts.filter(p => p.currentStock <= p.minQuantity * 1.5);
        
        if (itemsToOrder.length === 0) {
            return NextResponse.json({ success: true, message: 'المخزون بوضع آمن، لا توجد طلبات ذكية مقترحة.', ordersCreated: 0 });
        }

        // 2. Generate a new Purchase Order
        const lastOrder = await prisma.purchaseOrder.findFirst({
            orderBy: { orderNo: 'desc' }
        });
        const nextOrderNo = (lastOrder?.orderNo || 1000) + 1;

        // Calculate totals dynamically
        let subtotal = 0;
        let taxValue = 0;
        
        const detailsInput = itemsToOrder.map(product => {
            // Intelligent restock formula: order enough to reach 3x the minimum threshold
            let qtyToOrder = (product.minQuantity * 3) - product.currentStock;
            if (qtyToOrder < 1) qtyToOrder = 1;
            
            const lineTotal = qtyToOrder * product.buyPrice;
            const lineTax = lineTotal * (product.taxRate / 100);
            
            subtotal += lineTotal;
            taxValue += lineTax;

            return {
                productId: product.id,
                productName: product.name,
                quantity: qtyToOrder,
                price: product.buyPrice,
                taxRate: product.taxRate,
                taxValue: lineTax,
                total: lineTotal + lineTax
            };
        });

        const total = subtotal + taxValue;

        // Create the intelligent drafted P.O.
        const po = await prisma.purchaseOrder.create({
            data: {
                orderNo: nextOrderNo,
                date: new Date(),
                subtotal,
                taxValue,
                total,
                status: 'pending',
                notes: '🤖 أوامر نظام المشتريات الاستباقي (AI SCM) - بانتظار اعتماد الإدارة',
                userId: user.userId,
                details: {
                    create: detailsInput
                }
            },
            include: {
                details: true
            }
        });

        return NextResponse.json({
            success: true,
            message: `تم توليد أمر شراء ذكي رقم ${po.orderNo} يحتوي على ${itemsToOrder.length} منتج بحاجة للتوريد.`,
            purchaseOrder: po
        });

    } catch (e: any) {
        console.error('predictive scm error:', e);
        return NextResponse.json({ error: 'فشل توليد أمر الشراء الذكي' }, { status: 500 });
    }
}
