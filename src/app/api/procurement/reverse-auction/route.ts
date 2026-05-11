import { NextRequest, NextResponse } from 'next/server';
import { ReverseAuctionEngine } from '@/lib/reverse-auction-engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'create') {
    const auction = await ReverseAuctionEngine.createAuction(body.tenantId, body.rfqId, body.title, new Date(body.startTime), new Date(body.endTime));
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
}
