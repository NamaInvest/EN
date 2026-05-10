// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.mfa.status' });

async function _GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userIdStr = searchParams.get('userId');
        if (!userIdStr) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const userId = parseInt(userIdStr);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { backupCodes: true, trustedDevices: true }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json({
            mfaEnabled: user.mfaEnabled,
            mfaMethod: user.mfaMethod,
            mfaPendingActivation: user.mfaPendingActivation,
            mfaEnrolledAt: user.mfaEnrolledAt,
            mfaLastUsedAt: user.mfaLastUsedAt,
            mfaLockedUntil: user.mfaLockedUntil,
            backupCodesRemaining: user.backupCodes.filter((c: any) => !c.usedAt).length,
            trustedDevicesCount: user.trustedDevices.filter((d: any) => d.trustedUntil > new Date() && !d.revokedAt).length
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AUTH' });
