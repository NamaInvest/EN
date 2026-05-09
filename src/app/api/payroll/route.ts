/**
 * Payroll API Route — Hardened
 * GET  /api/payroll?action=payslip&employeeId=x&period=YYYY-MM
 * POST /api/payroll?action=run         — Run payroll for period
 * POST /api/payroll?action=create-loan — Create employee loan
 * POST /api/payroll?action=wps         — Generate WPS SIF file
 * POST /api/payroll?action=gosi        — Run GOSI batch for month
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma }           from '@/lib/prisma';
import { getUserFromRequest }   from '@/lib/auth';
import { PayrollService }       from '@/services/hr/payroll.service';
import { saudiCompliance }      from '@/lib/saudi-compliance';
import { validateRequest }      from '@/lib/api/validate-request';
import { BusinessContext }       from '@/services/shared/event-bus.service';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const RunPayrollSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'period must be YYYY-MM format'),
  branchId: z.number().int().positive().optional(),
});

const CreateLoanSchema = z.object({
  employeeId:   z.number().int().positive('employeeId required'),
  principal:    z.number().positive('principal must be positive'),
  termMonths:   z.number().int().min(1).max(120),
  interestRate: z.number().min(0).max(30).default(0),
  startDate:    z.string().optional(),
  purpose:      z.string().optional(),
});

const WpsSchema = z.object({
  payslips:     z.array(z.any()).min(1),
  employerIBAN: z.string().min(10, 'Invalid IBAN'),
});

const GosiSchema = z.object({
  year:  z.number().int().min(2020).max(2099),
  month: z.number().int().min(1).max(12),
});

// ─── Context builder ──────────────────────────────────────────────────────────

function buildCtx(req: NextRequest, auth: ReturnType<typeof getUserFromRequest>): BusinessContext {
  return {
    tenant:  { id: req.headers.get('x-tenant-id') ?? 'default' },
    user:    { id: String(auth?.userId ?? 'system') },
    requirePermission: () => {},
    fiscal:  { isClosed: false },
  } as unknown as BusinessContext;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const auth = getUserFromRequest(req as any);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const prisma   = getPrisma(req);
    const ctx      = buildCtx(req, auth);
    const service  = new PayrollService(prisma as any, ctx);
    const { searchParams } = req.nextUrl;
    const action   = searchParams.get('action') ?? 'payslip';
    const tenantId = req.headers.get('x-tenant-id') ?? 'default';

    if (action === 'payslip') {
      const employeeId = searchParams.get('employeeId');
      const period     = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
      if (!employeeId) return NextResponse.json({ error: 'employeeId مطلوب' }, { status: 400 });
      const payslip = await service.calculatePayslip(employeeId, period);
      return NextResponse.json(payslip);
    }

    if (action === 'gosi-status') {
      const compliance = saudiCompliance(prisma as any, tenantId);
      const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()), 10);
      const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);
      const result = await compliance.gosi.runMonthlyBatch(year, month);
      return NextResponse.json(result);
    }

    if (action === 'wps-status') {
      const compliance = saudiCompliance(prisma as any, tenantId);
      const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()), 10);
      const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);
      const status = await compliance.wps.generateSIF(year, month);
      return NextResponse.json({ records: status.records, totalAmount: status.totalAmount });
    }

    return NextResponse.json({ error: 'action غير معروف. استخدم: payslip | gosi-status | wps-status' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const auth = getUserFromRequest(req as any);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const action = searchParams.get('action') ?? '';
  const tenantId = req.headers.get('x-tenant-id') ?? 'default';

  try {
    const prisma  = getPrisma(req);
    const ctx     = buildCtx(req, auth);
    const service = new PayrollService(prisma as any, ctx);

    // ── action: run ────────────────────────────────────────────────────────
    if (action === 'run') {
      const { data, error } = await validateRequest(req, RunPayrollSchema);
      if (error) return error;

      const result = await service.runPayroll(data.period);
      return NextResponse.json(result, { status: 201 });
    }

    // ── action: create-loan ────────────────────────────────────────────────
    if (action === 'create-loan') {
      const { data, error } = await validateRequest(req, CreateLoanSchema);
      if (error) return error;

      const result = await service.createLoan({
        employeeId:   String(data.employeeId),
        principal:    data.principal,
        interestRate: data.interestRate,
        termMonths:   data.termMonths,
        startDate:    data.startDate ? new Date(data.startDate) : new Date(),
        approvedBy:   String(auth.userId),
        purpose:      data.purpose,
      });
      return NextResponse.json(result, { status: 201 });
    }

    // ── action: wps ────────────────────────────────────────────────────────
    if (action === 'wps') {
      const { data, error } = await validateRequest(req, WpsSchema);
      if (error) return error;

      const wpsFile = service.generateWPSFile(data.payslips, data.employerIBAN);
      return new NextResponse(wpsFile, {
        headers: {
          'Content-Type':        'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="wps-payroll.txt"`,
        },
      });
    }

    // ── action: gosi ───────────────────────────────────────────────────────
    if (action === 'gosi') {
      const { data, error } = await validateRequest(req, GosiSchema);
      if (error) return error;

      const compliance = saudiCompliance(prisma as any, tenantId);
      const result = await compliance.gosi.runMonthlyBatch(data.year, data.month);
      return NextResponse.json(result, { status: 201 });
    }

    // ── action: nitaqat ────────────────────────────────────────────────────
    if (action === 'nitaqat') {
      const compliance = saudiCompliance(prisma as any, tenantId);
      const status = await compliance.nitaqat.getStatus();
      return NextResponse.json(status, { status: 201 });
    }

    return NextResponse.json(
      { error: 'action غير معروف. استخدم: run | create-loan | wps | gosi | nitaqat' },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
