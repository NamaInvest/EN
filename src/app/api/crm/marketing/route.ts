import { NextRequest, NextResponse } from 'next/server';
import { MarketingAutomationEngine } from '@/lib/marketing-automation-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'segment') {
    const segment = await MarketingAutomationEngine.createSegment(body.tenantId, body.name, body.filterJson);
    return NextResponse.json({ segment }, { status: 201 });
  }
  if (body.type === 'journey') {
    const journey = await MarketingAutomationEngine.createJourney(body.campaignId, body.journey);
    return NextResponse.json({ journey }, { status: 201 });
  }
  if (body.type === 'refresh') {
    const segment = await MarketingAutomationEngine.refreshSegment(body.tenantId, body.segmentId);
    return NextResponse.json({ segment });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
