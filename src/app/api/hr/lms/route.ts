import { NextRequest, NextResponse } from 'next/server';
import { LMSEngine } from '@/lib/lms-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from "@/lib/api/with-route";
export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
    const body = await req.json();
    if (body.type === 'enroll') {
    const enrollment = await LMSEngine.enroll(tenant, body.employeeId, body.courseId);
    return NextResponse.json({ enrollment }, { status: 201 });
    }
    if (body.type === 'progress') {
    const enrollment = await LMSEngine.updateProgress(tenant, body.enrollmentId, body.score);
    return NextResponse.json({ enrollment });
    }
    if (body.type === 'complete') {
    const enrollment = await LMSEngine.complete(tenant, body.enrollmentId);
    return NextResponse.json({ enrollment });
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const catalog = await LMSEngine.getCatalog(tenant);
    return NextResponse.json({ catalog });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
