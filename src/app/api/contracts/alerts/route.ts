import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

/**
 * POST /api/contracts/alerts — Check all contracts and generate alerts for expiring ones
 * GET  /api/contracts/alerts — Get active contract expiry alerts
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const alertDays = 30;
        const now = new Date();
        const threshold = new Date(now.getTime() + alertDays * 24 * 60 * 60 * 1000);

        const expiringLeases = await prisma.leaseContract.findMany({
            take: 100,
            where: {
                status: 'ACTIVE',
                endDate: { lte: threshold },
            },
            include: { unit: true, tenant: true },
        });

        let alertsCreated = 0;
        for (const lease of expiringLeases) {
            const existing = await prisma.systemAlert.findFirst({
                where: { alertType: 'WARNING', title: { contains: lease.contractNumber } },
            });
            if (!existing) {
                await prisma.systemAlert.create({
                    data: {
                        userId: user.userId,
                        title: `عقد ينتهي قريباً — ${lease.contractNumber}`,
                        message: `عقد الوحدة ${lease.unit?.unitNumber || lease.unitId} ينتهي في ${lease.endDate.toISOString().split('T')[0]}. قيمة الإيجار: ${lease.rentAmount} ر.س`,
                        alertType: 'WARNING',
                        linkUrl: `/rem/leases/${lease.id}`,
                    },
                });
                alertsCreated++;
            }
        }

        return NextResponse.json({ ok: true, expiringContracts: expiringLeases.length, alertsCreated });
    } catch (e: any) {
        console.error('[Contract Alerts]', e);
        return NextResponse.json({ error: 'فشل فحص العقود' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const alerts = await prisma.systemAlert.findMany({
            take: 100,
            where: { alertType: 'WARNING', read: false },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(alerts);
    } catch (e: any) {
        return NextResponse.json({ error: 'فشل' }, { status: 500 });
    }
}
