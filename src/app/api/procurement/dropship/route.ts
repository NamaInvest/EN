import { NextRequest, NextResponse } from 'next/server';
import { DropShipEngine } from '@/lib/dropship-engine';

export async function POST(req: NextRequest) {
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
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const soId = Number(searchParams.get('soId'));
  const link = await DropShipEngine.getLink(soId);
  return NextResponse.json({ link });
}
