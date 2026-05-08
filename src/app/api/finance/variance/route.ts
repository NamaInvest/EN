import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { VarianceEngine } from '@/lib/variance-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const engine = new VarianceEngine(prisma as any);
        const variances = await engine.getVariances();
        
        return NextResponse.json(variances);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action } = body;
        const engine = new VarianceEngine(prisma as any);

        if (action === 'post_gl') {
            const postedCount = await engine.postVariancesToGL(auth.userId.toString());
            return NextResponse.json({ message: 'تم ترحيل الانحرافات بنجاح', count: postedCount });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}
