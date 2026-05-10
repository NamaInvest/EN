import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Priority 4: Payroll Engine API
 * يحتسب الراتب من سجلات الحضور والانصراف
 * 
 * Schema facts:
 * - Employee: active (Boolean), salary (Float), no status field
 * - Attendance: date (String), checkIn/checkOut (String), no status/overtimeHours
 * - Salary: month (Int), year (Int) — NOT string
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { postSalary } from '@/lib/auto-journal';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.payroll.calculate' });

interface PayrollResult {
    employeeId: number;
    name: string;
    basicSalary: number;
    workedDays: number;
    absentDays: number;
    deductions: number;
    additions: number;
    netSalary: number;
    salaryId?: number;
}

async function calcPayroll(prisma: any, employeeId: number, month: number, year: number): Promise<PayrollResult | null> {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
            id: true,
            name: true,
            salary: true,                 // 'salary' not 'baseSalary'
            housingAllowance: true,
            transportAllowance: true,
            otherAllowance: true,
        },
    });
    if (!employee) return null;

    const basicSalary = employee.salary || 0;
    const dailyRate = basicSalary / 30;

    // Attendance date is stored as String (e.g. "2026-04-15")
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endStr   = `${year}-${String(month).padStart(2, '0')}-31`;

    const attendance = await prisma.attendance.findMany({
            take: 100,
        where: {
            employeeId,
            date: { gte: startStr, lte: endStr },
        },
        select: { date: true, checkIn: true, checkOut: true },
    });

    // Count worked days = days with a checkIn record
    const workedDays = attendance.filter((a: any) => a.checkIn).length;
    const totalDays = new Date(year, month, 0).getDate(); // last day of month
    const absentDays = Math.max(0, totalDays - workedDays);

    const absentDeduction = absentDays * dailyRate;

    // Loan deductions
    const loans = await prisma.employeeLoan.findMany({
            take: 100,
        where: { employeeId, status: 'active' },
        select: { monthlyDeduction: true },
    });
    const allowances = n(employee.housingAllowance) + n(employee.transportAllowance) + n(employee.otherAllowance);
    const loanDeduction = loans.reduce((s: number, l: any) => s + n(l.monthlyDeduction), 0);
    const totalDeductions = absentDeduction + loanDeduction;
    const netSalary = Math.max(0, basicSalary + allowances - totalDeductions);

    return {
        employeeId,
        name: employee.name,
        basicSalary,
        workedDays,
        absentDays,
        deductions: Math.round(totalDeductions * 100) / 100,
        additions: Math.round(allowances * 100) / 100,
        netSalary: Math.round(netSalary * 100) / 100,
    };
}

// GET — Preview payroll for all active employees
async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year  = parseInt(url.searchParams.get('year')  || String(new Date().getFullYear()));

    try {
        // Employee uses 'active' Boolean not 'status'
        const employees = await prisma.employee.findMany({
            take: 100,
            where: { active: true },
            select: { id: true },
        });

        const results: PayrollResult[] = [];
        for (const emp of employees) {
            const r = await calcPayroll(prisma, emp.id, month, year);
            if (r) results.push(r);
        }

        return NextResponse.json({
            month, year,
            employeeCount: results.length,
            totalNetSalary: Math.round(results.reduce((s: any, r: any) => s + r.netSalary, 0) * 100) / 100,
            breakdown: results,
        });
    } catch (e: any) {
        log.error('Payroll GET error:', e);
        return NextResponse.json({ error: 'خطأ في احتساب الرواتب' }, { status: 500 });
    }
}

// POST — Commit payroll (save Salary records + auto-journal)

const _POSTSchema = z.object({
  month: z.union([z.string(), z.number()]).optional(),
  year: z.union([z.string(), z.number()]).optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
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
        const month: number = parseInt(body.month);
        const year: number  = parseInt(body.year);
        const branchId: number | null = body.branchId ? parseInt(body.branchId) : null;

        // Check already processed — month/year are Int in Salary model
        const existing = await prisma.salary.findFirst({
            where: { month, year },
        });
        if (existing) {
            return NextResponse.json({ error: `الرواتب لشهر ${month}/${year} تم احتسابها مسبقاً` }, { status: 409 });
        }

        const employees = await prisma.employee.findMany({
            take: 100,
            where: { active: true },
            select: { id: true },
        });

        const committed: PayrollResult[] = [];
        for (const emp of employees) {
            const r = await calcPayroll(prisma, emp.id, month, year);
            if (!r || r.netSalary === 0) continue;

            const salary = await prisma.salary.create({
                data: {
                    employeeId: r.employeeId,
                    month,   // Int
                    year,    // Int
                    basicSalary: r.basicSalary,
                    additions: r.additions,
                    deductions: r.deductions,
                    netSalary: r.netSalary,
                    notes: `احتساب تلقائي — حضور: ${r.workedDays} يوم، غياب: ${r.absentDays} يوم`,
                },
            });

            try {
                await postSalary({
                    employeeName: r.name,
                    netSalary: r.netSalary,
                    userId: user.userId,
                    branchId,
                    date: `${year}-${String(month).padStart(2, '0')}-01`,
                });
                
                // Update Loan Balances automatically!
                const activeLoans = await prisma.employeeLoan.findMany({
            take: 100,
                    where: { employeeId: emp.id, status: 'active' }
                });
                
                for (const loan of activeLoans) {
                    const newRemaining = Math.max(0, n(loan.remainingAmount) - n(loan.monthlyDeduction));
                    await prisma.employeeLoan.update({
                        where: { id: loan.id },
                        data: {
                            remainingAmount: newRemaining,
                            status: newRemaining === 0 ? 'paid' : 'active'
                        }
                    });
                }
            } catch (je: unknown) {
                log.error('Salary journal error:', je);
            }

            committed.push({ ...r, salaryId: salary.id });
        }

        return NextResponse.json({
            success: true,
            month, year,
            committed: committed.length,
            totalPaid: Math.round(committed.reduce((s: any, r: any) => s + r.netSalary, 0) * 100) / 100,
            salaries: committed,
        });
    } catch (e: any) {
        log.error('Payroll POST error:', e);
        return NextResponse.json({ error: 'خطأ في تثبيت الرواتب' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
