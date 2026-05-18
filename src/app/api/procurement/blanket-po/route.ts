import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { BlanketPOEngine } from '@/lib/blanket-po-engine';

export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
  const body = await req.json();
  if (body.type === 'create') {
    const bpo = await BlanketPOEngine.create(tenant, { poNumber: body.poNumber, vendorId: body.vendorId, validFrom: new Date(body.validFrom), validTo: new Date(body.validTo), totalValue: body.totalValue });
    return NextResponse.json({ bpo }, { status: 201 });
  }
  if (body.type === 'release') {
    const release = await BlanketPOEngine.release(body.blanketPoId, body.releaseNumber, body.quantity, body.amount);
    return NextResponse.json({ release }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}, { rateLimit: 'DEFAULT', tenantRequired: true });
