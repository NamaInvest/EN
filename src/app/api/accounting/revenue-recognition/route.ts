import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.revenue-recognition' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        let schedules = await (prisma as any).deferredRevenueSchedule.findMany({
            take: 100,
            include: { invoice: true, lines: true },
            orderBy: { id: 'desc' }
        });

        // Seed if empty
        if (schedules.length === 0) {
            // Check if there is an invoice
            let invoice = await prisma.salesInvoice.findFirst();
            if (!invoice) {
                invoice = await prisma.salesInvoice.create({
                    data: {
                        invoiceNo: Math.floor(Math.random() * 100000),
                        customerId: 1, // Assume customer 1 exists
                        date: new Date(),
                        subtotal: 120000,
                        taxValue: 18000,
                        total: 138000,
                        status: 'POSTED'
                    }
                });
            }

            const schedule = await (prisma as any).deferredRevenueSchedule.create({
                data: {
                    invoiceId: invoice.id,
                    totalAmount: 120000,
                    recognizedAmount: 50000,
                    remainingAmount: 70000,
                    startDate: new Date('2026-01-01'),
                    endDate: new Date('2026-12-31'),
                    recognitionMethod: 'STRAIGHT_LINE',
                    status: 'ACTIVE'
                },
                include: { invoice: true, lines: true }
            });
            schedules = [schedule];
        }

        const activeCount = schedules.filter((s: any) => s.status === 'ACTIVE').length;
        const totalRecognized = schedules.reduce((sum: number, s: any) => sum + s.recognizedAmount, 0);
        const totalDeferred = schedules.reduce((sum: number, s: any) => sum + s.remainingAmount, 0);

        return NextResponse.json({
            schedules,
            summary: {
                activeCount,
                totalRecognized,
                totalDeferred
            }
        });
    } catch (error: any) {
        log.error('Revenue Recog GET error:', error);
        return NextResponse.json({ error: 'فشل جلب بيانات الاعتراف بالإيراد' }, { status: 500 });
    }
}

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        // Mock running monthly recognition
        const schedules = await (prisma as any).deferredRevenueSchedule.findMany({
            take: 100,
            where: { status: 'ACTIVE' }
        });

        let recognizedCount = 0;
        for (const schedule of schedules) {
            if (schedule.remainingAmount > 0) {
                const amountToRecognize = schedule.totalAmount / 12; // straight line mock
                const newRecognized = Math.min(schedule.recognizedAmount + amountToRecognize, schedule.totalAmount);
                const newRemaining = schedule.totalAmount - newRecognized;
                
                await (prisma as any).deferredRevenueSchedule.update({
                    where: { id: schedule.id },
                    data: {
                        recognizedAmount: newRecognized,
                        remainingAmount: newRemaining,
                        status: newRemaining === 0 ? 'COMPLETED' : 'ACTIVE'
                    }
                });
                recognizedCount++;
            }
        }

        return NextResponse.json({ success: true, recognizedCount });
    } catch (error: any) {
        log.error('Revenue Recog POST error:', error);
        return NextResponse.json({ error: error.message || 'فشل تشغيل الاعتراف الشهري' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
