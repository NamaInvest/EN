import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { GOSIEngine } from '@/lib/gosi-engine';

import { getUserFromRequest } from '@/lib/auth';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.gosi.calculate' });

const _POSTSchema = z.object({
  payrollRunId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request as any);
    const tenantId = requireTenantId(request as any);

    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { payrollRunId } = body;

        if (!payrollRunId) {
            return NextResponse.json(
                { error: 'Missing payrollRunId' },
                { status: 400 }
            );
        }

        const run = await prisma.payrollRun.findUnique({
            where: { id: payrollRunId, tenantId }
        });

        if (!run) return NextResponse.json({ error: 'PayrollRun not found' }, { status: 404 });

        const salaries = await prisma.salary.findMany({
            where: { month: run.month, year: run.year, tenantId },
            include: { employee: true }
        });

        const results = [];
        for (const salary of salaries) {
            const basic = Number(salary.basicSalary || 0);
            const housing = Number(salary.employee?.housingAllowance || 0);
            const contribution = GOSIEngine.calculateForEmployee(salary.employee, basic, housing);
            results.push(contribution);
        }

        return NextResponse.json({
            message: 'GOSI Calculated for all employees in run',
            count: results.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
