import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse } from 'next/server';
import { MesOeeEngine } from '@/lib/mes-oee-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    try {
    const { searchParams } = new URL(req.url);


    const report = await MesOeeEngine.getFactoryStatus(tenant);

    return NextResponse.json({
      success: true,
      data: report,
    });
    } catch (error: any) {
    console.error('MES OEE API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate MES report', details: error?.message },
      { status: 500 }
    );
    }
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
