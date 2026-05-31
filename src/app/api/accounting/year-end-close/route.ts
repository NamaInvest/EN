import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { YearEndCloseEngine } from '@/lib/accounting/year-end-close';
import { logger } from '@/lib/observability/logger';

const log = logger.child({ module: 'api.accounting.year-end-close' });

/**
 * GET /api/accounting/year-end-close
 * للتحقق من جاهزية السنة المالية للإغلاق وعرض blockers/warnings
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request as any);
    if (!auth) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscalYear'); // e.g. "2026"
    const tenantId = auth.tenantId || 'default';

    if (!fiscalYear) {
      return NextResponse.json({ error: 'السنة المالية مطلوبة' }, { status: 400 });
    }

    const validation = await YearEndCloseEngine.validateYearReadiness(tenantId, fiscalYear);
    return NextResponse.json(validation);
  } catch (error: any) {
    log.error('GET /api/accounting/year-end-close failed', { error: error.message });
    return NextResponse.json({ error: error.message || 'حدث خطأ داخلي' }, { status: 500 });
  }
}

/**
 * POST /api/accounting/year-end-close
 * لتنفيذ قيد الإقفال السنوي وتدوير الأرصدة الافتتاحية
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request as any);
    if (!auth) {
      return NextResponse.json({ error: 'غير مصرح بالدخول' }, { status: 401 });
    }

    const body = await request.json();
    const { fiscalYear, retainedEarningsAccountId, action } = body;
    const tenantId = auth.tenantId || 'default';
    const userId = String(auth.userId || '0');

    if (!fiscalYear) {
      return NextResponse.json({ error: 'السنة المالية مطلوبة' }, { status: 400 });
    }

    // أ. قيد الإقفال السنوي
    if (action === 'POST_CLOSING_JE') {
      if (!retainedEarningsAccountId) {
        return NextResponse.json({ error: 'حساب الأرباح المحتجزة مطلوب لتصفير قائمة الدخل' }, { status: 400 });
      }

      const result = await YearEndCloseEngine.closeIncomeStatement({
        tenantId,
        fiscalYear,
        retainedEarningsAccountId: Number(retainedEarningsAccountId),
        userId,
      });

      // تسجيل الحدث في الـ Audit Log للحوكمة
      await prisma.auditLog.create({
        data: {
          tenantId,
          action: 'YEAR_END_CLOSE_POSTED',
          entityType: 'FiscalYear',
          entityId: fiscalYear,
          userId: Number(userId) || undefined,
          metadata: {
            fiscalYear,
            retainedEarningsAccountId,
            journalEntryId: result.journalEntryId,
            netIncome: result.netIncome.toString(),
          },
        },
      });

      return NextResponse.json({
        message: `تم ترحيل قيد الإقفال السنوي المجمع للسنة ${fiscalYear} بنجاح.`,
        ...result,
      });
    }

    // ب. تدوير وتوليد الأرصدة الافتتاحية للسنة الجديدة
    if (action === 'ROLLOVER_BALANCES') {
      const nextYear = String(parseInt(fiscalYear, 10) + 1);

      const result = await YearEndCloseEngine.rolloverOpeningBalances({
        tenantId,
        fromFiscalYear: fiscalYear,
        toFiscalYear: nextYear,
        userId,
      });

      // تسجيل الحدث في الـ Audit Log للحوكمة
      await prisma.auditLog.create({
        data: {
          tenantId,
          action: 'YEAR_END_ROLLOVER_COMPLETED',
          entityType: 'FiscalYear',
          entityId: fiscalYear,
          userId: Number(userId) || undefined,
          metadata: {
            fromFiscalYear: fiscalYear,
            toFiscalYear: nextYear,
            openingBalancesCount: result.openingBalancesCount,
          },
        },
      });

      return NextResponse.json({
        message: `تم تدوير الأرصدة الافتتاحية بنجاح من السنة ${fiscalYear} إلى السنة الجديدة ${nextYear}.`,
        ...result,
      });
    }

    return NextResponse.json({ error: 'الإجراء المطلوب غير صالح' }, { status: 400 });
  } catch (error: any) {
    log.error('POST /api/accounting/year-end-close failed', { error: error.message });
    return NextResponse.json({ error: error.message || 'حدث خطأ داخلي' }, { status: 500 });
  }
}
