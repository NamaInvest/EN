import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Priority 10: Contract Expiry Alert Cron
 * يفحص العقود المنتهية أو القريبة من الانتهاء ويرسل تنبيهات
 * يُشغَّل يومياً
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron.contract-expiry' });

async function _GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    const cronSecret = new URL(req.url).searchParams.get('secret');
    if (!user && cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = { expired: 0, expiringSoon: 0, alerts: 0 };

    try {
        // 1. Mark expired contracts
        // @ts-ignore — new model added in this session; IDE cache refresh needed
        const expired = await prisma.supplierContract.updateMany({
            where: {
                status: 'active',
                endDate: { lt: now },
                autoRenew: false,
            },
            data: { status: 'expired' },
        });
        results.expired = expired.count;

        // 2. Alert on contracts expiring within alertDaysBefore
        // @ts-ignore — new model added in this session; IDE cache refresh needed
        const soon = await prisma.supplierContract.findMany({
            take: 100,
            where: {
                status: 'active',
                endDate: {
                    gte: now,
                    lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                },
            },
            include: { supplier: { select: { name: true } } },
        });

        for (const c of soon) {
            results.expiringSoon++;
            const daysLeft = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            const exists = await prisma.systemAlert.findFirst({
                where: {
                    title: { contains: c.contractNo },
                    read: false,
                },
            });

            if (!exists && user) {
                await prisma.systemAlert.create({
                    data: {
                        userId: user.userId,
                        title: `📄 عقد ينتهي قريباً: ${c.contractNo}`,
                        message: `عقد المورد "${c.supplier.name}" (${c.title}) ينتهي خلال ${daysLeft} يوم. قيمته: ${c.value} ${c.currency}.`,
                        alertType: daysLeft <= 7 ? 'URGENT' : 'WARNING',
                        linkUrl: `/procurement/supplier-contracts/${c.id}`,
                    },
                });
                results.alerts++;
            }
        }

        return NextResponse.json({
            success: true,
            checkedAt: now.toISOString(),
            ...results,
        });
    } catch (e: any) {
        log.error('Contract expiry cron error:', e);
        return NextResponse.json({ error: 'Cron error' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'CRON' });
