/**
 * Dunning API (C.3)
 * POST /api/finance/dunning { action: 'run' }
 *   — تشغيل Dunning وإرجاع قائمة العملاء المتأخرين
 * GET  /api/finance/dunning?asOf=2026-05-11
 *   — عرض نتائج آخر تشغيل
 */
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { DunningEngine } from '@/lib/dunning-engine';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.finance.dunning' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const levelFilter      = searchParams.get('level');
    const customerIdFilter = searchParams.get('customerId') ? parseInt(searchParams.get('customerId')!) : null;

    // Load overdue AR invoices directly (engine stores in DB dunningLetter table)
    const overdueWhere: any = {
      remaining: { gt: 0 },
      deletedAt: null,
      status: 'posted',
    };
    if (customerIdFilter) overdueWhere.customerId = customerIdFilter;

    const overdueInvoices = await prisma.salesInvoice.findMany({
      where: overdueWhere,
      select: {
        id: true, invoiceNo: true, customerId: true, date: true,
        total: true, remaining: true,
        customer: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { date: 'asc' },
      take: 200,
    }).catch(() => [] as any[]);

    const now = new Date();
    const cases = (overdueInvoices as any[]).map(inv => {
      const dueDate = new Date(inv.date);
      dueDate.setDate(dueDate.getDate() + 30);
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000));
      const level = daysOverdue >= 60 ? 'L4' : daysOverdue >= 30 ? 'L3' : daysOverdue >= 15 ? 'L2' : 'L1';
      return {
        invoiceId: inv.id,
        invoiceNo: Number(inv.invoiceNo),
        customerId: inv.customerId,
        customerName: inv.customer?.name || 'غير محدد',
        customerPhone: inv.customer?.phone,
        daysOverdue,
        dunningLevel: level,
        remainingAmount: Number(inv.remaining || 0),
        dueDate,
      };
    }).filter(c => c.daysOverdue >= 7);

    const filtered = levelFilter ? cases.filter(c => c.dunningLevel === levelFilter) : cases;

    const byLevel = { L1: 0, L2: 0, L3: 0, L4: 0 };
    for (const c of cases) byLevel[c.dunningLevel as keyof typeof byLevel]++;

    return NextResponse.json({
      runDate: now,
      totalCases: filtered.length,
      byLevel,
      totalOverdueAmount: Math.round(cases.reduce((s, c) => s + c.remainingAmount, 0) * 100) / 100,
      cases: filtered.slice(0, 100),
    });
  } catch (error: any) {
    log.error('Dunning GET error:', error);
    return NextResponse.json({ error: 'فشل تشغيل محرك التحصيل' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body   = await request.json();
    const action = body.action;

    if (action === 'run') {
      const asOf = body.asOf ? new Date(body.asOf) : new Date();
      await DunningEngine.executeDailyRun(asOf);
      return NextResponse.json({ success: true, message: 'تم تشغيل Dunning بنجاح', asOf });
    }

    return NextResponse.json({ error: 'action غير معروف. استخدم: run' }, { status: 400 });
  } catch (error: any) {
    log.error('Dunning POST error:', error);
    return NextResponse.json({ error: 'فشل العملية' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
