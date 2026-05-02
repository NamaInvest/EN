// @ts-nocheck
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { GOSIEngine } from '@/lib/gosi-engine';

export async function POST(request: Request) {
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

        if (!run) throw new Error('PayrollRun not found');

        const salaries = await prisma.salary.findMany({
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
