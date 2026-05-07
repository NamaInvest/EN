import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).carrierRate.findMany({ orderBy: { carrierName: 'asc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'logistics/carriers' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).carrierRate.create({ data: { carrierName: d.carrierName, zoneFrom: d.zoneFrom, zoneTo: d.zoneTo, weightMin: parseFloat(d.weightMin) || 0, weightMax: parseFloat(d.weightMax) || 9999, rate: parseFloat(d.rate) || 0, currency: d.currency || 'SAR', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'logistics/carriers' }); }
}
