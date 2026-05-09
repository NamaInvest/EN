import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Aggregate KPIs from real data
    const [salesCount, salesTotal, purchaseCount, purchaseTotal, productCount, customerCount, employeeCount, expenseTotal] = await Promise.all([
      prisma.salesInvoice.count(),
      prisma.salesInvoice.aggregate({ _sum: { total: true } }),
      prisma.purchaseInvoice.count(),
      prisma.purchaseInvoice.aggregate({ _sum: { total: true } }),
      prisma.product.count({ where: { active: true } }),
      prisma.customer.count({ where: { active: true } }),
      prisma.employee.count({ where: { active: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } })
    ]);

    // Monthly sales trend (last 12 months)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlySales = await prisma.salesInvoice.groupBy({
      by: ['date'],
      _sum: { total: true },
      _count: true,
      where: { date: { gte: twelveMonthsAgo } },
      orderBy: { date: 'asc' }
    });

    // Top 10 products by revenue
    const topProducts = await prisma.salesInvoiceDetail.groupBy({
      by: ['productId'],
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10
    });

    // Sales by payment type
    const salesByPayment = await prisma.salesInvoice.groupBy({
      by: ['paymentType'],
      _sum: { total: true },
      _count: true
    });

    const totalRevenue = n(salesTotal._sum.total);
    const totalCost = n(purchaseTotal._sum.total);
    const totalExpenses = n(expenseTotal?._sum?.amount);
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses;

    const kpis = {
      financial: {
        totalRevenue,
        totalCost,
        grossProfit,
        netProfit,
        profitMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0,
        netMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0
      },
      operational: {
        totalSales: salesCount,
        totalPurchases: purchaseCount,
        activeProducts: productCount,
        activeCustomers: customerCount,
        activeEmployees: employeeCount,
        avgOrderValue: salesCount > 0 ? (totalRevenue / salesCount).toFixed(2) : 0
      },
      charts: {
        monthlySales: monthlySales.map(m => ({
          date: m.date,
          total: n(m._sum.total),
          count: m._count
        })),
        topProducts,
        salesByPayment: salesByPayment.map(s => ({
          type: s.paymentType,
          total: n(s._sum.total),
          count: s._count
        }))
      }
    };

    return NextResponse.json(kpis);
  } catch (error: any) {
    return apiError(error, 'Error fetching BI data', { context: 'bi/kpis' });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
