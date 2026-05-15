import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * GOSI (التأمينات الاجتماعية) Payroll Deductions API
 * GET  /api/hr/gosi — ملخص اشتراكات GOSI للشهر
 * POST /api/hr/gosi — احتساب اشتراكات الشهر الحالي
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.gosi' });

// معدلات GOSI السعودية 2024
const GOSI_RATES = {
    saudiEmployee: 0.10,      // موظف سعودي: 10% على الموظف
    saudiEmployer: 0.12,      // موظف سعودي: 12% على صاحب العمل
    expat: 0.02,              // موظف غير سعودي: 2% فقط على صاحب العمل
    hazardSaudi: 0.02,        // مخاطر مهنية: 2% على صاحب العمل
};

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    try {
        const employees = await prisma.employee.findMany({ take: 100,
            where: { active: true },
            select: {
                id: true, name: true,
                salary: true, position: true,
            },
        });

        const summary = employees.map((emp: any) => {
            // Default to Saudi — nationality field not in schema; extend schema to add it
            const isSaudi = true;
            const baseSalary = n(emp.salary);

            const employeeDeduction = isSaudi ? baseSalary * GOSI_RATES.saudiEmployee : 0;
            const employerContribution = isSaudi
                ? baseSalary * (GOSI_RATES.saudiEmployer + GOSI_RATES.hazardSaudi)
                : baseSalary * GOSI_RATES.expat;
            const totalGosi = employeeDeduction + employerContribution;

            return {
                employeeId: emp.id,
                name: emp.name,
                nationality: emp.nationality || 'سعودي',
                isSaudi,
                baseSalary,
                employeeDeduction: Math.round(employeeDeduction * 100) / 100,
                employerContribution: Math.round(employerContribution * 100) / 100,
                totalGosi: Math.round(totalGosi * 100) / 100,
            };
        });

        const totals = {
            totalEmployeeDeductions: summary.reduce((s: number, e: any) => s + e.employeeDeduction, 0),
            totalEmployerContributions: summary.reduce((s: number, e: any) => s + e.employerContribution, 0),
            totalGosi: summary.reduce((s: number, e: any) => s + e.totalGosi, 0),
            saudiCount: summary.filter((e: any) => e.isSaudi).length,
            expatCount: summary.filter((e: any) => !e.isSaudi).length,
        };

        return NextResponse.json({ month, year, employees: summary, totals });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'خطأ في احتساب GOSI' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  month: z.union([z.string(), z.number()]).optional(),
  year: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const month = parseInt(body.month) || new Date().getMonth() + 1;
        const year = parseInt(body.year) || new Date().getFullYear();

        const employees = await prisma.employee.findMany({ take: 100,
            where: { active: true },
            select: { id: true, name: true, salary: true },
        });

        const { runFinancialTx } = await import('@/lib/db/transaction');
        const { AccountingJournalService } = await import('@/lib/services/accounting-journal.service');

        let totalEmployerContrib = 0;

        await runFinancialTx(prisma, async (tx) => {
            // Update each employee's salary record with GOSI deductions
            for (const emp of employees) {
                const isSaudi = true; // default — add nationality field to schema when needed
                const baseSalary = n(emp.salary);
                const empDeduction = isSaudi ? baseSalary * GOSI_RATES.saudiEmployee : 0;
                const empContrib = isSaudi
                    ? baseSalary * (GOSI_RATES.saudiEmployer + GOSI_RATES.hazardSaudi)
                    : baseSalary * GOSI_RATES.expat;

                totalEmployerContrib += empContrib;

                // Update salary record if exists
                const salaryRecord = await tx.salary.findFirst({
                    where: { employeeId: emp.id, month, year },
                });
                if (salaryRecord) {
                    await tx.salary.update({
                        where: { id: salaryRecord.id },
                        data: {
                            deductions: { increment: Math.round(empDeduction * 100) / 100 },
                        },
                    });
                }
            }

            // Post GOSI journal entry (employer contribution = expense)
            const entryNo = `GOSI-${year}-${String(month).padStart(2,'0')}`;
            await AccountingJournalService.createEntry(tx, {
                description: `اشتراكات التأمينات الاجتماعية GOSI — ${month}/${year}`,
                reference: entryNo,
                userId: user.userId,
                lines: [
                    {
                        accountId: 1, // مصروف التأمينات
                        description: `GOSI صاحب العمل ${month}/${year}`,
                        debit: Math.round(totalEmployerContrib * 100) / 100,
                        credit: 0,
                    },
                    {
                        accountId: 2, // التأمينات المستحقة
                        description: `GOSI مستحق ${month}/${year}`,
                        debit: 0,
                        credit: Math.round(totalEmployerContrib * 100) / 100,
                    },
                ],
            });
        }, `gosi-payroll-${month}-${year}`);

        return NextResponse.json({
            success: true,
            message: `تم احتساب اشتراكات GOSI لـ ${employees.length} موظف`,
            totalEmployerContrib: Math.round(totalEmployerContrib * 100) / 100,
            month, year,
        });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'خطأ في تسجيل GOSI' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
