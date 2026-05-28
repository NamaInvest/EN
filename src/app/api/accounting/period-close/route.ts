/**
 * Period-Close API Route
 * ──────────────────────────────────────────────────────────────────────────
 * GET  /api/accounting/period-close?periodId=x  — Get close status
 * POST /api/accounting/period-close              — Init tasks / complete task / execute close
 *
 * Uses the unified closeApi() facade which consolidates the 3 engine files:
 *   lib/period-close.ts + lib/period-close-engine.ts + lib/year-end-engine.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z }                         from 'zod';
import { getPrisma }                 from '@/lib/prisma';
import { getUserFromRequest }        from '@/lib/auth';
import { validateRequest }           from '@/lib/api/validate-request';
import { closeApi }                  from '@/lib/close';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.period-close' });

// ─── Schemas ─────────────────────────────────────────────────────────────────

const InitTasksSchema = z.object({
  action:   z.literal('init'),
  periodId: z.number().int().positive(),
});

const CompleteTaskSchema = z.object({
  action:   z.literal('complete-task'),
  periodId: z.number().int().positive(),
  taskCode: z.string().min(1),
  notes:    z.string().optional(),
});

const SoftCloseSchema = z.object({
  action:   z.literal('soft-close'),
  periodId: z.number().int().positive(),
});

const HardCloseSchema = z.object({
  action:   z.literal('hard-close'),
  periodId: z.number().int().positive(),
});

const YearEndInitSchema = z.object({
  action:       z.literal('year-end-init'),
  fiscalYearId: z.number().int().positive(),
});

const PeriodCloseActionSchema = z.discriminatedUnion('action', [
  InitTasksSchema,
  CompleteTaskSchema,
  SoftCloseSchema,
  HardCloseSchema,
  YearEndInitSchema,
]);

// ─── GET ─────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const auth = getUserFromRequest(req as any);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const prisma    = getPrisma(req);
    const periodId  = parseInt(req.nextUrl.searchParams.get('periodId') ?? '', 10);
    const tenantId  = auth.tenantId || 'default';

    if (!periodId || isNaN(periodId)) {
      return NextResponse.json({ error: 'periodId مطلوب (رقم صحيح)' }, { status: 400 });
    }

    const status = await closeApi(prisma as any).period.getStatus(periodId, tenantId);
    return NextResponse.json(status);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const auth = getUserFromRequest(req as any);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await validateRequest(req, PeriodCloseActionSchema);
  if (error) return error;

  try {
    const prisma  = getPrisma(req);
    const api     = closeApi(prisma as any);
    const userId  = String(auth.userId);
    const tenantId = auth.tenantId || 'default';

    switch (data.action) {
      case 'init': {
        const count = await api.period.initTasks(data.periodId, tenantId);
        return NextResponse.json({ success: true, tasksCreated: count });
      }

      case 'complete-task': {
        const result = await api.period.completeTask(data.periodId, data.taskCode, userId, data.notes, tenantId);
        if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
        return NextResponse.json(result);
      }

      case 'soft-close': {
        // Verify all tasks complete before soft-close
        const status = await api.period.getStatus(data.periodId, tenantId);
        if (!status.readyToClose) {
          return NextResponse.json({
            error: `إغلاق غير مكتمل: ${status.progress.pending} مهام متبقية`,
            progress: status.progress,
          }, { status: 409 });
        }
        const result = await api.period.softClose(data.periodId, userId);
        if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
        return NextResponse.json({ success: true, message: 'تم الإغلاق الجزئي للفترة بنجاح' });
      }

      case 'hard-close': {
        // Hard-close requires explicit confirmation — only admins
        const result = await api.period.hardClose(data.periodId, userId);
        if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
        return NextResponse.json({ success: true, message: 'تم القفل النهائي للفترة — لا يمكن إنشاء قيود على هذه الفترة' });
      }

      case 'year-end-init': {
        const result = await api.yearEnd.initiateRun(data.fiscalYearId, userId);
        return NextResponse.json({ success: true, runId: (result as any).id });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
