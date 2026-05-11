/**
 * Mudad Integration API
 * GET  /api/integrations/mudad?action=status              — Employer compliance status
 * GET  /api/integrations/mudad?action=violations&month=YYYY-MM
 * POST /api/integrations/mudad { action: 'submit', payrollRunId, bankCode }
 * GET  /api/integrations/mudad?action=payment-status&ref=MUDAD-REF-XXX
 * POST /api/integrations/mudad { action: 'confirm', referenceId }
 */
import { NextResponse, NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getMudadClient, MudadAPI } from '@/lib/mudad-api';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.integrations.mudad' });

export async function GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const month  = searchParams.get('month') || undefined;
    const ref    = searchParams.get('ref')   || undefined;

    // Try real Mudad client; fall back to mock for sandbox/demo
    const client = await getMudadClient(prisma);
    const isMock = !client;

    if (action === 'status') {
      const status = client
        ? await client.getEmployerStatus()
        : MudadAPI.mockResponse('employer');

      return NextResponse.json({ ...status, source: isMock ? 'sandbox-mock' : 'live' });
    }

    if (action === 'violations') {
      if (!client) {
        return NextResponse.json({
          violations: [],
          message:    'Mudad API غير مهيأ — بيانات وهمية للتطوير',
          source:     'sandbox-mock',
        });
      }
      const violations = await client.getViolations(month);
      return NextResponse.json({ count: violations.length, violations });
    }

    if (action === 'payment-status') {
      if (!ref) return NextResponse.json({ error: 'ref مطلوب' }, { status: 400 });
      const status = client
        ? await client.getPaymentStatus(ref)
        : MudadAPI.mockResponse('status');
      return NextResponse.json(status);
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('Mudad GET error:', error);
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body   = await request.json();
    const action = body.action;
    const client = await getMudadClient(prisma);

    // ── Submit payroll file ────────────────────────────────────────────
    if (action === 'submit') {
      const { payrollRunId, bankCode } = body;
      if (!payrollRunId || !bankCode) {
        return NextResponse.json({ error: 'payrollRunId و bankCode مطلوبان' }, { status: 400 });
      }

      // Fetch WPS batch for this payroll run
      const batch = await prisma.wPSBatch.findFirst({
        where:   { payrollRunId: parseInt(payrollRunId) },
        include: { items: true },
      }).catch(() => null);

      if (!batch || !batch.fileContent) {
        return NextResponse.json({ error: 'ملف SIF غير موجود — قم بتوليده أولاً' }, { status: 404 });
      }

      // Get payroll run date
      const run = await prisma.payrollRun.findUnique({
        where:  { id: parseInt(payrollRunId) },
        select: { month: true, year: true, totalAmount: true },
      }).catch(() => null);

      const payrollMonth = run?.year && run?.month
        ? `${run.year}-${String(run.month).padStart(2, '0')}`
        : new Date().toISOString().substring(0, 7);

      const submitResult = client
        ? await client.submitPayrollFile({
            payrollMonth,
            bankCode,
            sifContent:     batch.fileContent,
            totalAmount:    Number(batch.totalAmount  || 0),
            totalEmployees: Number(batch.totalEmployees || 0),
          })
        : MudadAPI.mockResponse('submit');

      // Update batch status in DB
      await prisma.wPSBatch.update({
        where: { id: batch.id },
        data:  {
          status:         'UPLOADED',
          uploadedAt:     new Date(),
          mudadReference: (submitResult as any).referenceId || null,
        } as any,
      }).catch(() => null);

      log.info(`Mudad submit: payrollRun=${payrollRunId}, ref=${(submitResult as any).referenceId}`);
      return NextResponse.json({
        ...submitResult,
        batchId:  batch.id,
        source:   client ? 'live' : 'sandbox-mock',
      });
    }

    // ── Confirm payment ────────────────────────────────────────────────
    if (action === 'confirm') {
      const { referenceId } = body;
      if (!referenceId) return NextResponse.json({ error: 'referenceId مطلوب' }, { status: 400 });

      const result = client
        ? await client.confirmPayment(referenceId)
        : { confirmed: true, confirmedAt: new Date().toISOString() };

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('Mudad POST error:', error);
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 });
  }
}
