import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aggregateDaily, forecastDemand, computeReorderParameters, computeEOQ } from '@/lib/gaps';
import { prisma } from '@/lib/prisma';

const Schema = z.object({
  tenantId: z.string(),
  productId: z.string(),
  warehouseId: z.string(),
  horizonDays: z.coerce.number().min(7).max(180).default(30),
  leadTimeDays: z.coerce.number().min(1).max(180).default(14),
  serviceLevel: z.enum(['0.9', '0.95', '0.99']).default('0.95'),
});

export async function GET(req: NextRequest) {
  const parsed = Schema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tenantId, productId, warehouseId, horizonDays, leadTimeDays, serviceLevel } = parsed.data;

  const sales = await (prisma as never as {
    stockMovement: { findMany: (a: unknown) => Promise<Array<{ movementDate: Date; quantity: number }>> };
  }).stockMovement.findMany({
    where: {
      tenantId,
      productId,
      warehouseId,
      type: 'OUT',
      movementDate: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    },
    select: { movementDate: true, quantity: true },
    take: 5000,
  }).catch(() => []);

  const history = aggregateDaily(
    (sales as Array<{ movementDate: Date; quantity: number }>).map((s) => ({
      date: s.movementDate,
      qty: Math.abs(Number(s.quantity)),
    }))
  );
  const forecast = forecastDemand(productId, warehouseId, history, { horizonDays });
  const reorder = computeReorderParameters(forecast, leadTimeDays, parseFloat(serviceLevel) as 0.9 | 0.95 | 0.99);
  const annualDemand = forecast.forecast.reduce((s, f) => s + f.p50, 0) * (365 / horizonDays);
  const eoq = computeEOQ(annualDemand, 50 /* order cost SAR */, 5 /* holding/unit/yr SAR */);

  return NextResponse.json({
    productId,
    warehouseId,
    horizonDays,
    forecast,
    reorder,
    eoq: Math.round(eoq),
    mape: forecast.mape,
    history: { points: history.length, totalQtyLastYear: history.reduce((s, h) => s + h.qty, 0) },
  });
}
