/**
 * Payment Due Schedule API (C.2)
 * ══════════════════════════════════════════════════════
 * GET /api/finance/payment-schedule?type=ar|ap&customerId=|vendorId=&daysAhead=90
 */

import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.finance.payment-schedule' });

async function _GET(request: NextRequest) {
  const prisma = getPrisma(request);
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type       = searchParams.get('type') || 'ar';
    const daysAhead  = parseInt(searchParams.get('daysAhead') || '90');
    const customerId = searchParams.get('customerId') ? parseInt(searchParams.get('customerId')!) : null;
    const supplierId = searchParams.get('supplierId') ? parseInt(searchParams.get('supplierId')!) : null;

    const now = new Date();
    // Use date range: invoices from last 6 months with remaining balance
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 6);

    if (type === 'ar') {
      const invoices = await prisma.salesInvoice.findMany({
        where: {
          remaining: { gt: 0 },
          deletedAt: null,
          ...(customerId ? { customerId } : {}),
          date: { gte: cutoff },
        },
        select: {
          id: true,
          invoiceNo: true,
          date: true,
          total: true,
          remaining: true,
          customerId: true,
          customer: { select: { name: true, phone: true } },
          paymentType: true,
        },
        orderBy: { date: 'asc' },
        take: 200,
      }).catch(() => [] as any[]);

      const schedule = (invoices as any[]).map(inv => {
        // Estimate due date: invoice date + 30 days (standard credit term)
        const invoiceDate = new Date(inv.date);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          invoiceId: inv.id,
          invoiceNo: inv.invoiceNo,
          invoiceDate: inv.date,
          estimatedDueDate: dueDate.toISOString().split('T')[0],
          customerName: inv.customer?.name || 'غير محدد',
          customerPhone: inv.customer?.phone,
          invoiceTotal: Math.round(Number(inv.total || 0) * 100) / 100,
          amountDue: Math.round(Number(inv.remaining || 0) * 100) / 100,
          daysOverdue: Math.max(0, daysOverdue),
          status: daysOverdue > 0 ? 'OVERDUE' : daysOverdue > -7 ? 'DUE_SOON' : 'FUTURE',
        };
      });

      const overdue  = schedule.filter(s => s.status === 'OVERDUE');
      const dueSoon  = schedule.filter(s => s.status === 'DUE_SOON');
      const upcoming = schedule.filter(s => s.status === 'FUTURE');

      return NextResponse.json({
        type: 'AR',
        period: { from: cutoff.toISOString().split('T')[0], daysAhead },
        summary: {
          totalDue:      Math.round(schedule.reduce((s, i) => s + i.amountDue, 0) * 100) / 100,
          overdueAmount: Math.round(overdue.reduce((s, i) => s + i.amountDue, 0) * 100) / 100,
          dueSoonAmount: Math.round(dueSoon.reduce((s, i) => s + i.amountDue, 0) * 100) / 100,
          overdueCount:  overdue.length,
          dueSoonCount:  dueSoon.length,
          upcomingCount: upcoming.length,
        },
        schedule: { overdue, dueSoon, upcoming },
      });
    }

    // AP — Amounts due to suppliers
    const purchases = await prisma.purchaseInvoice.findMany({
      where: {
        remaining: { gt: 0 },
        deletedAt: null,
        ...(supplierId ? { supplierId } : {}),
        date: { gte: cutoff },
      },
      select: {
        id: true,
        invoiceNo: true,
        date: true,
        total: true,
        remaining: true,
        supplierId: true,
        supplier: { select: { name: true, phone: true } },
        paymentType: true,
      },
      orderBy: { date: 'asc' },
      take: 200,
    }).catch(() => [] as any[]);

    const schedule = (purchases as any[]).map(inv => {
      const invoiceDate = new Date(inv.date);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.date,
        estimatedDueDate: dueDate.toISOString().split('T')[0],
        supplierName: inv.supplier?.name || 'غير محدد',
        supplierPhone: inv.supplier?.phone,
        invoiceTotal: Math.round(Number(inv.total || 0) * 100) / 100,
        amountDue: Math.round(Number(inv.remaining || 0) * 100) / 100,
        daysOverdue: Math.max(0, daysOverdue),
        status: daysOverdue > 0 ? 'OVERDUE' : daysOverdue > -7 ? 'DUE_SOON' : 'FUTURE',
      };
    });

    const overdue  = schedule.filter(s => s.status === 'OVERDUE');
    const dueSoon  = schedule.filter(s => s.status === 'DUE_SOON');
    const upcoming = schedule.filter(s => s.status === 'FUTURE');

    return NextResponse.json({
      type: 'AP',
      period: { from: cutoff.toISOString().split('T')[0], daysAhead },
      summary: {
        totalDue:      Math.round(schedule.reduce((s, i) => s + i.amountDue, 0) * 100) / 100,
        overdueAmount: Math.round(overdue.reduce((s, i) => s + i.amountDue, 0) * 100) / 100,
        dueSoonAmount: Math.round(dueSoon.reduce((s, i) => s + i.amountDue, 0) * 100) / 100,
        overdueCount:  overdue.length,
        dueSoonCount:  dueSoon.length,
        upcomingCount: upcoming.length,
      },
      schedule: { overdue, dueSoon, upcoming },
    });
  } catch (error: any) {
    log.error('Payment schedule error:', error);
    return NextResponse.json({ error: 'فشل جلب جدول الاستحقاقات' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
