// @ts-nocheck
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { WPSGenerator } from '@/lib/wps-generator';
import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'payroll.wps.generate' });

const _POSTSchema = z.object({
  payrollRunId: z.union([z.string(), z.number()]),
  bankCode: z.string(),
  companyId: z.union([z.string(), z.number()]).optional(),
  employerId: z.union([z.string(), z.number()]).optional(),
  employerName: z.string().optional(),
  employerMOLId: z.string().optional(),
});

async function _POST(request: Request) {
    const prisma = getPrisma(request as any);

    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || !['admin', 'hr', 'hr_manager', 'payroll_admin'].includes(auth.role)) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        }
        const tenantId = requireTenantId(request as any);

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { payrollRunId, bankCode, companyId, employerId, employerName, employerMOLId } = body;
        const empId = employerId || companyId;

        if (!payrollRunId || !bankCode || !empId) {
            return NextResponse.json(
                { error: 'Missing required fields: payrollRunId, bankCode, companyId/employerId' },
                { status: 400 }
            );
        }

        const result = await WPSGenerator.generateSIF(
            prisma,
            tenantId,
            parseInt(payrollRunId),
            bankCode,
            String(empId),
            employerName || 'نما للاستثمار',
            employerMOLId || '1000000000'
        );

        return NextResponse.json({
            message: 'WPS Batch generated successfully',
            batchId: result.batchId,
            fileName: result.fileName,
        });
    } catch (error: any) {
        log.error('Generate SIF error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
