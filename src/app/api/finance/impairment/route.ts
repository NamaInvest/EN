import { NextResponse } from 'next/server';
import { ImpairmentEngine } from '@/lib/impairment-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');


    const asOfDate = dateParam ? new Date(dateParam) : new Date();

    const report = await ImpairmentEngine.calculateImpairment(tenant, asOfDate);

    return NextResponse.json({
      success: true,
      data: report,
    });
    } catch (error: any) {
    console.error('Impairment API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Impairment report', details: error?.message },
      { status: 500 }
    );
    }
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
