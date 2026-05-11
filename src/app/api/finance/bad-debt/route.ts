import { NextResponse } from 'next/server';
import { BadDebtEngine } from '@/lib/bad-debt-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';

    const report = await BadDebtEngine.calculateProvision(tenantId);

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
}
