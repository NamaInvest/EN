import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  computeActivityRates,
  allocateActivityCosts,
  summarizeProductCosts,
  allocateJointCost,
  backflush,
  computeMaterialVariances,
  computeLaborVariances,
} from '@/lib/gaps';

const Schema = z.object({
  pools: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        totalCost: z.number().nonnegative(),
        driver: z.string(),
        totalDriverUnits: z.number().nonnegative(),
      })
    )
    .min(1),
  consumption: z
    .array(
      z.object({
        productId: z.string(),
        activityId: z.string(),
        driverConsumed: z.number().nonnegative(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'allocate';
  const body = await req.json();

  if (action === 'allocate') {
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const rates = computeActivityRates(parsed.data.pools);
    const allocations = allocateActivityCosts(parsed.data.consumption, rates);
    const summary = Array.from(summarizeProductCosts(allocations).entries()).map(([productId, cost]) => ({
      productId,
      totalCost: cost.totalCost,
      byActivity: cost.byActivity,
    }));
    return NextResponse.json({ rates, allocations, summary });
  }

  if (action === 'joint') {
    const JointSchema = z.object({
      totalJointCost: z.number().positive(),
      products: z.array(
        z.object({
          productId: z.string(),
          qty: z.number().positive(),
          salesValueAtSplitOff: z.number().optional(),
          netRealizableValue: z.number().optional(),
        })
      ),
      method: z.enum(['PHYSICAL_QTY', 'SALES_VALUE', 'NRV']),
    });
    const parsed = JointSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json({
      allocations: allocateJointCost(parsed.data.totalJointCost, parsed.data.products, parsed.data.method),
    });
  }

  if (action === 'backflush') {
    const BackflushSchema = z.object({
      bom: z.array(z.object({ componentId: z.string(), qtyPerUnit: z.number().positive(), stdCost: z.number().nonnegative() })).min(1),
      finishedQty: z.number().positive(),
      scrapPercent: z.number().min(0).max(0.5).default(0),
    });
    const parsed = BackflushSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(backflush(parsed.data.bom, parsed.data.finishedQty, parsed.data.scrapPercent));
  }

  if (action === 'variance-material') {
    const S = z.object({
      stdPrice: z.number(),
      actualPrice: z.number(),
      stdQty: z.number(),
      actualQty: z.number(),
    });
    const parsed = S.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(computeMaterialVariances(parsed.data));
  }

  if (action === 'variance-labor') {
    const S = z.object({
      stdRate: z.number(),
      actualRate: z.number(),
      stdHours: z.number(),
      actualHours: z.number(),
    });
    const parsed = S.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(computeLaborVariances(parsed.data));
  }

  return NextResponse.json({ error: 'Unknown action. Use ?action=allocate|joint|backflush|variance-material|variance-labor' }, { status: 400 });
}
