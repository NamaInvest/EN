import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { employeeId, period } = body; // period e.g., '2026-05'

        if (!employeeId || !period) {
            return NextResponse.json({ error: 'Missing employeeId or period' }, { status: 400 });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(employeeId) },
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        const additions = [];
        const deductions = [];
        let counter = 1;

        // 1. Basic Additions
        if (n(employee.salary) > 0) additions.push({ id: counter++, description: 'الراتب الأساسي', amount: n(employee.salary), type: 'addition' });
        if (employee.housingAllowance > 0) additions.push({ id: counter++, description: 'بدل السكن', amount: employee.housingAllowance, type: 'addition' });
        if (employee.transportAllowance > 0) additions.push({ id: counter++, description: 'بدل النقل', amount: employee.transportAllowance, type: 'addition' });
        if (employee.otherAllowance > 0) additions.push({ id: counter++, description: 'بدلات أخرى', amount: employee.otherAllowance, type: 'addition' });

        // 2. Loan Deductions (Active loans)
        const activeLoans = await prisma.employeeLoan.findMany({
            take: 100,
            where: { employeeId: parseInt(employeeId), status: 'active', remainingAmount: { gt: 0 } }
        });

        for (const loan of activeLoans) {
            // Deduct either the monthly deduction or the remaining amount, whichever is smaller
            const deductionAmount = Math.min(loan.monthlyDeduction, loan.remainingAmount);
            if (deductionAmount > 0) {
                deductions.push({ 
                    id: counter++, 
                    description: `قسط سلفة (${loan.reason || 'سداد سلفة'})`, 
                    amount: deductionAmount, 
                    type: 'deduction',
                    loanId: loan.id // To track and update the loan balance later
                });
            }
        }

        // 3. Attendance Deductions (Absences in the given period)
        // Find all attendance records for this period that don't have checkIn or marked absent
        // (Assuming a simple logic: if attendance doesn't exist for a weekday, it's an absence. But since we just query 'attendance' table)
        // Let's find explicit 'absent' status if they use it, or count days without check_in.
        // For now, let's just query records in the given month (e.g. date starts with '2026-05')
        const attendanceRecords = await prisma.attendance.findMany({
            take: 100,
            where: {
                employeeId: parseInt(employeeId),
                date: { startsWith: period }
            }
        });

        // Let's assume standard working days is 30 for daily rate
        const dailyRate = (n(employee.salary) + n(employee.housingAllowance) + n(employee.transportAllowance)) / 30;
        
        // Count absences: if checkIn is null or missing.
        const absentDays = attendanceRecords.filter(a => !a.checkIn).length;
        if (absentDays > 0) {
            deductions.push({
                id: counter++,
                description: `خصم غياب (${absentDays} أيام)`,
                amount: parseFloat((absentDays * dailyRate).toFixed(2)),
                type: 'deduction'
            });
        }

        return NextResponse.json({ additions, deductions });
    } catch (error: any) {
        console.error('Payroll calc error:', error);
        return NextResponse.json({ error: 'Failed to calculate payroll' }, { status: 500 });
    }
}
