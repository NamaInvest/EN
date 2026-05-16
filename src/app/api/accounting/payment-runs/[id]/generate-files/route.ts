import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.payment-runs.id.generate-file' });


const _POSTSchema = z.object({
  formats: z.any().optional(),
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
        const { formats, userId } = body;
        const runId = parseInt(paramId, 10);

        const run = await prisma.paymentRun.findUnique({
            where: { id: runId, tenantId },
            include: { lines: true }
        });

        if (!run || run.status !== 'APPROVED') {
            throw new Error("Payment run must be APPROVED to generate files");
        }

        // Mock generating bank files (SARIE, SEPA, etc.)
        for (const format of formats) {
            await prisma.paymentRunBankFile.create({
                data: {
                    tenantId,
                    runId,
                    fileFormat: format,
                    bankAccountId: run.bankAccountId,
                    fileUrl: `https://storage.mock.com/bank-files/${runId}_${format}.xml`,
                    fileName: `${run.runNumber}_${format}.xml`,
                    fileHash: `mockhash_${Date.now()}`,
                    fileSizeBytes: 1024,
                    generatedByUserId: userId || 'system',
                    txnCount: run.lines.length,
                    totalAmount: run.totalAmount,
                    currency: run.currency
                }
            });
        }

        const updatedRun = await prisma.paymentRun.update({
            where: { id: runId, tenantId },
            data: {
                status: 'FILE_GENERATED',
                filesGeneratedAt: new Date()
            }
        });

        return NextResponse.json(updatedRun);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
