/**
 * CRON: Document Expiry Scanner
 * ══════════════════════════════
 * يعمل يومياً — يفحص جميع وثائق الموظفين والشركة
 * ويرسل تنبيهات لما هو منتهٍ أو قريب من الانتهاء.
 *
 * Schedule: 0 7 * * *  (كل يوم 7 صباحاً)
 * Trigger:  POST /api/cron/document-expiry
 *           Header: x-cron-secret: <CRON_SECRET>
 */

import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { requireCronSecret } from '@/lib/cron-guard';
import { DocumentExpiryEngine } from '@/lib/document-expiry';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron.document-expiry' });

async function _POST(req: Request) {
  // Guard: only authorized cron callers
  const guard = requireCronSecret(req as any);
  if (guard) return guard;

  log.info('>> CRON: Document Expiry Scan started');
  const startTime = Date.now();

  try {
    // Channels: Dashboard always, + Email + WhatsApp for critical
    const result = await DocumentExpiryEngine.scanAndAlert([
      'DASHBOARD',
      'EMAIL',
      'WHATSAPP',
    ]);

    const elapsed = Date.now() - startTime;
    log.info(`>> CRON: Document Expiry Scan completed in ${elapsed}ms`, result);

    return NextResponse.json({
      success: true,
      message: 'تم فحص الوثائق وإرسال التنبيهات بنجاح',
      metrics: {
        scanned: result.scanned,
        alertsCreated: result.alertsCreated,
        notificationsSent: result.notificationsSent,
        errors: result.errors,
        elapsedMs: elapsed,
      },
    });
  } catch (error: any) {
    log.error('CRON Document Expiry Error:', error);
    return NextResponse.json(
      { error: error.message || 'فشل تشغيل ماسح انتهاء الوثائق' },
      { status: 500 }
    );
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), {
  rateLimit: 'CRON',
});
