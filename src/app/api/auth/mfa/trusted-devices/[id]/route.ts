// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const { searchParams } = new URL(req.url);
        const userIdStr = searchParams.get('userId');
        if (!userIdStr) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const userId = parseInt(userIdStr);

        const device = await prisma.trustedDevice.findUnique({ where: { id } });
        if (!device || device.userId !== userId) {
            return NextResponse.json({ error: 'Device not found' }, { status: 404 });
        }

        await prisma.trustedDevice.update({
            where: { id },
            data: {
                revokedAt: new Date(),
                revokedReason: 'User requested revocation',
                revokedByUserId: userId
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'MFA_DEVICE_REVOKED',
                entity: 'TrustedDevice',
                entityId: id.toString(),
                userId: userId
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
