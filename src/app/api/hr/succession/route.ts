import { NextResponse } from 'next/server';
import { SuccessionEngine } from '@/lib/succession-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    try {

    const report = await SuccessionEngine.generateNineBox(tenant);

    return NextResponse.json({
      success: true,
      data: report,
    });
    } catch (error: any) {
    console.error('Succession API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate 9-Box report', details: error?.message },
      { status: 500 }
    );
    }
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
