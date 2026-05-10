/**
 * Payment Due Schedule API (C.2)
 * ══════════════════════════════════════════════════════
 * GET /api/finance/payment-schedule?type=ar|ap&customerId=|vendorId=&daysAhead=30
 *
 * يعرض جدول استحقاق المدفوعات القادمة لـ:
 *   - AR: الفواتير المستحقة من العملاء
 *   - AP: الفواتير المستحقة للموردين
 * مع تفصيل كامل بتواريخ الاستحقاق والمبالغ
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
    const type       = searchParams.get('type') || 'ar';  // ar | ap
    const daysAhead  = parseInt(searchParams.get('daysAhead') || '90');
    const customerId = searchParams.get('customerId') ? parseInt(searchParams.get('customerId')!) : null;
    const vendorId   = searchParams.get('vendorId') ? parseInt(searchParams.get('vendorId')!) : null;

    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    if (type === 'ar') {
      // Accounts Receivable — amounts due from customers
      const invoices = await prisma.salesInvoice.findMany({
        where: {
          remainingAmount: { gt: 0 },
          ...(customerId ? { customerId } : {}),
          dueDate: { lte: future },
        },
        select: {
          id: true,
          invoiceNumber: true,
          date: true,
          dueDate: true,
          totalAmount: true,
          remainingAmount: true,
          customerId: true,
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 200,
      }).catch(() => []);

      const schedule = (invoices as any[]).map(inv => {
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
        const daysOverdue = dueDate
          ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        return {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
          invoiceDate: inv.date,
          dueDate: inv.dueDate,
          customerName: inv.customer?.name || 'غير محدد',
          customerPhone: inv.customer?.phone,
          invoiceTotal: Math.round(Number(inv.totalAmount || 0) * 100) / 100,
          amountDue: Math.round(Number(inv.remainingAmount || 0) * 100) / 100,
          daysOverdue: Math.max(0, daysOverdue),
          status: daysOverdue > 0 ? 'OVERDUE' : daysOverdue > -7 ? 'DUE_SOON' : 'FUTURE',
        };
      });

      const overdue  = schedule.filter(s => s.status === 'OVERDUE');
      const dueSoon  = schedule.filter(s => s.status === 'DUE_SOON');
      const upcoming = schedule.filter(s => s.status === 'FUTURE');

      return NextResponse.json({
        type: 'AR',
        period: { from: now.toISOString().split('T')[0], daysAhead },
        summary: {
          totalDue:           schedule.reduce((s, i) => s + i.amountDue, 0),
          overdueAmount:      overdue.reduce((s, i) => s + i.amountDue, 0),
          dueSoonAmount:      dueSoon.reduce((s, i) => s + i.amountDue, 0),
          overdueCount:       overdue.length,
          dueSoonCount:       dueSoon.length,
          upcomingCount:      upcoming.length,
        },
        schedule: { overdue, dueSoon, upcoming },
      });
    }

    // AP — Amounts due to vendors
    const purchases = await prisma.purchaseInvoice.findMany({
      where: {
        remainingAmount: { gt: 0 },
        ...(vendorId ? { vendorId } : {}),
        dueDate: { lte: future },
      },
      select: {
        id: true,
        invoiceNumber: true,
        date: true,
        dueDate: true,
        totalAmount: true,
        remainingAmount: true,
        vendorId: true,
        vendor: { select: { name: true, phone: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 200,
    }).catch(() => []);

    const schedule = (purchases as any[]).map(inv => {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const daysOverdue = dueDate
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber || `PO-${inv.id}`,
        invoiceDate: inv.date,
        dueDate: inv.dueDate,
        vendorName: inv.vendor?.name || 'غير محدد',
        vendorPhone: inv.vendor?.phone,
        invoiceTotal: Math.round(Number(inv.totalAmount || 0) * 100) / 100,
        amountDue: Math.round(Number(inv.remainingAmount || 0) * 100) / 100,
        daysOverdue: Math.max(0, daysOverdue),
        status: daysOverdue > 0 ? 'OVERDUE' : daysOverdue > -7 ? 'DUE_SOON' : 'FUTURE',
      };
    });

    const overdue  = schedule.filter(s => s.status === 'OVERDUE');
    const dueSoon  = schedule.filter(s => s.status === 'DUE_SOON');
    const upcoming = schedule.filter(s => s.status === 'FUTURE');

    return NextResponse.json({
      type: 'AP',
      period: { from: now.toISOString().split('T')[0], daysAhead },
      summary: {
        totalDue:      schedule.reduce((s, i) => s + i.amountDue, 0),
        overdueAmount: overdue.reduce((s, i) => s + i.amountDue, 0),
        dueSoonAmount: dueSoon.reduce((s, i) => s + i.amountDue, 0),
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
