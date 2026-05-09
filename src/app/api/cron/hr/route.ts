import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        console.log(">> CRON EXECUTION: Running HR Attendance Automation...");
        
        // Find employees who did NOT clock in today
        const today = new Date().toISOString().split('T')[0];
        
        const activeEmployees = await prisma.employee.findMany({
            take: 100,
            where: { active: true }
        });

        const todaysAttendance = await prisma.attendance.findMany({
            take: 100,
            where: { date: today }
        });

        // 1. Process Absences (No Clock-In Record at all)
        const attendedEmployeeIds = new Set(todaysAttendance.map(a => a.employeeId));
        
        let absentCount = 0;
        let penaltyCost = 0;

        await prisma.$transaction(async (tx) => {
            for (const emp of activeEmployees) {
                if (!attendedEmployeeIds.has(emp.id)) {
                    // Employee didn't show up. Check if they are on an approved vacation.
                    const activeVacation = await tx.vacation.findFirst({
                        where: {
                            employeeId: emp.id,
                            status: 'approved',
                            dateFrom: { lte: today },
                            dateTo: { gte: today }
                        }
                    });

                    if (!activeVacation) {
                        // Mark as Absent natively in Attendance
                        await tx.attendance.create({
                            data: {
                                employeeId: emp.id,
                                date: today,
                                notes: '[CRON-AUTO]: غياب مسجل آلياً لعدم إثبات الحضور',
                                checkIn: null,
                                checkOut: null
                            }
                        });

                        // Calculate daily wage penalty (Assuming 30 working days)
                        const dailyWage = n(emp.salary) / 30;
                        
                        // Apply immediate Salary deduction to the current running month
                        const currentMonth = new Date().getMonth() + 1;
                        const currentYear = new Date().getFullYear();

                        // Upsert salary slip for this month
                        const salarySlip = await tx.salary.findFirst({
                            where: { employeeId: emp.id, month: currentMonth, year: currentYear }
                        });

                        if (salarySlip) {
                            await tx.salary.update({
                                where: { id: salarySlip.id },
                                data: {
                                    deductions: { increment: dailyWage },
                                    netSalary: { decrement: dailyWage },
                                    notes: `${salarySlip.notes || ''} | خصم آلي ليوم غياب (${today})`
                                }
                            });
                        } else {
                            await tx.salary.create({
                                data: {
                                    employeeId: emp.id,
                                    month: currentMonth,
                                    year: currentYear,
                                    basicSalary: n(emp.salary),
                                    deductions: dailyWage,
                                    netSalary: n(emp.salary) - dailyWage,
                                    notes: `خصم آلي ليوم غياب (${today})`
                                }
                            });
                        }

                        absentCount++;
                        penaltyCost += dailyWage;
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'تم فحص الحضور الشامل بنجاح',
            metrics: {
                totalActiveEmployees: activeEmployees.length,
                absencesFlagged: absentCount,
                financialPenaltiesApplied: penaltyCost
            }
        });

    } catch (e: any) {
        console.error("CRON HR Automation Error:", e);
        return NextResponse.json({ error: e.message || 'فشل تشغيل محرك شؤون الموظفين' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'CRON' });
