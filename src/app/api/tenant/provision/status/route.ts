import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getProvisioningQueueAdapter, isQueueEnabled } from '@/lib/tenant/provisioning-queue';
import { isWorkerEnabled, isRealWritesEnabled } from '@/lib/tenant/provisioning-guard';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'tenant/provision/status' });
const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');

  if (!runId) {
    return NextResponse.json({ error: 'runId is required' }, { status: 400 });
  }

  try {
    log.info(`[status] Checking status for runId: ${runId}`);

    // 1. Check in-memory/queue adapter first
    const adapter = getProvisioningQueueAdapter();
    const queueState = await adapter.getProvisioningJobStatus(runId);

    if (queueState) {
      const timeline = await adapter.getProvisioningTimeline(runId);
      return NextResponse.json({
        success: true,
        source: 'queue_adapter',
        queueEnabled: isQueueEnabled(),
        workerEnabled: isWorkerEnabled(),
        realWritesEnabled: isRealWritesEnabled(),
        state: queueState,
        timeline,
      });
    }

    // 2. Fallback: Query database table tenant_provisioning_runs if not in memory
    const dbRun = await prisma.tenantProvisioningRun.findUnique({
      where: { id: runId },
    });

    if (dbRun) {
      return NextResponse.json({
        success: true,
        source: 'database',
        queueEnabled: isQueueEnabled(),
        workerEnabled: isWorkerEnabled(),
        realWritesEnabled: isRealWritesEnabled(),
        state: {
          runId: dbRun.id,
          subdomain: dbRun.subdomain,
          status: dbRun.status,
          currentStep: dbRun.currentStep,
          attemptNo: dbRun.attemptNo,
          lastErrorCode: dbRun.lastErrorCode,
          lastErrorMessage: dbRun.lastErrorMessageSanitized,
          startedAt: dbRun.startedAt,
          completedAt: dbRun.completedAt,
          failedAt: dbRun.failedAt,
        },
        timeline: [], // DB doesn't store timeline events separately yet
      });
    }

    return NextResponse.json({
      success: false,
      error: 'PROVISIONING_RUN_NOT_FOUND',
      message: 'تعذر العثور على سجل عملية التأسيس المطلوبة.',
    }, { status: 404 });

  } catch (err: any) {
    log.error(`[status] Error checking provisioning status:`, {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ داخلي أثناء مراجعة حالة التأسيس.',
    }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
