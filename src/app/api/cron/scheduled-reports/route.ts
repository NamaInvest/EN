import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron.scheduled-reports' });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/scheduled-reports — إرسال التقارير المجدولة
 * يُستدعى عبر cron job خارجي (كل يوم الساعة 8 صباحاً مثلاً)
 */
async function _GET(req: Request) {

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay(); // 0=أحد ... 6=سبت

    // 1. جمع البيانات الأساسية
    const todayStart = new Date(today);
    const todayEnd = new Date(today + 'T23:59:59');
    const dateFilter = { gte: todayStart, lte: todayEnd };

    const [salesCount, salesTotal, purchasesTotal, expensesTotal] = await Promise.all([
      prisma.salesInvoice.count({ where: { date: dateFilter } }),
      prisma.salesInvoice.aggregate({ where: { date: dateFilter }, _sum: { total: true } }),
      prisma.purchaseInvoice.aggregate({ where: { date: dateFilter }, _sum: { total: true } }),
      prisma.expense.aggregate({ where: { date: dateFilter }, _sum: { amount: true } }),
    ]);

    // 2. جمع تنبيهات المخزون
    const lowStockProducts = await prisma.product.findMany({
      where: {
        active: true,
        currentStock: { lte: prisma.product.fields?.minQuantity as any || 0 },
      },
      select: { name: true, currentStock: true, minQuantity: true },
      take: 10,
    });

    // 3. تقرير يومي
    const dailyReport = {
      date: today,
      type: 'daily',
      data: {
        salesCount,
        salesTotal: n(salesTotal._sum.total),
        purchasesTotal: n(purchasesTotal._sum.total),
        expensesTotal: n(expensesTotal._sum.amount),
        netProfit: n(salesTotal._sum.total) - n(purchasesTotal._sum.total) - n(expensesTotal._sum.amount),
        lowStockAlerts: lowStockProducts.length,
      },
    };

    // 4. إرسال البريد (عبر API البريد الداخلي)
    const emailSettings = await prisma.setting.findFirst({
      where: { key: 'scheduled_report_email' },
    });

    let emailSent = false;
    if (emailSettings?.value) {
      try {
        // استدعاء API البريد الداخلي
        const emailResp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailSettings.value,
            subject: `📊 التقرير اليومي — ${today}`,
            html: `
              <div dir="rtl" style="font-family: Arial; padding: 20px;">
                <h2>📊 التقرير اليومي — ${today}</h2>
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                  <tr><td>عدد الفواتير</td><td><strong>${salesCount}</strong></td></tr>
                  <tr><td>إجمالي المبيعات</td><td><strong>${n(salesTotal._sum.total).toFixed(2)} ر.س</strong></td></tr>
                  <tr><td>إجمالي المشتريات</td><td>${n(purchasesTotal._sum.total).toFixed(2)} ر.س</td></tr>
                  <tr><td>المصروفات</td><td>${n(expensesTotal._sum.amount).toFixed(2)} ر.س</td></tr>
                  <tr style="background:#e8f5e9;"><td>صافي الربح</td><td><strong>${dailyReport.data.netProfit.toFixed(2)} ر.س</strong></td></tr>
                  <tr><td>تنبيهات المخزون</td><td>${lowStockProducts.length} منتج</td></tr>
                </table>
              </div>
            `,
          }),
        });
        emailSent = emailResp.ok;
      } catch (err: unknown) {
        log.error('src/app/api/cron/scheduled-reports/route.ts', { error: err instanceof Error ? err.message : err });

        emailSent = false;
      }
    }

    return NextResponse.json({
      success: true,
      report: dailyReport,
      emailSent,
      emailRecipient: emailSettings?.value || 'لم يتم تعيين بريد',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'CRON' });
