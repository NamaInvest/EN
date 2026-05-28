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
import { logger } from '@/lib/logger';
import { FinancialPeriodService } from '@/services/accounting/financial-period.service';

const log = logger.child({ service: 'payroll' });

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

const CreatePayslipSchema = z.object({
  employeeId: z.number().int().positive('employeeId required'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'period must be YYYY-MM format'),
  details: z.array(z.object({
    description: z.string().min(1, 'description required'),
    amount: z.union([z.string(), z.number()]).transform(v => Number(v)),
    type: z.enum(['addition', 'deduction']),
    loanId: z.number().int().positive().optional(),
  })).min(1, 'details required'),
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

  let isCreatePayslip = action === 'create-payslip';
  if (action === '') {
    try {
      const clonedReq = req.clone();
      const json = await clonedReq.json();
      if (json && 'employeeId' in json && 'details' in json) {
        isCreatePayslip = true;
      }
    } catch (err) {
      // ignore
    }
  }

  try {
    const prisma  = getPrisma(req);
    const ctx     = buildCtx(req, auth);
    const service = new PayrollService(prisma as any, ctx);

    // ── action: create-payslip or empty default ───────────────────────────
    if (isCreatePayslip) {
      const { data, error } = await validateRequest(req, CreatePayslipSchema);
      if (error) return error;

      const [periodYear, periodMonth] = data.period.split('-').map(Number);
      const payrollDate = new Date(periodYear, periodMonth, 0);

      // Validate Employee
      const employee = await prisma.employee.findFirst({
        where: { id: data.employeeId, tenantId },
      });
      if (!employee) {
        return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
      }

      // Calculate Net Salary & Summarize Deductions
      let totalAddition = 0;
      let totalDeduction = 0;
      let loanDeductionsAmount = 0;
      let absenceDeductionsAmount = 0;

      for (const item of data.details) {
        if (item.type === 'addition') {
          totalAddition += item.amount;
        } else if (item.type === 'deduction') {
          totalDeduction += item.amount;
          if (item.loanId) {
            loanDeductionsAmount += item.amount;
          } else if (item.description.includes('غياب')) {
            absenceDeductionsAmount += item.amount;
          }
        }
      }
      const netTotal = Math.max(0, totalAddition - totalDeduction);

      // Atomic Payroll Processing
      const result = await prisma.$transaction(async (tx: any) => {
        // Enforce Financial Period lock
        const periodService = new FinancialPeriodService(tx, { tenant: { id: tenantId } } as any);
        await periodService.requireOpenPeriod(payrollDate);

        // Application-level duplicate guard until a DB unique constraint is approved later
        const existingInvoice = await tx.payrollInvoice.findFirst({
          where: {
            tenantId,
            employeeId: data.employeeId,
            period: data.period,
          },
        });
        if (existingInvoice) {
          throw new Error('DUPLICATE_PAYSLIP');
        }

        // A. Create the Payroll Invoice Header
        const invoice = await tx.payrollInvoice.create({
          data: {
            tenantId,
            invoiceNo: `PR-${Math.floor(100000 + Math.random() * 900000)}`,
            period: data.period,
            total: netTotal,
            employeeId: data.employeeId,
          },
        });

        // B. Persist Line Items & Update Loans
        const lineItems = await Promise.all(data.details.map(async (item: any) => {
          // If it's a loan deduction, update the EmployeeLoan remaining balance
          if (item.type === 'deduction' && item.loanId) {
            const loan = await tx.employeeLoan.findUnique({
              where: { id: item.loanId, tenantId },
            });
            if (loan) {
              const newBalance = Math.max(0, Number(loan.remainingAmount) - item.amount);
              await tx.employeeLoan.update({
                where: { id: item.loanId, tenantId },
                data: {
                  remainingAmount: newBalance,
                  status: newBalance <= 0 ? 'paid' : 'active',
                },
              });
            }
          }

          return tx.payrollInvoiceDetail.create({
            data: {
              tenantId,
              invoiceId: invoice.id,
              description: item.description,
              amount: item.amount,
              type: item.type,
            },
          });
        }));

        // C. Register ZATCA Compliance Record
        const zatcaRecord = await tx.zATCARecord.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
            invoiceType: 'PAYROLL',
            status: 'pending',
          },
        });

        return { invoice, lineItems, zatcaRecord };
      });

      let msg = `تم صرف الراتب بنجاح! الصافي المستحق: ${netTotal.toFixed(2)} ريال.`;
      if (loanDeductionsAmount > 0 || absenceDeductionsAmount > 0) {
        msg += ' (تم خصم:';
        if (loanDeductionsAmount > 0) msg += ` ${loanDeductionsAmount.toFixed(2)} سداد سلفة`;
        if (absenceDeductionsAmount > 0) msg += `${loanDeductionsAmount > 0 ? ' و' : ''} ${absenceDeductionsAmount.toFixed(2)} غياب`;
        msg += ')';
      }

      return NextResponse.json({
        success: true,
        message: msg,
        data: result,
      }, { status: 201 });
    }

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
    if (e.message === 'DUPLICATE_PAYSLIP') {
      return NextResponse.json({ error: 'تم إصدار مسير رواتب بالفعل لهذا الموظف في هذه الفترة المالية' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', module: 'payroll', permission: 'view' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', module: 'payroll', permission: 'add' });
