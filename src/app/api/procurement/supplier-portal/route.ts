import { NextRequest, NextResponse } from 'next/server';
import { SupplierPortalEngine } from '@/lib/supplier-portal-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const supplierId = Number(searchParams.get('supplierId'));
  const view = searchParams.get('view') ?? 'pos';
  if (view === 'invoices') return NextResponse.json({ invoices: await SupplierPortalEngine.getInvoiceHistory(supplierId) });
  return NextResponse.json({ pos: await SupplierPortalEngine.getOpenPOs(supplierId) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'invoice') {
    const invoice = await SupplierPortalEngine.submitInvoice(body.supplierId, body.purchaseOrderId, body.invoiceNo, body.totalAmount, new Date(body.invoiceDate));
    return NextResponse.json({ invoice }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
