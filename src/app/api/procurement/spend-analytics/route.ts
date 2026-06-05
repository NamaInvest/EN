import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { SpendAnalyticsEngine } from '@/lib/spend-analytics-engine';

export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
  const body = await req.json();
  if (body.type === 'classify') {
    const result = await SpendAnalyticsEngine.classify(prisma, tenant, body.transactionType, body.transactionId, body.description, body.categoryId);
    return NextResponse.json({ result }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}, { rateLimit: 'DEFAULT', tenantRequired: true });

export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
  const cube = await SpendAnalyticsEngine.buildCube(prisma, tenant);
  return NextResponse.json({ cube });
}, { rateLimit: 'DEFAULT', tenantRequired: true });
