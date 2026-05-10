import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { getPrompt, renderPrompt } from '@/lib/prompts/registry';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai-cfo.report' });
async function _GET(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        // Retrieve API Key
        const setting = await prisma.setting.findUnique({ where: { key: 'gemini_api_key' } });
        let apiKey = setting?.value || process.env.GEMINI_API_KEY || '';
        if (apiKey) apiKey = apiKey.replace(/[\"\'\\]/g, '').trim();

        if (!apiKey) {
            return NextResponse.json({ error: 'مفتاح Gemini API غير متوفر في الإعدادات.' }, { status: 400 });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Sales Data
        const recentSales = await prisma.salesInvoice.aggregate({
            _sum: { total: true, subtotal: true },
            where: { date: { gte: thirtyDaysAgo } }
        });

        // 2. Purchases Data
        const recentPurchases = await prisma.purchaseInvoice.aggregate({
            _sum: { total: true },
            where: { date: { gte: thirtyDaysAgo }, status: { not: 'rejected' } } // Only valid purchases
        });

        // 3. Top Selling Products (by quantity)
        const topProductsRaw = await prisma.salesInvoiceDetail.groupBy({
            by: ['productId', 'productName'],
            _sum: { quantity: true, total: true },
            where: { invoice: { date: { gte: thirtyDaysAgo } } },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 10
        });

        const topProductIds = topProductsRaw.map(p => p.productId);

        // 4. Dead Stock (High stock, low/zero recent sales)
        const deadStockRaw = await prisma.product.findMany({
            where: { 
                currentStock: { gt: 10 },
                id: { notIn: topProductIds.length > 0 ? topProductIds : [0] }
            },
            select: { id: true, name: true, currentStock: true, sellPrice: true },
            orderBy: { currentStock: 'desc' },
            take: 20
        });

        // 5. Total Inventory Valuation (Rough Estimate using sellPrice)
        const inventoryValuation = await prisma.product.aggregate({
            _sum: { currentStock: true } // We'll just pass total items, cost is harder without buy_price * current_stock sum capability in prisma, so we loop:
        });
        
        const allProducts = await prisma.product.findMany({
            take: 100,
            where: { currentStock: { gt: 0 } },
            select: { currentStock: true, buyPrice: true }
        });
        const totalCapital = allProducts.reduce((sum: any, p: any) => sum + (n(p.currentStock) * n(p.buyPrice)), 0);

        const financialData = {
            period: "Past 30 Days",
            revenue: recentSales._sum.total || 0,
            purchases: recentPurchases._sum.total || 0,
            lockedCapitalInWarehouse: totalCapital || 0,
            fastMovers: topProductsRaw.map(p => ({
                name: p.productName,
                qtySold: p._sum.quantity,
                revenueGenerated: p._sum.total
            })),
            deadStockCandidates: deadStockRaw.map(p => ({
                name: p.name,
                stockLevel: p.currentStock,
                lockedCapital: n(p.currentStock) * n(p.sellPrice)
            }))
        };

        const promptTemplate = await getPrompt('cfo.monthly_analysis', auth.tenantId);
        if (!promptTemplate?.userTemplate) {
            return NextResponse.json({ error: 'Prompt template not found' }, { status: 500 });
        }

        const promptText = renderPrompt(promptTemplate.userTemplate, {
            financialData: JSON.stringify(financialData, null, 2)
        });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(promptText);
        let text = result.response.text();
        
        // Clean JSON payload
        text = text.replace(/^[\s\S]*?\{/, '{').replace(/\}[^}]*$/, '}').trim();
        
        try {
            const parsedData = JSON.parse(text);
            return NextResponse.json({ success: true, report: parsedData, raw: financialData });
        } catch (e: any) {
            log.error("AI JSON Parse Error:", text);
            return NextResponse.json({ error: 'تعذر فهم صيغة الجواب من الذكاء الاصطناعي.' }, { status: 500 });
        }

    } catch (error: any) {
        log.error('AI CFO Report Error:', error.message || error);
        
        let msg = 'فشل في الاتصال بمزود الخدمة لمعالجة التقرير الذكي.';
        if (error?.message?.includes('Too Many Requests') || error?.message?.includes('quota')) {
            msg = '⚠️ عذراً، وصلت للحد الأقصى المسموح من جوجل (مؤقتاً). يرجى الانتظار للمحاولة مرة أخرى.';
        }
        
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AI' });
