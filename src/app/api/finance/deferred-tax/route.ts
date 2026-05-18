import { NextResponse } from 'next/server';
import { DeferredTaxEngine } from '@/lib/deferred-tax-engine';
import { withRoute } from "@/lib/api/with-route";
export const GET = withRoute(async ({ req, prisma, auth, tenant }) => {
    try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const rateParam = searchParams.get('rate');


    const asOfDate = dateParam ? new Date(dateParam) : new Date();
    const taxRate = rateParam ? parseFloat(rateParam) : 0.20; // Default 20% standard corporate tax

    if (isNaN(taxRate) || taxRate <= 0 || taxRate > 1) {
      return NextResponse.json({ error: 'Invalid tax rate. Must be between 0 and 1.' }, { status: 400 });
    }

    const report = await DeferredTaxEngine.calculateDeferredTax(tenant, asOfDate, taxRate);

    return NextResponse.json({
      success: true,
      data: report,
    });
    } catch (error: any) {
    console.error('Deferred Tax API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate Deferred Tax report', details: error?.message },
      { status: 500 }
    );
    }
    }, { rateLimit: 'DEFAULT', tenantRequired: true });
