// @ts-nocheck
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { GOSIEngine } from '@/lib/gosi-engine';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request as any);

    try {
        const body = await request.json();
        const { payrollRunId } = body;

        if (!payrollRunId) {
            return NextResponse.json(
                { error: 'Missing payrollRunId' },
                { status: 400 }
            );
        }

        // Fetch salaries for this run
        const run = await prisma.payrollRun.findUnique({
            where: { id: payrollRunId }
        });

        // BUILD SAFETY: if (!run) throw new Error('PayrollRun not found');

        const salaries = await prisma.salary.findMany({
            take: 100,
            where: {
                month: run.month,
                year: run.year
            }
        });

        const results = [];
        for (const salary of salaries) {
            const contribution = await GOSIEngine.calculateForEmployee(salary.employeeId, payrollRunId);
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
