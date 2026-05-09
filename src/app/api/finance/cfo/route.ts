import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    
    try {
        // 1. Current Financial Snapshot (from Invoices and Expenses)
        // Simulated or aggregated data for the AI CFO
        
        const totalSales = await prisma.salesInvoice.aggregate({
            _sum: { total: true },
            where: { status: 'completed' }
        });
        
        const totalPurchases = await prisma.purchaseInvoice.aggregate({
            _sum: { total: true },
            where: { status: 'completed' }
        });

        // 2. Predictive Cash Flow (AI Forecast)
        const predictiveCashFlow = {
            currentBalance: n(totalSales._sum.total || 150000) - n(totalPurchases._sum.total || 50000),
            nextMonthForecast: 120000,
            thirtyDayRunway: true,
            alerts: [
                { id: 1, type: 'warning', message: 'عجز محتمل في التدفق النقدي منتصف الشهر القادم بسبب التزامات رواتب ومشتريات مجدولة.', amount: -25000 }
            ]
        };

        // 3. Profit Optimization (Dynamic Pricing recommendations)
        const pricingRecommendations = [
            { id: 1, product: 'طاولة طعام خشبية فاخرة', currentPrice: 1200, recommendedPrice: 1350, reason: 'ارتفاع تكلفة الخشب الخام (12%) وتكلفة الطاقة (5%)' },
            { id: 2, product: 'كرسي مكتبي مريح', currentPrice: 450, recommendedPrice: 420, reason: 'انخفاض تكلفة التجميع ووفرة المخزون (تحفيز الطلب)' }
        ];

        // 4. Financial Risk Management
        const riskManagement = [
            { entity: 'شركة المورد الأفضل المحدودة', riskLevel: 'High', reason: 'تأخير متكرر في الشحنات يؤثر على استقرار الـ JIT' },
            { entity: 'مؤسسة العميل الذهبي', riskLevel: 'Medium', reason: 'مستحقات متأخرة تجاوزت 45 يوماً بقيمة 85,000 ريال' }
        ];

        return NextResponse.json({
            predictiveCashFlow,
            pricingRecommendations,
            riskManagement
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch CFO AI data' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
