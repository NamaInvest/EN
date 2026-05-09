import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * Budget Management API
 * GET  /api/budgets — List budgets  
 * POST /api/budgets — Create/update budget
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

const db = (p: any) => p as any;

async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const fiscalYearId = req.nextUrl.searchParams.get('fiscalYearId');
        const where: any = {};
        if (fiscalYearId) where.fiscalYearId = parseInt(fiscalYearId);

        const budgets = await db(prisma).budget.findMany({
            where,
            include: { lines: { take: 50 } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return NextResponse.json(budgets);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  fiscalYearId: z.union([z.string(), z.number()]).optional(),
  type: z.any().optional(),
  version: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (!body.name || !body.fiscalYearId) {
            return NextResponse.json({ error: 'مطلوب: name, fiscalYearId' }, { status: 400 });
        }

        const budget = await db(prisma).budget.create({
            data: {
                name: body.name,
                fiscalYearId: body.fiscalYearId,
                type: body.type || 'ANNUAL',
                status: 'DRAFT',
                version: body.version || 1,
            },
        });
        return NextResponse.json(budget, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
