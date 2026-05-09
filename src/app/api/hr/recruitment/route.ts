import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { RecruitmentEngine } from '@/lib/recruitment-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
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


const _POSTSchema = z.object({
  action: z.any().optional(),
  applicationId: z.union([z.string(), z.number()]).optional(),
  stage: z.any().optional(),
  notes: z.any().optional(),
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
        if (body.action === 'create_job') return NextResponse.json(await RecruitmentEngine.createJob(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'apply') return NextResponse.json(await RecruitmentEngine.applyToJob(prisma, { ...body, tenantId: (user as any).tenantId || '' }));
        if (body.action === 'move') return NextResponse.json(await RecruitmentEngine.moveStage(prisma, body.applicationId, body.stage, body.notes));
        if (body.action === 'hire') return NextResponse.json(await RecruitmentEngine.convertToEmployee(prisma, body.applicationId));
        return NextResponse.json({ error: 'action: create_job | apply | move | hire' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
