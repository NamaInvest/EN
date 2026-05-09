import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/fiscal-periods — قائمة الفترات المالية
 * POST /api/fiscal-periods — إقفال أو فتح فترة مالية
 */
async function _GET(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const periods = await (prisma as any).fiscalPeriod?.findMany?.({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    if (!periods) {
      // توليد الفترات تلقائياً من بيانات الفواتير
      const currentYear = new Date().getFullYear();
      const generatedPeriods = [];
      for (let y = currentYear; y >= currentYear - 1; y--) {
        for (let m = 12; m >= 1; m--) {
          generatedPeriods.push({
            year: y,
            month: m,
            status: 'open',
            closedBy: null,
            closedAt: null,
          });
        }
      }
      return NextResponse.json({ periods: generatedPeriods, generated: true });
    }

    return NextResponse.json({ periods });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function _POST(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'صلاحية المدير مطلوبة لإقفال الفترات' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { year, month, action } = body; // action: 'close' | 'reopen'

    if (!year || !month) {
      return NextResponse.json({ error: 'السنة والشهر مطلوبان' }, { status: 400 });
    }

    const data: any = {};
    if (action === 'close') {
      data.status = 'closed';
      data.closedBy = user.userId;
      data.closedAt = new Date();
    } else if (action === 'reopen') {
      data.status = 'open';
      data.closedBy = null;
      data.closedAt = null;
    }

    const period = await (prisma as any).fiscalPeriod?.upsert?.({
      where: { year_month: { year: parseInt(year), month: parseInt(month) } },
      update: data,
      create: {
        year: parseInt(year),
        month: parseInt(month),
        ...data,
      },
    });

    if (!period) {
      return NextResponse.json({ error: 'يحتاج ترحيل قاعدة البيانات' }, { status: 500 });
    }

    // تسجيل في سجل المراقبة
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: action === 'close' ? 'PERIOD_CLOSE' : 'PERIOD_REOPEN',
        tableName: 'fiscal_periods',
        recordId: period.id,
        details: `${action === 'close' ? 'إقفال' : 'إعادة فتح'} الفترة المالية ${month}/${year}`,
      },
    });

    return NextResponse.json({ success: true, period });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
