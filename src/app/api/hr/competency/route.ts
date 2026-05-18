import { NextRequest, NextResponse } from 'next/server';
import { CompetencyEngine } from '@/lib/competency-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'assess') {
    const result = await CompetencyEngine.assessEmployee(tenant, body.employeeId, body.competencyId, body.level, body.assessedBy);
    return NextResponse.json({ result }, { status: 201 });
    }
    if (body.type === 'gap') {
    const gaps = await CompetencyEngine.getGaps(tenant, body.employeeId, body.targetJobId);
    return NextResponse.json({ gaps });
    }
    if (body.type === 'paths') {
    const paths = await CompetencyEngine.getCareerPaths(tenant, body.fromJobId);
    return NextResponse.json({ paths });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
