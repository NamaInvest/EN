/**
 * Priority 4: Payroll Engine API
 * يحتسب الراتب تلقائياً من سجلات الحضور والانصراف
 * POST /api/hr/payroll/calculate — احتساب راتب موظف
 * GET  /api/hr/payroll/calculate?month=4&year=2026 — احتساب كل الموظفين
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { postSalary } from '@/lib/auto-journal';

interface PayrollResult {
    employeeId: number;
    name: string;
    basicSalary: number;
    workedDays: number;
    absentDays: number;
    lateDays: number;
    overtimeHours: number;
    deductions: number;
    additions: number;
    netSalary: number;
    salaryId?: number;
}

async function calculateEmployeePayroll(
    prisma: any,
    employeeId: number,
    month: number,
    year: number
): Promise<PayrollResult | null> {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
            id: true,
            name: true,
            baseSalary: true,
            transportAllowance: true,
            housingAllowance: true,
        },
    });

    if (!employee) return null;

    const basicSalary = employee.baseSalary || 0;
    const dailyRate = basicSalary / 30;

    // Date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    // Fetch attendance records for this employee in this month
    const attendanceRecords = await prisma.attendance.findMany({
        where: {
            employeeId,
            date: { gte: startDate, lte: endDate },
        },
    });

    const workedDays = attendanceRecords.filter((a: any) => a.status === 'present' || a.status === 'late').length;
    const absentDays = attendanceRecords.filter((a: any) => a.status === 'absent').length;
    const lateDays = attendanceRecords.filter((a: any) => a.status === 'late').length;

    // Overtime: sum up overtime hours
    const overtimeHours = attendanceRecords.reduce((sum: number, a: any) => sum + (a.overtimeHours || 0), 0);
    const overtimePay = overtimeHours * (dailyRate / 8) * 1.5; // 1.5x hourly rate

    // Deductions
    const absentDeduction = absentDays * dailyRate;
    const lateDeduction = lateDays * (dailyRate / 8) * 0.5; // 30 min late = 0.5 hour deduction

    // Check active employee loans for monthly deduction
    const loans = await prisma.employeeLoan.findMany({
        where: {
            employeeId,
            status: 'active',
        },
        select: { monthlyDeduction: true },
    });
    const loanDeduction = loans.reduce((s: number, l: any) => s + (l.monthlyDeduction || 0), 0);

    // Allowances from employee record
    const allowances = (employee.housingAllowance || 0) + (employee.transportAllowance || 0);

    const totalDeductions = absentDeduction + lateDeduction + loanDeduction;
    const totalAdditions = allowances + overtimePay;
    const netSalary = Math.max(0, basicSalary + totalAdditions - totalDeductions);

    return {
        employeeId,
        name: employee.name,
        basicSalary,
        workedDays,
        absentDays,
        lateDays,
        overtimeHours,
        deductions: Math.round(totalDeductions * 100) / 100,
        additions: Math.round(totalAdditions * 100) / 100,
        netSalary: Math.round(netSalary * 100) / 100,
    };
}

// GET — Calculate payroll for all employees in a month (preview or commit)
export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    try {
        const employees = await prisma.employee.findMany({
            where: { status: 'active' },
            select: { id: true },
        });

        const results: PayrollResult[] = [];
        for (const emp of employees) {
            const result = await calculateEmployeePayroll(prisma, emp.id, month, year);
            if (result) results.push(result);
        }

        const totalNet = results.reduce((s, r) => s + r.netSalary, 0);

        return NextResponse.json({
            month, year,
            employeeCount: results.length,
            totalNetSalary: Math.round(totalNet * 100) / 100,
            breakdown: results,
        });
    } catch (e) {
        console.error('Payroll calc error:', e);
        return NextResponse.json({ error: 'خطأ في احتساب الرواتب' }, { status: 500 });
    }
}

// POST — Commit payroll (save Salary records + auto-journal)
export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { month, year, branchId } = await req.json();

        // Check not already run
        const existing = await prisma.salary.findFirst({
            where: { month: String(month), year: String(year) },
        });
        if (existing) {
            return NextResponse.json({ error: `الرواتب لشهر ${month}/${year} تم احتسابها مسبقاً` }, { status: 409 });
        }

        const employees = await prisma.employee.findMany({
            where: { status: 'active' },
            select: { id: true },
        });

        const committed: PayrollResult[] = [];

        for (const emp of employees) {
            const result = await calculateEmployeePayroll(prisma, emp.id, month, year);
            if (!result || result.netSalary === 0) continue;

            // Save Salary record
            const salary = await prisma.salary.create({
                data: {
                    employeeId: result.employeeId,
                    month: String(month),
                    year: String(year),
                    basicSalary: result.basicSalary,
                    additions: result.additions,
                    deductions: result.deductions,
                    netSalary: result.netSalary,
                    notes: `احتساب تلقائي — حضور: ${result.workedDays} يوم، غياب: ${result.absentDays} يوم، وقت إضافي: ${result.overtimeHours} ساعة`,
                },
            });

            // Auto-journal: Dr Salaries / Cr Cash
            try {
                await postSalary({
                    employeeName: result.name,
                    netSalary: result.netSalary,
                    userId: user.userId,
                    branchId: branchId || null,
                    date: `${year}-${String(month).padStart(2, '0')}-01`,
                });
            } catch (je) {
                console.error('Salary journal error:', je);
            }

            committed.push({ ...result, salaryId: salary.id });
        }

        return NextResponse.json({
            success: true,
            month, year,
            committed: committed.length,
            totalPaid: committed.reduce((s, r) => s + r.netSalary, 0),
            salaries: committed,
        });
    } catch (e) {
        console.error('Payroll commit error:', e);
        return NextResponse.json({ error: 'خطأ في تثبيت الرواتب' }, { status: 500 });
    }
}
