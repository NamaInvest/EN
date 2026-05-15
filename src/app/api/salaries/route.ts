import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { round2 } from '@/lib/money';
import { salaryCreateSchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-handler';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withTransaction, runFinancialTx } from '@/lib/db/transaction';

const log = logger.child({ service: 'salaries' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const salaries = await prisma.salary.findMany({ take: 100, 
            include: { employee: { select: { id: true, name: true, position: true,  phone: true } } }, 
            orderBy: { id: 'desc' } 
        });
        return NextResponse.json(salaries);
    } catch (e: any) {
 log.error('src/app/api/salaries/route.ts', { error: e instanceof Error ? e.message : e });
 return handleApiError(e); }
}

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const rawBody = await request.json();
        // Zod validation - no negative amounts, valid IDs, no mass assignment
        const body = salaryCreateSchema.parse(rawBody);

        const basic = Number(body.basicSalary);
        const additions = Number(body.additions || 0);
        const deductions = Number(body.deductions || 0);
        const net = basic + additions - deductions;

        if (net < 0) {
            return NextResponse.json({ error: 'صافي الراتب لا يمكن أن يكون سالباً (الخصومات أكبر من الأساس + الإضافات)' }, { status: 400 });
        }

        // Atomic transaction: create salary AND treasury deduction together
        const salary = await runFinancialTx(prisma, async (tx: any) => {
            const newSalary = await tx.salary.create({
                data: {
                    employeeId: Number(body.employeeId),
                    month: body.month,
                    year: body.year,
                    basicSalary: basic,
                    additions,
                    deductions,
                    netSalary: round2(net),
                    notes: body.notes || null,
                },
                include: { employee: { select: { id: true, name: true, position: true,  phone: true } } },
            });

            // Treasury out - only if net > 0
            if (net > 0) {
                await tx.treasury.create({ 
                    data: { 
                        type: 'out', 
                        amount: net, 
                        description: `راتب ${newSalary.employee.name} - ${body.month}/${body.year}`, 
                        referenceType: 'salary', 
                        referenceId: newSalary.id, 
                        userId: body.userId ? Number(body.userId) : null 
                    } 
                });
            }

            return newSalary;
        });

        return NextResponse.json(salary, { status: 201 });
    } catch (e: any) {
 log.error('src/app/api/salaries/route.ts', { error: e instanceof Error ? e.message : e });
 return handleApiError(e); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
