import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/cash-flow — تقرير التدفقات النقدية
 * يصنف الحركات إلى: تشغيلية، استثمارية، تمويلية
 */
export async function GET(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from') || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const toDate = searchParams.get('to') || new Date().toISOString();

    const dateFilter = {
      gte: new Date(fromDate),
      lte: new Date(toDate),
    };

    // 1. التدفقات التشغيلية (Operating)
    const salesTotal = await prisma.salesInvoice.aggregate({
      where: { date: dateFilter },
      _sum: { total: true, paid: true },
    });

    const purchasesTotal = await prisma.purchaseInvoice.aggregate({
      where: { date: dateFilter },
      _sum: { total: true, paid: true },
    });

    const expensesTotal = await prisma.expense.aggregate({
      where: { date: dateFilter },
      _sum: { amount: true },
    });

    let salariesSum = 0;
    try {
      const salariesTotal = await prisma.salary.aggregate({ _sum: { netSalary: true } });
      salariesSum = salariesTotal._sum.netSalary || 0;
    } catch { /* salary table may not exist */ }

    // 2. التدفقات الاستثمارية (Investing)
    let assetsSum = 0;
    try {
      const assetsTotal = await (prisma as any).fixedAsset.aggregate({
        where: { purchaseDate: dateFilter },
        _sum: { purchasePrice: true },
      });
      assetsSum = assetsTotal?._sum?.purchasePrice || 0;
    } catch { /* fixedAsset table may not exist */ }

    // 3. حركات الخزينة المباشرة
    const treasuryIn = await prisma.treasury.aggregate({
      where: { date: dateFilter, type: 'in' },
      _sum: { amount: true },
    });

    const treasuryOut = await prisma.treasury.aggregate({
      where: { date: dateFilter, type: 'out' },
      _sum: { amount: true },
    });

    // حساب التدفقات
    const operating = {
      label: 'التدفقات التشغيلية',
      inflows: {
        sales: salesTotal._sum.total || 0,
        otherIncome: treasuryIn._sum.amount || 0,
      },
      outflows: {
        purchases: purchasesTotal._sum.total || 0,
        expenses: expensesTotal._sum.amount || 0,
        salaries: salariesSum,
        otherPayments: treasuryOut._sum.amount || 0,
      },
      net: 0,
    };
    operating.net =
      (operating.inflows.sales + operating.inflows.otherIncome) -
      (operating.outflows.purchases + operating.outflows.expenses +
        operating.outflows.salaries + operating.outflows.otherPayments);

    const investing = {
      label: 'التدفقات الاستثمارية',
      assetPurchases: assetsSum,
      net: -assetsSum,
    };

    const financing = {
      label: 'التدفقات التمويلية',
      net: 0, // يُحسب من القروض والسداد عند توفر البيانات
    };

    const netCashFlow = operating.net + investing.net + financing.net;

    return NextResponse.json({
      period: { from: fromDate, to: toDate },
      operating,
      investing,
      financing,
      netCashFlow,
      summary: {
        totalInflows: operating.inflows.sales + operating.inflows.otherIncome,
        totalOutflows: operating.outflows.purchases + operating.outflows.expenses +
          operating.outflows.salaries + operating.outflows.otherPayments + assetsSum,
        net: netCashFlow,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
