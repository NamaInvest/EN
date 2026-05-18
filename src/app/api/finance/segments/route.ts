import { NextRequest, NextResponse } from 'next/server';
import { SegmentReportingEngine } from '@/lib/segment-reporting-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    const { searchParams } = new URL(req.url);

    const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
    const report   = await SegmentReportingEngine.getReport(tenant, period);
    const tests    = await SegmentReportingEngine.testReportability(tenant, period);
    return NextResponse.json({ report, reportabilityTests: tests });
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
