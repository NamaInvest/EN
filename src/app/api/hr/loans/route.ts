import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.loans' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const loans = await prisma.employeeLoan.findMany({
            take: 100,
            include: { employee: true },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(loans);
    } catch (error: any) {
        log.error("Loans GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  amount: z.number().optional(),
  monthlyDeduction: z.union([z.string(), z.number()]).optional(),
  reason: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { employeeId, amount, monthlyDeduction, reason } = body;

        if (!employeeId || !amount || !monthlyDeduction) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const loan = await prisma.employeeLoan.create({
            data: {
                employeeId: parseInt(employeeId),
                amount: parseFloat(amount),
                monthlyDeduction: parseFloat(monthlyDeduction),
                remainingAmount: parseFloat(amount),
                reason: reason || null,
                startDate: new Date(),
                status: 'active'
            }
        });

        return NextResponse.json(loan, { status: 201 });
    } catch (error: any) {
        log.error("Loans POST error:", error);
        return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
