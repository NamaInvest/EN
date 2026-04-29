/**
 * Priority 2: Reorder Point Cron Job
 * يفحص كل المنتجات التي وصلت لحد إعادة الطلب
 * يُشغَّل كل 6 ساعات من Vercel Cron أو PM2 cronjob
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const alerts: { productId: number; name: string; current: number; min: number }[] = [];

        // Find all products at or below minimum stock
        const lowStockProducts = await prisma.product.findMany({
            where: {
                isActive: true,
                minStock: { gt: 0 },
            },
            select: {
                id: true,
                name: true,
                currentStock: true,
                minStock: true,
                category: { select: { name: true } },
            },
        });

        for (const p of lowStockProducts) {
            if (p.currentStock <= (p.minStock || 0)) {
                alerts.push({
                    productId: p.id,
                    name: p.name,
                    current: p.currentStock,
                    min: p.minStock || 0,
                });

                // Upsert SystemAlert (avoid duplicates)
                const existingAlert = await prisma.systemAlert.findFirst({
                    where: {
                        title: { contains: p.name },
                        alertType: 'WARNING',
                        isRead: false,
                    },
                });

                if (!existingAlert) {
                    await prisma.systemAlert.create({
                        data: {
                            title: `⚠️ مخزون منخفض: ${p.name}`,
                            message: `المخزون الحالي ${p.currentStock} وصل لحد إعادة الطلب (${p.minStock}). يُنصح بإنشاء أمر شراء فوراً.`,
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
    } catch (e) {
        console.error('Reorder cron error:', e);
        return NextResponse.json({ error: 'Cron error' }, { status: 500 });
    }
}
