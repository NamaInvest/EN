import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * AI Sales Coach API
 * POST /api/ai/sales-coach
 * يحلل أداء المندوب ويقدم توصيات ذكية
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai.sales-coach' });


const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const targetUserId = parseInt(body.userId) || user.userId;

        // Fetch last 30 days sales for this user
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const invoices = await prisma.salesInvoice.findMany({ take: 100,
            where: {
                userId: targetUserId,
                date: { gte: thirtyDaysAgo },
            },
            include: { details: true },
            orderBy: { date: 'desc' },
        });

        const totalSales = invoices.reduce((s: number, i: any) => s + i.total, 0);
        const avgInvoice = invoices.length > 0 ? totalSales / invoices.length : 0;
        const totalItems = invoices.reduce((s: number, i: any) => s + i.details.length, 0);

        // Product frequency
        const productFreq: Record<string, { name: string; count: number; revenue: number }> = {};
        invoices.forEach((inv: any) => {
            inv.details.forEach((d: any) => {
                if (!productFreq[d.productId]) productFreq[d.productId] = { name: d.productName, count: 0, revenue: 0 };
                productFreq[d.productId].count += d.quantity;
                productFreq[d.productId].revenue += d.total;
            });
        });

        const topProducts = Object.values(productFreq)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Generate AI-style recommendations (rule-based + contextual)
        const recommendations: string[] = [];

        if (invoices.length < 10) recommendations.push('📉 عدد الفواتير منخفض هذا الشهر — ركّز على زيارة العملاء الدوريين');
        if (avgInvoice < 500) recommendations.push('💡 متوسط الفاتورة منخفض — اقترح منتجات مكملة (Cross-sell) في كل عملية بيع');
        if (topProducts.length > 0) recommendations.push(`🏆 أكثر منتجاتك مبيعاً: ${topProducts[0]?.name} — استمر في التركيز عليه`);

        const cashInvoices = invoices.filter((i: any) => i.paymentType === 'cash').length;
        const creditRatio = invoices.length > 0 ? ((invoices.length - cashInvoices) / invoices.length) * 100 : 0;
        if (creditRatio > 60) recommendations.push('⚠️ 60%+ من مبيعاتك بالآجل — حاول تحسين نسبة النقدي لتسريع التدفق النقدي');

        recommendations.push('🎯 هدف الشهر القادم: زيادة 15% على إجمالي هذا الشهر = ' + Math.round(totalSales * 1.15).toLocaleString() + ' ر.س');

        return NextResponse.json({
            period: '30 يوم الماضية',
            performance: {
                totalInvoices: invoices.length,
                totalSales: Math.round(totalSales * 100) / 100,
                avgInvoice: Math.round(avgInvoice * 100) / 100,
                totalItemsSold: totalItems,
                creditRatio: Math.round(creditRatio),
            },
            topProducts,
            recommendations,
            score: Math.min(100, Math.round((invoices.length * 3) + (totalSales / 1000))),
        });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'خطأ في تحليل الأداء' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AI' });
