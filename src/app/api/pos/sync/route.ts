import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

// POST: Sync offline sales to server
import { getUserFromRequest } from '@/lib/auth';
export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const { sales } = await request.json();
    if (!sales || !Array.isArray(sales)) {
      return NextResponse.json({ error: 'sales array required' }, { status: 400 });
    }

    const results = [];
    for (const sale of sales) {
      try {
        // Create the invoice from offline sale
        const invoice = await (prisma as any).invoice.create({
          data: {
            invoiceNo: sale.invoiceNo || `OFF-${Date.now()}`,
            type: 'SALES',
            partyId: sale.customerId || null,
            date: sale.createdAt ? new Date(sale.createdAt) : new Date(),
            subtotal: parseFloat(sale.subtotal) || 0,
            taxAmount: parseFloat(sale.tax) || 0,
            discountAmount: parseFloat(sale.discount) || 0,
            total: parseFloat(sale.total) || 0,
            paidAmount: parseFloat(sale.paid) || 0,
            status: 'PAID',
            notes: `[OFFLINE SYNC] ${sale.offlineId || ''}`,
            tenantId: sale.tenantId || 'default',
          }
        });

        // Create invoice items
        if (sale.items && Array.isArray(sale.items)) {
          for (const item of sale.items) {
            await (prisma as any).invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                productId: item.productId || null,
                description: item.name || item.description || '',
                quantity: parseFloat(item.qty) || 1,
                unitPrice: parseFloat(item.price) || 0,
                taxRate: parseFloat(item.taxRate) || 15,
                total: parseFloat(item.total) || 0,
              }
            });
          }
        }

        results.push({ offlineId: sale.id, serverId: invoice.id, status: 'synced' });
      } catch (itemError: any) {
        results.push({ offlineId: sale.id, status: 'error', error: itemError.message });
      }
    }

    return NextResponse.json({
      synced: results.filter(r => r.status === 'synced').length,
      errors: results.filter(r => r.status === 'error').length,
      results
    });
  } catch (e: any) {
    return apiError(e, 'Sync Error', { context: 'pos/sync' });
  }
}

// GET: Get data for offline cache (products + customers)
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const products = await (prisma as any).product.findMany({
      select: { id: true, name: true, barcode: true, salePrice: true, taxRate: true, stockQty: true, category: true },
      where: { isActive: true },
      take: 5000
    });
    const customers = await (prisma as any).party.findMany({
      select: { id: true, name: true, phone: true, email: true },
      where: { type: 'CUSTOMER' },
      take: 2000
    });
    return NextResponse.json({
      products: products || [],
      customers: customers || [],
      cachedAt: new Date().toISOString()
    });
  } catch (e: any) {
    return apiError(e, 'Cache Error', { context: 'pos/sync' });
  }
}
