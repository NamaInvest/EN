// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { OpenItemsEngine } from "@/lib/open-items";
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withIdempotency } from '@/lib/idempotency';

const log = logger.child({ service: 'accounting.open-items.apply-payment' });

async function _POST(req: NextRequest) {
  try {
    const { paymentOpenItemId, allocations } = await req.json();
    const userId = "system-user";
    const tenantId = req.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    if (!paymentOpenItemId || !allocations || !Array.isArray(allocations)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const result = await OpenItemsEngine.applyPayment(paymentOpenItemId, allocations, userId, tenantId);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => {
  return withIdempotency(req as NextRequest, 'POST /api/accounting/open-items/apply-payment', async () => _POST(req as NextRequest));
}, { rateLimit: 'FINANCIAL' });
