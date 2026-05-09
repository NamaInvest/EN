import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';

const GeneratePayrollSchema = z.object({
  month: z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).refine(v => v >= 1 && v <= 12, 'الشهر 1-12'),
  year:  z.union([z.string(), z.number()]).transform(v => parseInt(String(v))).refine(v => v >= 2020 && v <= 2099, 'السنة غير صالحة'),
});

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const raw    = await request.json();
        const parsed = GeneratePayrollSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { month, year } = parsed.data;

        // 1. Fetch all active employees
        const employees = await prisma.employee.findMany({
            take: 100,
            where: { active: true }
        });

        if (employees.length === 0) {
            return NextResponse.json({ error: 'لا يوجد موظفين نشطين' }, { status: 400 });
        }

        // 2. Fetch all attendance records for the given month/year
        const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-31`; // Approx

        const attendances = await prisma.attendance.findMany({
            take: 100,
            where: {
                date: { gte: startDateStr, lte: endDateStr }
            }
        });

        const activeLoans = await prisma.employeeLoan.findMany({
            take: 100,
            where: { status: 'active', remainingAmount: { gt: 0 } }
        });

        let totalGrossSalaries = 0;
        let generatedRecords = 0;

        await prisma.$transaction(async (tx) => {
            // First check if payroll was already generated
            const existing = await tx.salary.findFirst({
                where: { month, year }
            });

            if (existing) {
                throw new Error(`مسير الرواتب لشهر ${month}/${year} تم إنشاؤه مسبقاً.`);
            }

            for (const emp of employees) {
                const empAttendance = attendances.filter(a => a.employeeId === emp.id);
                const attendedDays = empAttendance.length;
                
                // Assuming standard 22 working days per month for absence calculation
                // Over-simplified for demonstration: Unpaid absences penalty
                let absentDays = 22 - attendedDays;
                if (absentDays < 0) absentDays = 0; // Overtime can be handled separately

                const baseSalary = n(emp.salary);
                
                // Deductions: 1 Day salary per absent day
                const dailyRate = baseSalary / 30;
                const absencePenalty = absentDays > 0 ? (dailyRate * absentDays) : 0;
                
                // Standard GOSI (Social Insurance) deduction demo (e.g. 9% of Base)
                const gosiDeduction = baseSalary * 0.09;

                let loanDeduction = 0;
                const empLoans = activeLoans.filter((l: any) => l.employeeId === emp.id);
                for (const loan of empLoans) {
                    const toDeduct = Math.min(n(loan.monthlyDeduction), n(loan.remainingAmount));
                    loanDeduction += toDeduct;
                    
                    // Update the loan balance
                    await tx.employeeLoan.update({
                        where: { id: loan.id },
                        data: {
                            remainingAmount: { decrement: toDeduct },
                            status: (n(loan.remainingAmount) - toDeduct) <= 0 ? 'paid' : 'active'
                        }
                    });
                }

                const totalDeductions = absencePenalty + gosiDeduction + loanDeduction;

                // Additions
                const totalAdditions = 0;

                const netSalary = baseSalary + totalAdditions - totalDeductions;

                if (netSalary < 0) continue; // Skip anomaly computations safely

                // Generate Individual Payslip record
                await tx.salary.create({
                    data: {
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
                // Fetch dynamic Account IDs for Salaries and Bank
                const salaryAcc = await tx.account.findFirst({ where: { code: '5200' } });
                const bankAcc = await tx.account.findFirst({ where: { code: '1120' } });

                if (!salaryAcc || !bankAcc) throw new Error('لا يمكن تسجيل القيد: حسابات الرواتب أو البنك غير معرّفة');

                // Post Macro Journal Entry
                const jEntry = await tx.journalEntry.create({
                    data: {
                        entryNumber: `PAY-${year}-${month}`,
                        entryDate: new Date().toISOString().split('T')[0],
                        description: `قيد مسير رواتب الموظفين لشهر ${month}/${year}`,
                        reference: 'AUTO_PAYROLL',
                        totalDebit: totalGrossSalaries,
                        totalCredit: totalGrossSalaries,
                        status: 'posted',
                        lines: {
                            create: [
                                { accountId: salaryAcc.id, debit: totalGrossSalaries, credit: 0, description: `إجمالي رواتب شهر ${month}` },
                                { accountId: bankAcc.id, debit: 0, credit: totalGrossSalaries, description: `دفع مسير رواتب شهر ${month}` }
                            ]
                        }
                    }
                });

                // Update account balances
                await tx.account.update({
                    where: { id: salaryAcc.id },
                    data: { balance: { increment: totalGrossSalaries } }
                });
                await tx.account.update({
                    where: { id: bankAcc.id },
                    data: { balance: { decrement: totalGrossSalaries } }
                });
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `تم اعتماد مسير الرواتب بنجاح وإصدار أوامر التحويل لعدد ${generatedRecords} موظفين بقيمة إجمالية ${totalGrossSalaries.toLocaleString('en-SA', { minimumFractionDigits: 2 })} ر.س. مضافة للقيد المحاسبي.` 
        }, { status: 201 });

    } catch (error: any) {
        console.error("Payroll Error:", error);
        return apiError(error, 'فشل توليد مسير الرواتب', { context: 'hr/payroll/generate' });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
