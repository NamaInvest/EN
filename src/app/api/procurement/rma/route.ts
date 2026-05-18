import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { RMAEngine } from '@/lib/rma-engine';

export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
  const body = await req.json();
  if (body.type === 'create') return NextResponse.json(await RMAEngine.create(tenant, body), { status: 201 });
  if (body.type === 'approve') return NextResponse.json(await RMAEngine.approve(body.rmaId, body.approvedBy));
  if (body.type === 'receive') return NextResponse.json(await RMAEngine.receive(body.rmaId, body.receivedBy));
  if (body.type === 'inspect') return NextResponse.json(await RMAEngine.inspect(body.rmaId, body.lineId, body.disposition));
  if (body.type === 'resolve') return NextResponse.json(await RMAEngine.resolve(body.rmaId, body.resolution, body.resolvedBy));
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}, { rateLimit: 'DEFAULT', tenantRequired: true });

export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
  const metrics = await RMAEngine.getMetrics(tenant);
  return NextResponse.json({ metrics });
}, { rateLimit: 'DEFAULT', tenantRequired: true });
