import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ReverseAuctionEngine } from '@/lib/reverse-auction-engine';

export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
  const body = await req.json();
  if (body.type === 'create') {
    const auction = await ReverseAuctionEngine.createAuction(tenant, body.rfqId, body.title, new Date(body.startTime), new Date(body.endTime));
    return NextResponse.json({ auction }, { status: 201 });
  }
  if (body.type === 'bid') {
    const bid = await ReverseAuctionEngine.placeBid(body.auctionId, body.vendorId, body.amount);
    return NextResponse.json({ bid }, { status: 201 });
  }
  if (body.type === 'close') {
    const result = await ReverseAuctionEngine.closeAuction(body.auctionId);
    return NextResponse.json({ result });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}, { rateLimit: 'DEFAULT', tenantRequired: true });
