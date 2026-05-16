import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.payment-runs.id.upload-confir' });


const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const { id: paramId } = await params;
    try {
        const tenantId = requireTenantId(req as any);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { userId } = body;
        const runId = parseInt(paramId, 10);

        const run = await prisma.paymentRun.findUnique({
            where: { id: runId, tenantId },
            include: { lines: true }
        });

        if (!run || run.status !== 'FILE_GENERATED' && run.status !== 'SENT_TO_BANK') {
            throw new Error("Payment run must be in FILE_GENERATED or SENT_TO_BANK status");
        }

        // Mock parsing bank confirmation
        // In real world, we would parse the uploaded file and update each line status
        for (const line of run.lines) {
            await prisma.paymentRunLine.update({
                where: { id: line.id, tenantId },
                data: {
                    status: 'CONFIRMED',
                    bankConfirmedAt: new Date(),
                    externalReference: `BANK-REF-${Date.now()}`
                }
            });
        }

        const updatedRun = await prisma.paymentRun.update({
            where: { id: runId, tenantId },
            data: {
                status: 'CONFIRMED',
                confirmedAt: new Date(),
                confirmedByUserId: userId || 'system',
                successCount: run.lines.length,
                failedCount: 0
            }
        });

        return NextResponse.json(updatedRun);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'UPLOAD' });
