import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { CreditLimitEngine } from '@/lib/credit-limit-engine';
import { ThreeWayMatchEngine } from '@/lib/three-way-match-tolerance-engine';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreditCheckSchema = z.object({
  tenantId:        z.string(),
  customerId:      z.number().int().positive(),
  requestedAmount: z.number().positive(),
  isPOS:           z.boolean().default(false),
});

const CreditLimitSetSchema = z.object({
  tenantId:    z.string(),
  customerId:  z.number().int().positive(),
  limit:       z.number().nonnegative(),
  termDays:    z.number().int().default(30),
  creditHold:  z.boolean().default(false),
});

const ThreeWayMatchSchema = z.object({
  tenantId:         z.string(),
  purchaseOrderId:  z.number().int().positive(),
  grnId:            z.number().int().positive(),
  invoiceId:        z.number().int().positive(),
  poAmount:         z.number(),
  grnAmount:        z.number(),
  invoiceAmount:    z.number(),
  poQty:            z.number(),
  grnQty:           z.number(),
  invoiceQty:       z.number(),
  tolerancePct:     z.number().optional(),
  toleranceAbsolute: z.number().optional(),
});

// ─── POST /api/finance/controls ───────────────────────────────────────────────

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const action = body.action as string;

  // ── Credit limit check ──────────────────────────────────────────────────
  if (action === 'credit-check') {
    const parsed = CreditCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const result = await CreditLimitEngine.checkLimit(
      parsed.data.tenantId,
      parsed.data.customerId,
      parsed.data.requestedAmount,
      parsed.data.isPOS,
    );
    const httpStatus = result.status === 'HARD_BLOCK' ? 403 : 200;
    return NextResponse.json(result, { status: httpStatus });
  }

  // ── Set / update credit limit ───────────────────────────────────────────
  if (action === 'set-limit') {
    const parsed = CreditLimitSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    await CreditLimitEngine.setLimit(
      parsed.data.tenantId,
      parsed.data.customerId,
      parsed.data.limit,
      parsed.data.termDays,
      parsed.data.creditHold,
    );
    return NextResponse.json({ success: true, message: 'تم تحديث حد الائتمان' });
  }

  // ── Three-way match ─────────────────────────────────────────────────────
  if (action === '3way-match') {
    const parsed = ThreeWayMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const result = await ThreeWayMatchEngine.match(parsed.data);
    const httpStatus = result.status === 'HARD_BLOCK' ? 422 : 200;
    return NextResponse.json(result, { status: httpStatus });
  }

  return NextResponse.json({
    error:   'action غير صحيح',
    options: ['credit-check', 'set-limit', '3way-match'],
  }, { status: 400 });
}

// ─── GET /api/finance/controls ────────────────────────────────────────────────

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action     = searchParams.get('action') ?? 'credit-check';
  const tenantId   = searchParams.get('tenantId') ?? 'default';
  const customerId = parseInt(searchParams.get('customerId') ?? '0');
  const amount     = parseFloat(searchParams.get('amount') ?? '0');
  const isPOS      = searchParams.get('isPOS') === 'true';

  if (action === 'credit-check' && customerId > 0) {
    const result = await CreditLimitEngine.checkLimit(tenantId, customerId, amount, isPOS);
    return NextResponse.json(result, { status: result.status === 'HARD_BLOCK' ? 403 : 200 });
  }

  return NextResponse.json({
    error:    'يلزم: action=credit-check&customerId=X&amount=Y&tenantId=Z',
  }, { status: 400 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
