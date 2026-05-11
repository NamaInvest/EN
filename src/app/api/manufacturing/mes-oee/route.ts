import { NextResponse } from 'next/server';
import { MesOeeEngine } from '@/lib/mes-oee-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';

    const report = await MesOeeEngine.getFactoryStatus(tenantId);

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
}
