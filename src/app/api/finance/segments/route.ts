import { NextRequest, NextResponse } from 'next/server';
import { SegmentReportingEngine } from '@/lib/segment-reporting-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? '1';
  const period   = searchParams.get('period') ?? new Date().toISOString().slice(0, 7);
  const report   = await SegmentReportingEngine.getReport(tenantId, period);
  const tests    = await SegmentReportingEngine.testReportability(tenantId, period);
  return NextResponse.json({ report, reportabilityTests: tests });
}
