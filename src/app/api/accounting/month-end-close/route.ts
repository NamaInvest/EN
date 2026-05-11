import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { MonthEndCloseEngine } from '@/lib/month-end-close-engine';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const InitSchema = z.object({
  tenantId: z.string(),
  year:     z.number().int().min(2020).max(2099),
  month:    z.number().int().min(1).max(12),
  userId:   z.number().int().positive(),
});

const CompleteTaskSchema = z.object({
  tenantId: z.string(),
  period:   z.string().regex(/^\d{4}-\d{2}$/, 'format: YYYY-MM'),
  taskCode: z.string(),
  userId:   z.number().int().positive(),
  details:  z.record(z.string(), z.any()).optional(),
});

const ExecuteSchema = z.object({
  tenantId: z.string(),
  period:   z.string().regex(/^\d{4}-\d{2}$/, 'format: YYYY-MM'),
  taskCode: z.string(),
  userId:   z.number().int().positive(),
});

const LockSchema = z.object({
  tenantId: z.string(),
  period:   z.string().regex(/^\d{4}-\d{2}$/, 'format: YYYY-MM'),
  userId:   z.number().int().positive(),
});

// ─── GET — status of a close run ─────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const period   = searchParams.get('period');

  if (!tenantId || !period) {
    return NextResponse.json({ error: 'tenantId and period (YYYY-MM) required' }, { status: 400 });
  }

  const run = await MonthEndCloseEngine.getRunStatus(tenantId, period);
  if (!run) {
    return NextResponse.json({ error: `No close run for period ${period}` }, { status: 404 });
  }

  return NextResponse.json(run);
}

// ─── POST — actions ───────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const action = body.action as string;

  // Initialize close run
  if (action === 'init') {
    const p = InitSchema.safeParse(body);
    if (!p.success) return NextResponse.json({ error: p.error.flatten().fieldErrors }, { status: 400 });
    const run = await MonthEndCloseEngine.initializeRun(
      p.data.tenantId, p.data.year, p.data.month, p.data.userId,
    );
    return NextResponse.json(run, { status: 201 });
  }

  // Complete a manual task
  if (action === 'complete-task') {
    const p = CompleteTaskSchema.safeParse(body);
    if (!p.success) return NextResponse.json({ error: p.error.flatten().fieldErrors }, { status: 400 });
    const task = await MonthEndCloseEngine.completeTask(
      p.data.tenantId, p.data.period, p.data.taskCode, p.data.userId, p.data.details,
    );
    return NextResponse.json(task);
  }

  // Execute an automated task
  if (action === 'execute-task') {
    const p = ExecuteSchema.safeParse(body);
    if (!p.success) return NextResponse.json({ error: p.error.flatten().fieldErrors }, { status: 400 });
    const result = await MonthEndCloseEngine.executeAutomatedTask(
      p.data.tenantId, p.data.period, p.data.taskCode, p.data.userId,
    );
    const status = result.success ? 200 : 422;
    return NextResponse.json(result, { status });
  }

  // Lock the period
  if (action === 'lock-period') {
    const p = LockSchema.safeParse(body);
    if (!p.success) return NextResponse.json({ error: p.error.flatten().fieldErrors }, { status: 400 });
    await MonthEndCloseEngine.lockPeriod(p.data.tenantId, p.data.period, p.data.userId);
    return NextResponse.json({ success: true, message: `الفترة ${p.data.period} مقفولة` });
  }

  return NextResponse.json({
    error:   'action غير صحيح',
    options: ['init', 'complete-task', 'execute-task', 'lock-period'],
  }, { status: 400 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
