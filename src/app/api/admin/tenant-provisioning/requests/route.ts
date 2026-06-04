import { NextResponse } from 'next/server';
import { withGuard } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getProvisioningQueueAdapter } from '@/lib/tenant/provisioning-queue';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withGuard(async (req, params, user) => {
    if (user.role !== 'admin' && user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    try {
        const requests = await prisma.tenantProvisioningRun.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const adapter = getProvisioningQueueAdapter();
        const inMemoryJobs = await adapter.listProvisioningJobs();

        const merged = requests.map(dbReq => {
            const memoryJob = inMemoryJobs.find(j => j.runId === dbReq.id);
            return {
                id: dbReq.id,
                subdomain: dbReq.subdomain,
                databaseName: dbReq.databaseName,
                status: dbReq.status,
                currentStep: dbReq.currentStep,
                attemptNo: dbReq.attemptNo,
                requestId: dbReq.requestId,
                createdByClerkUserId: dbReq.createdByClerkUserId,
                createdByEmail: dbReq.createdByEmail,
                startedAt: dbReq.startedAt,
                completedAt: dbReq.completedAt,
                failedAt: dbReq.failedAt,
                lastRetryAt: dbReq.lastRetryAt,
                lastErrorCode: dbReq.lastErrorCode,
                lastErrorMessageSanitized: dbReq.lastErrorMessageSanitized,
                metadata: dbReq.metadata,
                createdAt: dbReq.createdAt,
                updatedAt: dbReq.updatedAt,
                inMemoryStatus: memoryJob?.status || null,
                inMemoryCurrentStep: memoryJob?.currentStep || null,
            };
        });

        return NextResponse.json({ success: true, requests: merged });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
});
