import { NextResponse } from 'next/server';
import { BadDebtEngine } from '@/lib/bad-debt-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    try {
    const { searchParams } = new URL(req.url);


    const report = await BadDebtEngine.calculateProvision(tenant);

    return NextResponse.json({
      success: true,
      data: report,
    });
    } catch (error: any) {
    console.error('Bad Debt Provision API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Bad Debt Provision report', details: error?.message },
      { status: 500 }
    );
    }
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
