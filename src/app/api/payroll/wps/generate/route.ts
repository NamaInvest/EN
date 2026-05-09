// @ts-nocheck
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { WPSGenerator } from '@/lib/wps-generator';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _POSTSchema = z.object({
  payrollRunId: z.union([z.string(), z.number()]).optional(),
  bankCode: z.any().optional(),
  companyId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request as any);

    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { payrollRunId, bankCode, companyId } = body;

        if (!payrollRunId || !bankCode || !companyId) {
            return NextResponse.json(
                { error: 'Missing required fields: payrollRunId, bankCode, companyId' },
                { status: 400 }
            );
        }

        const result = await WPSGenerator.generateSIF(payrollRunId, bankCode, companyId);

        return NextResponse.json({
            message: 'WPS Batch generated successfully',
            batchId: result.batchId,
            fileName: result.fileName,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
