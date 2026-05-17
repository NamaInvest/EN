import { NextResponse } from 'next/server';
import { SuccessionEngine } from '@/lib/succession-engine';
import { requireTenantId } from '@/lib/tenant/tenant-guard';

export async function GET(request: Request) {
  try {
    const tenantId = requireTenantId(request as any);

    const report = await SuccessionEngine.generateNineBox(tenantId);

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
}
