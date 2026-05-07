import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
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

    const totalRevenue = salesTotal._sum.total || 0;
    const totalCost = purchaseTotal._sum.total || 0;
    const totalExpenses = expenseTotal?._sum?.amount || 0;
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
          total: m._sum.total || 0,
          count: m._count
        })),
        topProducts,
        salesByPayment: salesByPayment.map(s => ({
          type: s.paymentType,
          total: s._sum.total || 0,
          count: s._count
        }))
      }
    };

    return NextResponse.json(kpis);
  } catch (error: any) {
    return apiError(error, 'Error fetching BI data', { context: 'bi/kpis' });
  }
}
