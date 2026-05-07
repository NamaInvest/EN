/**
 * Project EVM API
 * GET /api/projects/evm?projectId=X — EVM metrics for one project
 * GET /api/projects/evm?view=portfolio — Portfolio dashboard
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { WBSEngine } from '@/lib/wbs-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req);
    const view = req.nextUrl.searchParams.get('view');
    const projectId = req.nextUrl.searchParams.get('projectId');

    try {
        if (view === 'portfolio') {
            const metrics = await WBSEngine.portfolioEVM(prisma);
            return NextResponse.json(metrics);
        }

        if (projectId) {
            const evm = await WBSEngine.calculateEVM(prisma, parseInt(projectId));
            return NextResponse.json(evm);
        }

        return NextResponse.json({ error: 'مطلوب: projectId أو view=portfolio' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
