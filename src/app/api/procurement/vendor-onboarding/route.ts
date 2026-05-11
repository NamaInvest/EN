import { NextRequest, NextResponse } from 'next/server';
import { VendorOnboardingEngine } from '@/lib/vendor-onboarding-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'initiate') {
    const app = await VendorOnboardingEngine.initiate(body.tenantId, body.applicationData ?? {});
    return NextResponse.json({ app }, { status: 201 });
  }
  if (body.type === 'advance') {
    const app = await VendorOnboardingEngine.advanceStage(body.id, body.stage, body.updates ?? {});
    return NextResponse.json({ app });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
