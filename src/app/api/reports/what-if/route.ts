import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/what-if — تحليل "ماذا لو" المالي
 * يحسب تأثير تغييرات الأسعار والتكاليف والحجم على الربحية
 */
export async function GET(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);

    // المتغيرات (نسب مئوية)
    const priceChange = parseFloat(searchParams.get('priceChange') || '0');     // تغيير السعر %
    const costChange = parseFloat(searchParams.get('costChange') || '0');       // تغيير التكلفة %
    const volumeChange = parseFloat(searchParams.get('volumeChange') || '0');   // تغيير حجم المبيعات %

    // جمع بيانات الفترة الحالية (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesData = await prisma.salesInvoice.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { subtotal: true, taxValue: true, total: true },
      _count: true,
    });

    const purchasesData = await prisma.purchaseInvoice.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { subtotal: true, total: true },
    });

    const expensesData = await prisma.expense.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    });

    // القيم الحالية
    const currentRevenue = n(salesData._sum.subtotal);
    const currentCOGS = n(purchasesData._sum.subtotal);
    const currentExpenses = n(expensesData._sum.amount);
    const currentGrossProfit = currentRevenue - currentCOGS;
    const currentNetProfit = currentGrossProfit - currentExpenses;
    const currentMargin = currentRevenue > 0 ? (currentNetProfit / currentRevenue) * 100 : 0;

    // القيم المحاكاة (What-If)
    const newRevenue = currentRevenue * (1 + priceChange / 100) * (1 + volumeChange / 100);
    const newCOGS = currentCOGS * (1 + costChange / 100) * (1 + volumeChange / 100);
    const newGrossProfit = newRevenue - newCOGS;
    const newNetProfit = newGrossProfit - currentExpenses;
    const newMargin = newRevenue > 0 ? (newNetProfit / newRevenue) * 100 : 0;

    return NextResponse.json({
      period: 'آخر 30 يوم',
      invoiceCount: salesData._count,
      current: {
        revenue: Math.round(currentRevenue * 100) / 100,
        cogs: Math.round(currentCOGS * 100) / 100,
        grossProfit: Math.round(currentGrossProfit * 100) / 100,
        expenses: Math.round(currentExpenses * 100) / 100,
        netProfit: Math.round(currentNetProfit * 100) / 100,
        margin: Math.round(currentMargin * 10) / 10,
      },
      scenario: {
        priceChange,
        costChange,
        volumeChange,
        revenue: Math.round(newRevenue * 100) / 100,
        cogs: Math.round(newCOGS * 100) / 100,
        grossProfit: Math.round(newGrossProfit * 100) / 100,
        expenses: Math.round(currentExpenses * 100) / 100,
        netProfit: Math.round(newNetProfit * 100) / 100,
        margin: Math.round(newMargin * 10) / 10,
      },
      impact: {
        revenueChange: Math.round((newRevenue - currentRevenue) * 100) / 100,
        profitChange: Math.round((newNetProfit - currentNetProfit) * 100) / 100,
        marginChange: Math.round((newMargin - currentMargin) * 10) / 10,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
