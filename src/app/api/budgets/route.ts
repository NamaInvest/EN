import { getUserFromRequest } from '@/lib/auth';
/**
 * Budget Management API
 * GET  /api/budgets — List budgets  
 * POST /api/budgets — Create/update budget
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const db = (p: any) => p as any;

export async function GET(req: NextRequest) {
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

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    try {
        const body = await req.json();
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
