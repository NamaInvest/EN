/**
 * Year-End Close API — Full wizard endpoints
 *
 * GET  /api/accounting/year-end-close/validate?fiscalYearId=X
 * GET  /api/accounting/year-end-close/checklist?fiscalYearId=X
 * POST /api/accounting/year-end-close/preview-je
 * POST /api/accounting/year-end-close/post-je
 * POST /api/accounting/year-end-close/rollover-balances
 * POST /api/accounting/year-end-close/lock-year
 * POST /api/accounting/year-end-close/generate-reports
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { validateRequest } from '@/lib/api/validate-request';
import { YearEndCloseEngine } from '@/lib/year-end-close';

const CLOSE_ROLES = ['admin', 'owner', 'cfo', 'finance'];

const PostJESchema = z.object({
  fiscalYearId:             z.number().int().positive(),
  retainedEarningsAccountId: z.number().int().positive(),
  confirmToken:              z.literal('أؤكد', { error: 'يجب كتابة "أؤكد" للتأكيد' }),
});

const RolloverSchema = z.object({
  fromFiscalYearId: z.number().int().positive(),
  toFiscalYearId:   z.number().int().positive(),
  confirmToken:     z.literal('أؤكد', { error: 'يجب كتابة "أؤكد" للتأكيد' }),
});

const LockSchema = z.object({
  fiscalYearId: z.number().int().positive(),
  confirmToken: z.literal('أؤكد', { error: 'يجب كتابة "أؤكد" للتأكيد' }),
});

// GET /validate?fiscalYearId=X
export const GET = withRoute(async ({ req, prisma, auth }) => {
  if (!CLOSE_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const path         = req.nextUrl.pathname;
  const fiscalYearId = parseInt(req.nextUrl.searchParams.get('fiscalYearId') ?? '0');
  if (!fiscalYearId) return NextResponse.json({ error: 'fiscalYearId مطلوب' }, { status: 400 });

  if (path.endsWith('/validate')) {
    const result = await YearEndCloseEngine.validateYearReadiness(prisma as any, fiscalYearId);
    return NextResponse.json(result);
  }

  if (path.endsWith('/checklist')) {
    const checklist = await YearEndCloseEngine.buildChecklist(prisma as any, fiscalYearId);
    return NextResponse.json({ checklist, total: checklist.length, done: checklist.filter((t: any) => t.status === 'DONE').length });
  }

  if (path.endsWith('/preview-je')) {
    const preview = await YearEndCloseEngine.previewClosingJE(prisma as any, fiscalYearId);
    return NextResponse.json(preview);
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}, { rateLimit: 'FINANCIAL' });

// POST — dispatches to correct action via URL segment
export const POST = withRoute(async ({ req, prisma, auth }) => {
  if (!CLOSE_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const path = req.nextUrl.pathname;

  if (path.endsWith('/post-je')) {
    const { data: body, error } = await validateRequest(req, PostJESchema);
    if (error) return error;

    const result = await YearEndCloseEngine.postClosingJE(prisma as any, body.fiscalYearId, body.retainedEarningsAccountId, auth.userId);
    return NextResponse.json({ success: true, journalEntryId: result.id, linesCount: result.linesCount }, { status: 201 });
  }

  if (path.endsWith('/rollover-balances')) {
    const { data: body, error } = await validateRequest(req, RolloverSchema);
    if (error) return error;

    const result = await YearEndCloseEngine.rolloverOpeningBalances(prisma as any, body.fromFiscalYearId, body.toFiscalYearId, auth.userId);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  }

  if (path.endsWith('/lock-year')) {
    const { data: body, error } = await validateRequest(req, LockSchema);
    if (error) return error;

    await YearEndCloseEngine.lockFiscalYear(prisma as any, body.fiscalYearId, auth.userId);
    return NextResponse.json({ success: true, message: 'السنة المالية مقفلة نهائياً' });
  }

  if (path.endsWith('/generate-reports')) {
    const body = await req.json();
    if (!body?.fiscalYearId) return NextResponse.json({ error: 'fiscalYearId مطلوب' }, { status: 400 });

    const result = await YearEndCloseEngine.generateClosingReports(prisma as any, body.fiscalYearId, auth.userId);
    return NextResponse.json({ success: true, ...result });
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}, { rateLimit: 'FINANCIAL' });
