import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
    try {
        console.log(">> CRON EXECUTION: Running EOD Shift Closures...");

        // Find shifts that have been OPEN for more than 16 hours
        const sixteenHoursAgo = new Date(Date.now() - 16 * 60 * 60 * 1000);

        const abandonedShifts = await prisma.shift.findMany({
            where: {
                status: 'open',
                startTime: { lt: sixteenHoursAgo }
            }
        });

        if (abandonedShifts.length === 0) {
            return NextResponse.json({ message: 'لا توجد ديات (ورديات) معلقة تتطلب الإغلاق الآلي.' }, { status: 200 });
        }

        let closedCount = 0;

        for (const shift of abandonedShifts) {
            // Calculate mathematical expected cash for this user since the shift started
            const treasuryLogs = await prisma.treasury.findMany({
                where: {
                    userId: shift.userId,
                    date: { gte: shift.startTime } // everything from shift start until now
                }
            });

            const totalIn = treasuryLogs.filter(t => t.type === 'in').reduce((acc, curr) => acc + curr.amount, 0);
            const totalOut = treasuryLogs.filter(t => t.type === 'out').reduce((acc, curr) => acc + curr.amount, 0);
            
            const expectedCash = shift.startingCash + totalIn - totalOut;

            // Auto-Close the shift, assuming the ledger is perfectly balanced
            await prisma.shift.update({
                where: { id: shift.id },
                data: {
                    endTime: new Date(),
                    status: 'closed',
                    endingCashExpected: expectedCash,
                    endingCashActual: expectedCash, 
                    difference: 0,
                    notes: `أُغلقت الوردية آلياً بواسطة (محرك الأتمتة) لتجاوزها 16 ساعة دون إغلاق.\n${shift.notes || ''}`
                }
            });

            closedCount++;
        }

        return NextResponse.json({
            success: true,
            message: 'تم إغلاق الورديات المتأخرة بنجاح',
            metrics: {
                abandonedShiftsDetected: abandonedShifts.length,
                successfullyAutoClosed: closedCount
            }
        });

    } catch (e: any) {
        console.error("CRON Shifts Automation Error:", e);
        return NextResponse.json({ error: e.message || 'فشل تشغيل إغلاقات الورديات الآلية' }, { status: 500 });
    }
}
