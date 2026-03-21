import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const month = parseInt(body.month);
        const year = parseInt(body.year);

        if (!month || !year) {
            return NextResponse.json({ error: 'الشهر والسنة مطلوبان' }, { status: 400 });
        }

        // 1. Fetch all active employees
        const employees = await prisma.employee.findMany({
            where: { active: true }
        });

        if (employees.length === 0) {
            return NextResponse.json({ error: 'لا يوجد موظفين نشطين' }, { status: 400 });
        }

        // 2. Fetch all attendance records for the given month/year
        const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-31`; // Approx

        const attendances = await prisma.attendance.findMany({
            where: {
                date: { gte: startDateStr, lte: endDateStr }
            }
        });

        const activeLoans = await prisma.employeeLoan.findMany({
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

                const baseSalary = emp.salary || 0;
                
                // Deductions: 1 Day salary per absent day
                const dailyRate = baseSalary / 30;
                const absencePenalty = absentDays > 0 ? (dailyRate * absentDays) : 0;
                
                // Standard GOSI (Social Insurance) deduction demo (e.g. 9% of Base)
                const gosiDeduction = baseSalary * 0.09;

                let loanDeduction = 0;
                const empLoans = activeLoans.filter((l: any) => l.employeeId === emp.id);
                for (const loan of empLoans) {
                    const toDeduct = Math.min(loan.monthlyDeduction, loan.remainingAmount);
                    loanDeduction += toDeduct;
                    
                    // Update the loan balance
                    await tx.employeeLoan.update({
                        where: { id: loan.id },
                        data: {
                            remainingAmount: { decrement: toDeduct },
                            status: (loan.remainingAmount - toDeduct) <= 0 ? 'paid' : 'active'
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
                // Post Macro Journal Entry
                await tx.journalEntry.create({
                    data: {
                        entryNumber: `PAY-${year}-${month}`,
                        entryDate: new Date().toISOString().split('T')[0],
                        description: `قيد مسير رواتب موظفي الشركة لشهر ${month}/${year}`,
                        reference: 'AUTO_PAYROLL',
                        totalDebit: totalGrossSalaries,
                        totalCredit: totalGrossSalaries,
                        status: 'posted'
                    }
                });
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `تم اعتماد مسير الرواتب بنجاح وإصدار أوامر التحويل لعدد ${generatedRecords} موظفين بقيمة إجمالية ${totalGrossSalaries.toLocaleString('en-SA', { minimumFractionDigits: 2 })} ر.س. مضافة للقيد المحاسبي.` 
        }, { status: 201 });

    } catch (error: any) {
        console.error("Payroll Error:", error);
        return NextResponse.json({ error: error.message || 'فشل توليد مسير الرواتب' }, { status: 500 });
    }
}
