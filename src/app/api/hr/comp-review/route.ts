import { NextRequest, NextResponse } from 'next/server';
import { CompReviewEngine } from '@/lib/comp-review-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'cycle') {
    const cycle = await CompReviewEngine.initCycle(tenant, body.name, body.fiscalYear, body.budgetPool);
    return NextResponse.json({ cycle }, { status: 201 });
    }
    if (body.type === 'propose') {
    const proposal = await CompReviewEngine.proposeIncrease(tenant, body.cycleId, body.employeeId, body.currentSalary, body.proposedIncrease);
    return NextResponse.json({ proposal }, { status: 201 });
    }
    if (body.type === 'approve') {
    const result = await CompReviewEngine.approve(tenant, body.id);
    return NextResponse.json({ result });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);
    const cycleId = Number(searchParams.get('cycleId'));
    const utilization = await CompReviewEngine.getBudgetUtilization(tenant, cycleId);
    return NextResponse.json({ utilization });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
