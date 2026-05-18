import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { DropShipEngine } from '@/lib/dropship-engine';

export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
  const body = await req.json();
  if (body.type === 'link') {
    const link = await DropShipEngine.linkSOtoPO(body.soId, body.poId);
    return NextResponse.json({ link }, { status: 201 });
  }
  if (body.type === 'confirm_shipment') {
    const result = await DropShipEngine.confirmShipment(body.soId, body.trackingNumber, body.carrierId);
    return NextResponse.json({ result });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}, { rateLimit: 'DEFAULT', tenantRequired: true });

export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
  const { searchParams } = new URL(req.url);
  const soId = Number(searchParams.get('soId'));
  const link = await DropShipEngine.getLink(soId);
  return NextResponse.json({ link });
}, { rateLimit: 'DEFAULT', tenantRequired: true });
