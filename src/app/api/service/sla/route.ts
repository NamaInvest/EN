import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { ServiceSLAEngine } from '@/lib/service-sla';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    const contractId = req.nextUrl.searchParams.get('contractId');
    try {
        const result = await ServiceSLAEngine.evaluateSLA(prisma, contractId ? parseInt(contractId) : undefined);
        return NextResponse.json(result);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
