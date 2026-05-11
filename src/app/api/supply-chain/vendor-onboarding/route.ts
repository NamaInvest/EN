import { NextResponse } from 'next/server';
import { VendorOnboardingEngine } from '@/lib/vendor-onboarding-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';

    const report = await VendorOnboardingEngine.evaluateVendors(tenantId);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Vendor Onboarding API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Vendor report', details: error?.message },
      { status: 500 }
    );
  }
}
