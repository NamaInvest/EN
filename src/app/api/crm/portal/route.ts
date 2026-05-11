import { NextRequest, NextResponse } from 'next/server';
import { CustomerPortalEngine } from '@/lib/customer-portal-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = Number(searchParams.get('customerId'));
  const view = searchParams.get('view') ?? 'dashboard';
  if (view === 'dashboard') return NextResponse.json(await CustomerPortalEngine.getDashboard(customerId));
  if (view === 'order')     return NextResponse.json(await CustomerPortalEngine.trackOrder(Number(searchParams.get('orderId')), customerId));
  if (view === 'invoice')   return NextResponse.json(await CustomerPortalEngine.getInvoiceInfo(Number(searchParams.get('invoiceId')), customerId));
  return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'ticket') return NextResponse.json(await CustomerPortalEngine.raiseTicket(body.customerId, body.subject, body.description, body.priority), { status: 201 });
  if (body.type === 'pay')    return NextResponse.json(await CustomerPortalEngine.makePayment(body.invoiceId, body.customerId, body.amount, body.method));
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
