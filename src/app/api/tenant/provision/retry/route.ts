import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { isWorkerEnabled } from '@/lib/tenant/provisioning-guard';
import { getProvisioningQueueAdapter, isQueueEnabled } from '@/lib/tenant/provisioning-queue';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'tenant/provision/retry' });
const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const _POSTSchema = z.object({
  runId: z.string(),
}).strict();

async function _POST(req: Request) {
  try {
    const body = await req.json();
    const _parsed = _POSTSchema.safeParse(body);

    if (!_parsed.success) {
      return NextResponse.json({
        error: 'Invalid request body',
        details: _parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { runId } = _parsed.data;
    log.info(`[retry] Requested retry for runId: ${runId}`);

    // Fail closed if onboarding queue or background worker is disabled
    if (!isQueueEnabled()) {
      return NextResponse.json({
        success: false,
        error: 'QUEUE_DISABLED',
        message: 'نظام طابور التأسيس معطل حالياً.',
      }, { status: 403 });
    }

    if (!isWorkerEnabled()) {
      return NextResponse.json({
        success: false,
        error: 'WORKER_DISABLED',
        message: 'عامل التأسيس الخلفي معطل حالياً.',
      }, { status: 403 });
    }

    // 1. Try to retry via the queue adapter
    const adapter = getProvisioningQueueAdapter();
    const isRetried = await adapter.retryProvisioningJob(runId);

    if (isRetried) {
      return NextResponse.json({
        success: true,
        message: 'تمت إعادة محاولة عملية التأسيس بنجاح.',
        status: 'RETRYING',
      });
    }

    // 2. Fallback: Update database status to RETRYING if it exists
    const dbRun = await prisma.tenantProvisioningRun.findUnique({
      where: { id: runId },
    });

    if (dbRun) {
      if (dbRun.status !== 'FAILED' && dbRun.status !== 'NEEDS_MANUAL_REVIEW') {
        return NextResponse.json({
          success: false,
          error: 'INVALID_STATUS',
          message: 'يمكن فقط إعادة محاولة العمليات الفاشلة.',
        }, { status: 400 });
      }

      await prisma.tenantProvisioningRun.update({
        where: { id: runId },
        data: {
          status: 'RETRYING',
          attemptNo: { increment: 1 },
          failedAt: null,
          lastRetryAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تمت إعادة محاولة عملية التأسيس بنجاح (تحديث قاعدة البيانات).',
        status: 'RETRYING',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'PROVISIONING_RUN_NOT_FOUND',
      message: 'تعذر العثور على سجل عملية التأسيس المطلوبة.',
    }, { status: 404 });

  } catch (err: any) {
    log.error(`[retry] Error retrying provisioning job:`, {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'حدث خطأ داخلي أثناء محاولة إعادة التشغيل.',
    }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
