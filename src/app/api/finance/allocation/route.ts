/**
 * Allocation Engine API Routes
 * GET  — List allocation rules and runs
 * POST — Execute allocation run
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { AllocationEngine } from '@/lib/allocation-engine';

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // List allocation JEs
        const entries = await prisma.journalEntry.findMany({
            where: { reference: { startsWith: 'ALLOC' } },
            include: { lines: { include: { account: { select: { code: true, name: true } } } } },
            orderBy: { date: 'desc' },
            take: 20
        });

        return NextResponse.json({ success: true, entries });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { periodEndDate } = body;

        const result = await AllocationEngine.runAllocation(
            periodEndDate || new Date().toISOString().split('T')[0],
            user.id
        );

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
