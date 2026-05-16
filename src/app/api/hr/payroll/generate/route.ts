import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant } from '@/lib/security/tenant-guard';
import { EnterpriseLogger } from '@/lib/observability/logger';

const log = logger.child({ service: 'hr.payroll.generate' });

const GeneratePayrollSchema = z.object({
  month: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).refine(v => v >= 1 && v <= 12, 'الشهر 1-12'),
  year:  z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).refine(v => v >= 2020 && v <= 2099, 'السنة غير صالحة'),
});

async function _POST(request: Request, auth: any) {
    const prisma = getPrisma(request);
    const tenantId = assertTenant(auth?.tenantId);

    try {
        const raw    = await request.json();
        const parsed = GeneratePayrollSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { month, year } = parsed.data;

        const employees = await prisma.employee.findMany({ take: 100,
            where: { tenantId, active: true }
        });

        if (employees.length === 0) {
            return NextResponse.json({ error: 'لا يوجد موظفين نشطين' }, { status: 400 });
        }

        const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-31`; 

        const attendances = await prisma.attendance.findMany({ take: 100,
            where: {
                tenantId,
                date: { gte: startDateStr, lte: endDateStr }
            }
        });

        const activeLoans = await prisma.employeeLoan.findMany({ take: 100,
            where: { tenantId, status: 'active', remainingAmount: { gt: 0 } }
        });

        let totalGrossSalaries = 0;
        let generatedRecords = 0;

        await runFinancialTx(prisma, async (tx: any) => {
            const existing = await tx.salary.findFirst({
                where: { tenantId, month, year }
            });

            if (existing) {
                throw new Error(`مسير الرواتب لشهر ${month}/${year} تم إنشاؤه مسبقاً.`);
            }

            for (const emp of employees) {
                const empAttendance = attendances.filter(a => a.employeeId === emp.id);
                const attendedDays = empAttendance.length;
                
                let absentDays = 22 - attendedDays;
                if (absentDays < 0) absentDays = 0; 

                const baseSalary = n(emp.salary);
                
                const dailyRate = baseSalary / 30;
                const absencePenalty = absentDays > 0 ? (dailyRate * absentDays) : 0;
                
                const gosiDeduction = baseSalary * 0.09;

                let loanDeduction = 0;
                const empLoans = activeLoans.filter((l: any) => l.employeeId === emp.id);
                for (const loan of empLoans) {
                    const toDeduct = Math.min(n(loan.monthlyDeduction), n(loan.remainingAmount));
                    loanDeduction += toDeduct;
                    
                    await tx.employeeLoan.update({
                        where: { id: loan.id, tenantId },
                        data: {
                            remainingAmount: { decrement: toDeduct },
                            status: (n(loan.remainingAmount) - toDeduct) <= 0 ? 'paid' : 'active'
                        }
                    });
                }

                const totalDeductions = absencePenalty + gosiDeduction + loanDeduction;
                const totalAdditions = 0;

                const netSalary = baseSalary + totalAdditions - totalDeductions;

                if (netSalary < 0) continue; 

                await tx.salary.create({
                    data: {
                        tenantId,
                        employeeId: emp.id,
                        month,
                        year,
                        basicSalary: baseSalary,
                        additions: totalAdditions,
                        deductions: totalDeductions,
                        gosiDeduction,
                        loanDeduction,
                        netSalary,
                        paidDate: new Date(),
                        notes: `غياب: ${absencePenalty.toFixed(2)}, تأمينات: ${gosiDeduction.toFixed(2)}, سلف: ${loanDeduction.toFixed(2)}`
                    }
                });

                totalGrossSalaries += netSalary;
                generatedRecords++;
            }

            if (totalGrossSalaries > 0) {
                const salaryAcc = await tx.account.findFirst({ where: { tenantId, code: '5200' } });
                const bankAcc = await tx.account.findFirst({ where: { tenantId, code: '1120' } });

                if (!salaryAcc || !bankAcc) throw new Error('لا يمكن تسجيل القيد: حسابات الرواتب أو البنك غير معرّفة');

                const jEntry = await tx.journalEntry.create({
                    data: {
                        tenantId,
                        entryNumber: `PAY-${year}-${month}`,
                        entryDate: new Date().toISOString().split('T')[0],
                        description: `قيد مسير رواتب الموظفين لشهر ${month}/${year}`,
                        reference: 'AUTO_PAYROLL',
                        totalDebit: totalGrossSalaries,
                        totalCredit: totalGrossSalaries, 
                        status: 'posted',
                        lines: {
                            create: [
                                { tenantId, accountId: salaryAcc.id, debit: totalGrossSalaries, credit: 0, description: `إجمالي رواتب شهر ${month}` },
                                { tenantId, accountId: bankAcc.id, debit: 0, credit: totalGrossSalaries, description: `دفع مسير رواتب شهر ${month}` }
                            ]
                        }
                    }
                });
                
                // Account balances should be updated by the FinancialPolicyEngine, but since we are modifying legacy code,
                // we will maintain the direct update logic within the atomic transaction.
                await tx.account.update({
                    where: { id: salaryAcc.id, tenantId },
                    data: { balance: { increment: totalGrossSalaries } }
                });
                await tx.account.update({
                    where: { id: bankAcc.id, tenantId },
                    data: { balance: { decrement: totalGrossSalaries } }
                });
            }
            
            EnterpriseLogger.traceFinancialTx(
                `PAYROLL_GENERATE_${year}_${month}`,
                'PAYROLL_GENERATED',
                tenantId,
                { month, year, generatedRecords, totalGrossSalaries }
            );
        }, 'PAYROLL_GENERATE');

        return NextResponse.json({ 
            success: true, 
            message: `تم اعتماد مسير الرواتب بنجاح وإصدار أوامر التحويل لعدد ${generatedRecords} موظفين بقيمة إجمالية ${totalGrossSalaries.toLocaleString('en-SA', { minimumFractionDigits: 2 })} ر.س. مضافة للقيد المحاسبي.` 
        }, { status: 201 });

    } catch (error: any) {
        EnterpriseLogger.error("Payroll generate error", { tenantId: auth?.tenantId }, error);
        return apiError(error, 'فشل توليد مسير الرواتب', { context: 'hr/payroll/generate' });
    }
}

export const POST = withRoute(async ({ req, auth }) => _POST(req as any, auth), { rateLimit: 'FINANCIAL', roles: ['admin', 'owner', 'hr'] });
