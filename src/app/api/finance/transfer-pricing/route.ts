import { NextResponse } from 'next/server';
import { TransferPricingEngine } from '@/lib/transfer-pricing-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const minParam = searchParams.get('min');
    const maxParam = searchParams.get('max');
    const tenantId = searchParams.get('tenantId') || 'default';

    const asOfDate = dateParam ? new Date(dateParam) : new Date();
    const minBenchmark = minParam ? parseFloat(minParam) : 0.05;
    const maxBenchmark = maxParam ? parseFloat(maxParam) : 0.15;

    if (isNaN(minBenchmark) || isNaN(maxBenchmark) || minBenchmark >= maxBenchmark) {
      return NextResponse.json({ error: 'Invalid benchmark ranges.' }, { status: 400 });
    }

    const report = await TransferPricingEngine.evaluateTransactions(tenantId, asOfDate, minBenchmark, maxBenchmark);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Transfer Pricing API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Transfer Pricing report', details: error?.message },
      { status: 500 }
    );
  }
}
