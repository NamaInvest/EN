import { getUserFromRequest } from '@/lib/auth';
/**
 * Priority 2: Reorder Point Cron Job
 * يفحص كل المنتجات التي وصلت لحد إعادة الطلب (minQuantity)
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    // Allow cron secret or authenticated user
    const cronSecret = new URL(req.url).searchParams.get('secret');
    if (!user && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const alerts: { productId: number; name: string; current: number; min: number }[] = [];

        // Product uses 'active' (Boolean) and 'minQuantity' (Float)
        const lowStockProducts = await prisma.product.findMany({
            take: 100,
            where: {
                active: true,
                minQuantity: { gt: 0 },
            },
            select: {
                id: true,
                name: true,
                currentStock: true,
                minQuantity: true,
            },
        });

        for (const p of lowStockProducts) {
            if (p.currentStock <= p.minQuantity) {
                alerts.push({
                    productId: p.id,
                    name: p.name,
                    current: p.currentStock,
                    min: p.minQuantity,
                });

                // Avoid duplicate unread alerts — 'read' is the correct field name
                const existingAlert = await prisma.systemAlert.findFirst({
                    where: {
                        title: { contains: p.name },
                        alertType: 'WARNING',
                        read: false,
                    },
                });

                if (!existingAlert && user) {
                    await prisma.systemAlert.create({
                        data: {
                            userId: user.userId,
                            title: `⚠️ مخزون منخفض: ${p.name}`,
                            message: `المخزون الحالي ${p.currentStock} وصل لحد إعادة الطلب (${p.minQuantity}). يُنصح بإنشاء أمر شراء فوراً.`,
                            alertType: 'WARNING',
                            linkUrl: `/products/${p.id}`,
                        },
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            checkedAt: new Date().toISOString(),
            lowStockCount: alerts.length,
            alerts,
        });
    } catch (e: any) {
        console.error('Reorder cron error:', e);
        return NextResponse.json({ error: 'Cron error' }, { status: 500 });
    }
}
