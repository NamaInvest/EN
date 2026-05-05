import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const sagas = await prisma.sagaTransaction.findMany({
            include: { steps: true },
            orderBy: { startedAt: 'desc' },
            take: 50
        });

        const events = await prisma.eventLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const [q2c, p2p, h2r, r2r, o2d, ptp, a2r, i2r] = await Promise.all([
            prisma.q2CJourney.findMany({ take: 5, orderBy: { startedAt: 'desc' } }),
            prisma.p2PJourney.findMany({ take: 5, orderBy: { startedAt: 'desc' } }),
            prisma.h2RJourney.findMany({ take: 5, orderBy: { startedAt: 'desc' } }),
            prisma.r2RJourney.findMany({ take: 5, orderBy: { startedAt: 'desc' } }),
            prisma.o2DJourney.findMany({ take: 5, orderBy: { startedAt: 'desc' } }),
            prisma.planToProduceJourney.findMany({ take: 5, orderBy: { startedAt: 'desc' } }),
            prisma.a2RJourney.findMany({ take: 5, orderBy: { startedAt: 'desc' } }),
            prisma.i2RJourney.findMany({ take: 5, orderBy: { startedAt: 'desc' } })
        ]);

        return NextResponse.json({
            success: true,
            sagas,
            events,
            journeys: { q2c, p2p, h2r, r2r, o2d, ptp, a2r, i2r }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
