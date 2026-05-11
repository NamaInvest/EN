import { NextResponse } from 'next/server';
import { RFxAuctionEngine } from '@/lib/rfx-auction-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';

    const report = await RFxAuctionEngine.evaluateAuctions(tenantId);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('RFx Auction API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate RFx report', details: error?.message },
      { status: 500 }
    );
  }
}
