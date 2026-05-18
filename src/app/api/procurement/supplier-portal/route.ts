import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { SupplierPortalEngine } from '@/lib/supplier-portal-engine';

export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
  const { searchParams } = new URL(req.url);
  const supplierId = Number(searchParams.get('supplierId'));
  const view = searchParams.get('view') ?? 'pos';
  if (view === 'invoices') return NextResponse.json({ invoices: await SupplierPortalEngine.getInvoiceHistory(supplierId) });
  return NextResponse.json({ pos: await SupplierPortalEngine.getOpenPOs(supplierId) });
}, { rateLimit: 'DEFAULT', tenantRequired: true });

export const POST = withRoute(async ({ req, prisma, auth, tenant }) => {
  const body = await req.json();
  if (body.type === 'invoice') {
    const invoice = await SupplierPortalEngine.submitInvoice(body.supplierId, body.purchaseOrderId, body.invoiceNo, body.totalAmount, new Date(body.invoiceDate));
    return NextResponse.json({ invoice }, { status: 201 });
  }
  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}, { rateLimit: 'DEFAULT', tenantRequired: true });
