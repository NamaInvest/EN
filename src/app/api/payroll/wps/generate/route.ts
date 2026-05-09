// @ts-nocheck
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { WPSGenerator } from '@/lib/wps-generator';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request as any);

    try {
        const body = await request.json();
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
