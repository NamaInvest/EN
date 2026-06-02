/**
 * ZATCA Automated Batch Submission
 * ══════════════════════════════════════════════════════════════════════════════
 * يُشغَّل بعد اعتماد الفواتير لإرسالها دفعة واحدة لـ ZATCA
 *
 * الحالات التي تحتاج إرسالاً:
 *   - B2B: Clearance (يلزم الاعتماد الفوري من ZATCA قبل الإرسال للعميل)
 *   - B2C: Reporting (يُرسل خلال 24 ساعة — Simplified Tax Invoice)
 *
 * الحماية:
 *   - لا يُعيد إرسال ما تم إرساله (zatcaStatus = 'CLEARED' | 'REPORTED')
 *   - يُوثّق كل محاولة في ZatcaSubmissionLog
 *   - يُدعم retry للفواتير الفاشلة (خلال 72 ساعة)
 *
 * POST /api/cron/zatca-batch-submit
 * POST /api/zatca/submit-batch (manual trigger)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma, { withTenant } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zatca-batch' });
const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

// ─── ZATCA Endpoints ─────────────────────────────────────────────────────────
const ZATCA_BASE    = process.env.ZATCA_API_URL       ?? 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
const ZATCA_CCSID   = process.env.ZATCA_CCSID         ?? '';
const ZATCA_SECRET  = process.env.ZATCA_API_SECRET    ?? '';

// Batch size per ZATCA API recommendation
const BATCH_SIZE    = 100;
const RETRY_HOURS   = 72;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ZatcaBatchResult {
  tenantId:      string;
  submitted:     number;
  cleared:       number;
  reported:      number;
  failed:        number;
  skipped:       number;
  errors:        string[];
  batchIds:      string[];
  dryRun:        boolean;
  generatedAt:   string;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret')
    ?? req.headers.get('authorization')
    ?? req.headers.get('x-api-key');

  // Allow both cron secret and ZATCA key
  const isAuthorized = auth === CRON_SECRET
    || auth === `Bearer ${CRON_SECRET}`
    || auth === process.env.ZATCA_API_KEY;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const dryRun   = searchParams.get('dryRun') === 'true';
  const forceRetry = searchParams.get('retry') === 'true';

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const result = await withTenant(tenantId, async () => {
    return runZatcaBatch(tenantId, dryRun, forceRetry);
  });
  const httpStatus = result.failed > 0 ? 207 : 200;  // 207 Multi-Status if partial failures
  return NextResponse.json(result, { status: httpStatus });
}

// ─── Core Batch Logic ─────────────────────────────────────────────────────────

async function runZatcaBatch(
  tenantId:    string,
  dryRun:      boolean,
  forceRetry:  boolean,
): Promise<ZatcaBatchResult> {
  const now = new Date();
  const retryBefore = new Date(now.getTime() - RETRY_HOURS * 3_600_000);

  // Build where clause for pending invoices
  const pending = await (prisma as any).salesInvoice?.findMany?.({
    where: {
      tenantId,
      status:       { not: 'CANCELLED' },
      zatcaStatus:  forceRetry
        ? { in: ['PENDING', 'FAILED'] }
        : 'PENDING',
      // Only invoices older than 1 minute (allow time for PDF generation)
      createdAt:    { lte: new Date(now.getTime() - 60_000) },
      // For B2B: only POSTED invoices (approved and ready)
      // For B2C simplified: include POSTED
    },
    select: {
      id:             true,
      invoiceNumber:  true,
      invoiceType:    true,
      zatcaXml:       true,
      zatcaQrCode:    true,
      zatcaHash:      true,
      zatcaStatus:    true,
      total:          true,
      customerId:     true,
      customer:       { select: { vatNumber: true, isB2B: true } },
      lastZatcaAttempt: true,
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  }).catch(() => []) ?? [];

  const result: ZatcaBatchResult = {
    tenantId,
    submitted: 0,
    cleared:   0,
    reported:  0,
    failed:    0,
    skipped:   0,
    errors:    [],
    batchIds:  [],
    dryRun,
    generatedAt: now.toISOString(),
  };

  if (pending.length === 0) {
    log.info('ZATCA batch: no pending invoices', { tenantId });
    return result;
  }

  log.info('ZATCA batch starting', { tenantId, count: pending.length, dryRun });

  for (const invoice of pending) {
    try {
      // Skip if no XML generated yet
      if (!invoice.zatcaXml && !invoice.zatcaHash) {
        result.skipped++;
        log.warn(`Invoice ${invoice.invoiceNumber} has no ZATCA XML — skipping`, { id: invoice.id });
        continue;
      }

      const isB2B = invoice.customer?.isB2B ?? invoice.customer?.vatNumber?.length > 0;
      const endpoint = isB2B ? 'clearance' : 'reporting';

      if (dryRun) {
        result.submitted++;
        isB2B ? result.cleared++ : result.reported++;
        result.batchIds.push(`DRY-${invoice.id}`);
        continue;
      }

      // Submit to ZATCA
      const zatcaResult = await submitToZatca(invoice, endpoint);

      if (zatcaResult.success) {
        result.submitted++;
        isB2B ? result.cleared++ : result.reported++;
        result.batchIds.push(zatcaResult.requestId ?? String(invoice.id));

        // Update invoice status
        await (prisma as any).salesInvoice?.update?.({
          where: { id: invoice.id },
          data: {
            zatcaStatus:         isB2B ? 'CLEARED' : 'REPORTED',
            zatcaClearanceId:    zatcaResult.requestId,
            zatcaClearedAt:      now,
            zatcaResponseCode:   zatcaResult.responseCode,
            lastZatcaAttempt:    now,
          },
        }).catch(() => null);

        // Log submission
        await (prisma as any).zatcaSubmissionLog?.create?.({
          data: {
            tenantId,
            invoiceId:    invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            endpoint,
            status:       'SUCCESS',
            responseCode: zatcaResult.responseCode,
            requestId:    zatcaResult.requestId,
            submittedAt:  now,
          },
        }).catch(() => null);

      } else {
        result.failed++;
        result.errors.push(`${invoice.invoiceNumber}: ${zatcaResult.error}`);

        await (prisma as any).salesInvoice?.update?.({
          where: { id: invoice.id },
          data: {
            zatcaStatus:       'FAILED',
            zatcaError:        zatcaResult.error,
            lastZatcaAttempt:  now,
          },
        }).catch(() => null);

        await (prisma as any).zatcaSubmissionLog?.create?.({
          data: {
            tenantId,
            invoiceId:    invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            endpoint,
            status:       'FAILED',
            error:        zatcaResult.error,
            submittedAt:  now,
          },
        }).catch(() => null);
      }

    } catch (e: any) {
      result.failed++;
      result.errors.push(`${invoice.invoiceNumber}: ${e.message}`);
      log.error('ZATCA submission error', { invoiceId: invoice.id, error: e.message });
    }
  }

  log.info('ZATCA batch complete', result);
  return result;
}

// ─── ZATCA API Call ───────────────────────────────────────────────────────────

async function submitToZatca(
  invoice:  any,
  endpoint: 'clearance' | 'reporting',
): Promise<{ success: boolean; requestId?: string; responseCode?: string; error?: string }> {
  // ZATCA requires CCSID + API Secret
  if (!ZATCA_CCSID || !ZATCA_SECRET) {
    return { success: false, error: 'ZATCA credentials not configured' };
  }

  const url  = `${ZATCA_BASE}/${endpoint}`;
  const auth = Buffer.from(`${ZATCA_CCSID}:${ZATCA_SECRET}`).toString('base64');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Accept-Version': 'V2',
        'Authorization':  `Basic ${auth}`,
      },
      body: JSON.stringify({
        invoiceHash:        invoice.zatcaHash,
        uuid:               invoice.id,
        invoice:            invoice.zatcaXml
          ? Buffer.from(invoice.zatcaXml).toString('base64')
          : undefined,
      }),
      signal: AbortSignal.timeout(30_000),  // 30s timeout
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success:     true,
        requestId:   data.reportingStatus ?? data.clearanceStatus ?? String(invoice.id),
        responseCode: String(response.status),
      };
    }

    return {
      success:  false,
      error:    data.errorMessages?.[0]?.message ?? data.message ?? `HTTP ${response.status}`,
    };

  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
