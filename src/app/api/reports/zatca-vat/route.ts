import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '2026-Q1';
        
        const [year, quarter] = period.split('-Q');
        const startDate = new Date(`${year}-${(parseInt(quarter) - 1) * 3 + 1}-01T00:00:00.000Z`);
        const endDate = new Date(new Date(`${year}-${parseInt(quarter) * 3 + 1}-01T00:00:00.000Z`).getTime() - 1);

        const dateFilter = { date: { gte: startDate, lte: endDate } };

        // Sales Aggregation
        const sales15 = await prisma.salesInvoice.aggregate({
            _sum: { subtotal: true, taxValue: true },
            where: { ...dateFilter, taxValue: { gt: 0 } }
        });
        const sales0 = await prisma.salesInvoice.aggregate({
            _sum: { subtotal: true },
            where: { ...dateFilter, taxValue: { equals: 0 } }
        });

        // Purchases Aggregation
        const purchases15 = await prisma.purchaseInvoice.aggregate({
            _sum: { subtotal: true, taxValue: true },
            where: { ...dateFilter, taxValue: { gt: 0 } }
        });
        const purchases0 = await prisma.purchaseInvoice.aggregate({
            _sum: { subtotal: true },
            where: { ...dateFilter, taxValue: { equals: 0 } }
        });

        return NextResponse.json({
            sales: {
                standard: { amount: sales15._sum.subtotal || 0, adjustment: 0, vat: sales15._sum.taxValue || 0 },
                zeroRated: { amount: sales0._sum.subtotal || 0, adjustment: 0, vat: 0 },
                exports: { amount: 0, adjustment: 0, vat: 0 },
                exempt: { amount: 0, adjustment: 0, vat: 0 }
            },
            purchases: {
                standard: { amount: purchases15._sum.subtotal || 0, adjustment: 0, vat: purchases15._sum.taxValue || 0 },
                importsPaidAtCustoms: { amount: 0, adjustment: 0, vat: 0 },
                importsReverseCharge: { amount: 0, adjustment: 0, vat: 0 },
                zeroRated: { amount: purchases0._sum.subtotal || 0, adjustment: 0, vat: 0 },
                exempt: { amount: 0, adjustment: 0, vat: 0 }
            }
        });
    } catch (error: any) {
        console.error('ZATCA VAT Report error:', error);
        return NextResponse.json({ error: 'فشل جلب التقرير الضريبي' }, { status: 500 });
    }
}
