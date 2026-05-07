/**
 * GOSI (التأمينات الاجتماعية) Payroll Deductions API
 * GET  /api/hr/gosi — ملخص اشتراكات GOSI للشهر
 * POST /api/hr/gosi — احتساب اشتراكات الشهر الحالي
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// معدلات GOSI السعودية 2024
const GOSI_RATES = {
    saudiEmployee: 0.10,      // موظف سعودي: 10% على الموظف
    saudiEmployer: 0.12,      // موظف سعودي: 12% على صاحب العمل
    expat: 0.02,              // موظف غير سعودي: 2% فقط على صاحب العمل
    hazardSaudi: 0.02,        // مخاطر مهنية: 2% على صاحب العمل
};

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    try {
        const employees = await prisma.employee.findMany({
            take: 100,
            where: { active: true },
            select: {
                id: true, name: true,
                salary: true, position: true,
            },
        });

        const summary = employees.map((emp: any) => {
            // Default to Saudi — nationality field not in schema; extend schema to add it
            const isSaudi = true;
            const baseSalary = emp.salary || 0;

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
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'خطأ في احتساب GOSI' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const month = parseInt(body.month) || new Date().getMonth() + 1;
        const year = parseInt(body.year) || new Date().getFullYear();

        const employees = await prisma.employee.findMany({
            take: 100,
            where: { active: true },
            select: { id: true, name: true, salary: true },
        });

        let totalEmployerContrib = 0;

        // Update each employee's salary record with GOSI deductions
        for (const emp of employees) {
            const isSaudi = true; // default — add nationality field to schema when needed
            const baseSalary = emp.salary || 0;
            const empDeduction = isSaudi ? baseSalary * GOSI_RATES.saudiEmployee : 0;
            const empContrib = isSaudi
                ? baseSalary * (GOSI_RATES.saudiEmployer + GOSI_RATES.hazardSaudi)
                : baseSalary * GOSI_RATES.expat;

            totalEmployerContrib += empContrib;

            // Update salary record if exists
            const salaryRecord = await prisma.salary.findFirst({
                where: { employeeId: emp.id, month, year },
            });
            if (salaryRecord) {
                await prisma.salary.update({
                    where: { id: salaryRecord.id },
                    data: {
                        deductions: { increment: Math.round(empDeduction * 100) / 100 },
                    },
                });
            }
        }

        // Post GOSI journal entry (employer contribution = expense)
        const entryNo = `GOSI-${year}-${String(month).padStart(2,'0')}`;
        await prisma.journalEntry.create({
            data: {
                entryNumber: entryNo,
                entryDate: new Date().toISOString().split('T')[0],
                reference: entryNo,
                description: `اشتراكات التأمينات الاجتماعية GOSI — ${month}/${year}`,
                createdBy: user.userId,
                totalDebit: Math.round(totalEmployerContrib * 100) / 100,
                totalCredit: Math.round(totalEmployerContrib * 100) / 100,
                lines: {
                    create: [
                        {
                            accountId: 1, // مصروف التأمينات — عدّل الـ ID حسب دليل الحسابات
                            description: `GOSI صاحب العمل ${month}/${year}`,
                            debit: Math.round(totalEmployerContrib * 100) / 100,
                            credit: 0,
                        },
                        {
                            accountId: 2, // التأمينات المستحقة — عدّل الـ ID حسب دليل الحسابات
                            description: `GOSI مستحق ${month}/${year}`,
                            debit: 0,
                            credit: Math.round(totalEmployerContrib * 100) / 100,
                        },
                    ],
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: `تم احتساب اشتراكات GOSI لـ ${employees.length} موظف`,
            totalEmployerContrib: Math.round(totalEmployerContrib * 100) / 100,
            month, year,
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'خطأ في تسجيل GOSI' }, { status: 500 });
    }
}
