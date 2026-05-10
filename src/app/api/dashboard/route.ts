/**
 * GET /api/dashboard — Main dashboard aggregated stats
 * Returns key KPIs: revenue, expenses, pending approvals, low stock alerts
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function handler(ctx: any) {
  const prisma    = ctx.prisma;
  const tenantId  = ctx.auth.tenantId;
  const today     = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  try {
    const [
      totalRevenue,
      totalExpenses,
      pendingApprovals,
      lowStockCount,
      recentInvoices,
    ] = await Promise.all([
      // Revenue this month
      prisma.salesInvoice.aggregate({
        where:  { tenantId, deletedAt: null, date: { gte: monthStart } },
        _sum:   { total: true },
      }),
      // Expenses this month
      prisma.expense.aggregate({
        where:  { tenantId, date: { gte: monthStart } },
        _sum:   { amount: true },
      }),
      // Pending approvals
      prisma.approvalRequest.count({
        where: { tenantId, status: 'PENDING' },
      }).catch(() => 0),
      // Low stock products
      prisma.product.count({
        where: { tenantId, deletedAt: null, currentStock: { lte: prisma.product.fields?.minQuantity } },
      }).catch(() => 0),
      // Last 5 invoices
      prisma.salesInvoice.findMany({
        where:   { tenantId, deletedAt: null },
        orderBy: { date: 'desc' },
        take:    5,
        select:  { id: true, invoiceNo: true, total: true, date: true, status: true },
      }),
    ]);

    return NextResponse.json({
      revenue:          Number(totalRevenue._sum.total ?? 0),
      expenses:         Number(totalExpenses._sum.total ?? 0),
      profit:           Number(totalRevenue._sum.total ?? 0) - Number(totalExpenses._sum.total ?? 0),
      pendingApprovals,
      lowStockCount,
      recentInvoices,
      period:           { from: monthStart.toISOString(), to: today.toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });
