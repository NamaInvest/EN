import { NextResponse } from 'next/server';
import { withGuard } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getProvisioningQueueAdapter } from '@/lib/tenant/provisioning-queue';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'admin.tenant-provisioning.reject' });
const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withGuard(async (req, params, user) => {
    if (user.role !== 'admin' && user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { runId, reason } = body;

        if (!runId) {
            return NextResponse.json({ success: false, error: 'runId is required' }, { status: 400 });
        }

        const dbRun = await prisma.tenantProvisioningRun.findUnique({
            where: { id: runId },
        });

        if (!dbRun) {
            return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
        }

        if (dbRun.status !== 'AWAITING_APPROVAL') {
            return NextResponse.json({
                success: false,
                error: 'INVALID_STATUS',
                message: `Cannot reject request in ${dbRun.status} status.`,
            }, { status: 400 });
        }

        await prisma.tenantProvisioningRun.update({
            where: { id: runId },
            data: {
                status: 'REJECTED',
                lastErrorMessageSanitized: reason || 'Rejected by Admin',
                failedAt: new Date(),
            },
        });

        const adapter = getProvisioningQueueAdapter() as any;
        const memoryJob = await adapter.getProvisioningJobStatus(runId);
        if (memoryJob) {
            adapter.__updateJobState(runId, {
                status: 'REJECTED',
                failedAt: new Date(),
                lastErrorMessage: reason || 'Rejected by Admin',
            }, [
                { step: 'VALIDATE_REQUEST', status: 'REJECTED' }
            ]);
        }

        return NextResponse.json({
            success: true,
            message: 'تم رفض طلب التأسيس.',
            status: 'REJECTED',
        });
    } catch (err: any) {
        log.error('[reject] Exception during rejection:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
});
