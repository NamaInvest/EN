import { NextResponse } from 'next/server';
import { withGuard } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getProvisioningQueueAdapter } from '@/lib/tenant/provisioning-queue';
import { startProvisioningWorker } from '@/lib/tenant/provisioning-worker';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'admin.tenant-provisioning.approve' });
const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withGuard(async (req, params, user) => {
    if (user.role !== 'admin' && user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { runId } = body;

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
                message: `Cannot approve request in ${dbRun.status} status.`,
            }, { status: 400 });
        }

        await prisma.tenantProvisioningRun.update({
            where: { id: runId },
            data: { status: 'PENDING' },
        });

        const adapter = getProvisioningQueueAdapter() as any;
        const memoryJob = await adapter.getProvisioningJobStatus(runId);
        if (memoryJob) {
            adapter.__updateJobState(runId, { status: 'PENDING' }, [
                { step: 'VALIDATE_REQUEST', status: 'PENDING' }
            ]);
        } else {
            const payload = await adapter.getProvisioningJobPayload(runId);
            if (payload) {
                await adapter.enqueueProvisioningJob({
                    ...payload,
                    initialStatus: 'PENDING',
                });
            }
        }

        try {
            startProvisioningWorker();
            log.info(`[approve] Triggered background worker for approved runId: ${runId}`);
        } catch (workerErr: any) {
            log.error(`[approve] Failed to trigger background worker: ${workerErr.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'تمت الموافقة على الطلب وبدء التأسيس في الخلفية.',
            status: 'PENDING',
        });
    } catch (err: any) {
        log.error('[approve] Exception during approval:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
});
