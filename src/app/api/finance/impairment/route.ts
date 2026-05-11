import { NextResponse } from 'next/server';
import { ImpairmentEngine } from '@/lib/impairment-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const tenantId = searchParams.get('tenantId') || 'default';

    const asOfDate = dateParam ? new Date(dateParam) : new Date();

    const report = await ImpairmentEngine.calculateImpairment(tenantId, asOfDate);

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
}
