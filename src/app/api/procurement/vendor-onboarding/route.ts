import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { VendorOnboardingEngine } from '@/lib/vendor-onboarding-engine';

export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
  const body = await req.json();
  if (body.type === 'initiate') {
    const app = await VendorOnboardingEngine.initiate(tenant, body.applicationData ?? {});
    return NextResponse.json({ app }, { status: 201 });
  }
  if (body.type === 'advance') {
    const app = await VendorOnboardingEngine.advanceStage(body.id, body.stage, body.updates ?? {});
    return NextResponse.json({ app });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}, { rateLimit: 'DEFAULT', tenantRequired: true });
