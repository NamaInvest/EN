import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { RecruitmentEngine } from '@/lib/recruitment-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    const jobId = req.nextUrl.searchParams.get('jobId');
    try {
        if (jobId) {
            const pipeline = await RecruitmentEngine.getPipeline(prisma, parseInt(jobId));
            return NextResponse.json({ pipeline });
        }
        const jobs = await RecruitmentEngine.listJobs(prisma);
        return NextResponse.json({ jobs });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'create_job') return NextResponse.json(await RecruitmentEngine.createJob(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'apply') return NextResponse.json(await RecruitmentEngine.applyToJob(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'move') return NextResponse.json(await RecruitmentEngine.moveStage(prisma, body.applicationId, body.stage, body.notes));
        if (body.action === 'hire') return NextResponse.json(await RecruitmentEngine.convertToEmployee(prisma, body.applicationId));
        return NextResponse.json({ error: 'action: create_job | apply | move | hire' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
