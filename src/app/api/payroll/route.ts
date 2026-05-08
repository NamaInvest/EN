/**
 * Payroll API Route (HR Module 27)
 * GET  /api/payroll?action=payslip&employeeId=x&period=YYYY-MM
 * POST /api/payroll?action=run           → Run payroll for period
 * POST /api/payroll?action=create-loan   → Create employee loan
 * POST /api/payroll?action=wps           → Generate WPS file
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { PayrollService } from '@/services/hr/payroll.service';
import { BusinessContext } from '@/services/shared/event-bus.service';

function buildCtx(req: NextRequest): BusinessContext {
  return {
    tenant: { id: req.headers.get('x-tenant-id') ?? 'default' },
    user:   { id: req.headers.get('x-user-id')   ?? 'system' },
    requirePermission: () => {},
    fiscal: { isClosed: false },
  } as unknown as BusinessContext;
}

export async function GET(req: NextRequest) {
  try {
    const prisma  = getPrisma(req);
    const ctx     = buildCtx(req);
    const service = new PayrollService(prisma as any, ctx);
    const { searchParams } = req.nextUrl;
    const action  = searchParams.get('action') ?? 'payslip';

    if (action === 'payslip') {
      const employeeId = searchParams.get('employeeId');
      const period     = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
      if (!employeeId) {
        return NextResponse.json({ error: 'مطلوب: employeeId' }, { status: 400 });
      }
      const payslip = await service.calculatePayslip(employeeId, period);
      return NextResponse.json(payslip);
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const prisma  = getPrisma(req);
    const ctx     = buildCtx(req);
    const service = new PayrollService(prisma as any, ctx);
    const { searchParams } = req.nextUrl;
    const action  = searchParams.get('action') ?? '';
    const body    = await req.json();

    if (action === 'run') {
      const { period } = body;
      if (!period) {
        return NextResponse.json({ error: 'مطلوب: period (YYYY-MM)' }, { status: 400 });
      }
      const result = await service.runPayroll(period);
      return NextResponse.json(result);
    }

    if (action === 'create-loan') {
      const { employeeId, principal, interestRate = 0, termMonths, startDate, purpose } = body;
      if (!employeeId || !principal || !termMonths) {
        return NextResponse.json({ error: 'مطلوب: employeeId, principal, termMonths' }, { status: 400 });
      }
      const result = await service.createLoan({
        employeeId,
        principal:    Number(principal),
        interestRate: Number(interestRate),
        termMonths:   Number(termMonths),
        startDate:    new Date(startDate ?? Date.now()),
        approvedBy:   ctx.user.id,
        purpose,
      });
      return NextResponse.json(result);
    }

    if (action === 'wps') {
      const { payslips, employerIBAN } = body;
      if (!payslips?.length || !employerIBAN) {
        return NextResponse.json({ error: 'مطلوب: payslips[], employerIBAN' }, { status: 400 });
      }
      const wpsFile = service.generateWPSFile(payslips, employerIBAN);
      return new NextResponse(wpsFile, {
        headers: {
          'Content-Type':        'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="wps-${body.payslips[0]?.period ?? 'payroll'}.txt"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'action غير معروف. استخدم: run | create-loan | wps' },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
