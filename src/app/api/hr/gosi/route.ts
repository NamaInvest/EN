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
            where: { active: true },
            select: {
                id: true, name: true, nationality: true,
                salary: true, jobTitle: true,
            },
        });

        const summary = employees.map((emp: any) => {
            const isSaudi = !emp.nationality || emp.nationality.toLowerCase().includes('saudi') || emp.nationality === 'SA';
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
            where: { active: true },
            select: { id: true, name: true, nationality: true, salary: true },
        });

        let totalEmployerContrib = 0;

        // Update each employee's salary record with GOSI deductions
        for (const emp of employees) {
            const isSaudi = !emp.nationality || emp.nationality.toLowerCase().includes('saudi');
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
        await prisma.journalEntry.create({
            data: {
                date: new Date().toISOString().split('T')[0],
                reference: `GOSI-${year}-${month}`,
                description: `اشتراكات التأمينات الاجتماعية GOSI — ${month}/${year}`,
                userId: user.userId,
                lines: {
                    create: [
                        {
                            accountCode: '5310',
                            accountName: 'مصروف التأمينات الاجتماعية',
                            debit: Math.round(totalEmployerContrib * 100) / 100,
                            credit: 0,
                            description: `GOSI صاحب العمل ${month}/${year}`,
                        },
                        {
                            accountCode: '2150',
                            accountName: 'التأمينات الاجتماعية المستحقة',
                            debit: 0,
                            credit: Math.round(totalEmployerContrib * 100) / 100,
                            description: `GOSI مستحق ${month}/${year}`,
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
