import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const renewals = await (prisma as any).contractRenewal.findMany({
            take: 100, orderBy: { renewalDate: 'asc' } });
    return NextResponse.json(renewals);
  } catch (error: any) { return apiError(error, 'Error', { context: 'contracts/renewals' }); }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).contractRenewal.create({
      data: { contractId: parseInt(data.contractId), renewalDate: new Date(data.renewalDate), newEndDate: new Date(data.newEndDate), priceAdjustment: data.priceAdjustment ? parseFloat(data.priceAdjustment) : null, autoRenew: data.autoRenew || false, reminderDays: parseInt(data.reminderDays) || 30 }
    });
    return NextResponse.json(item);
  } catch (error: any) { return apiError(error, 'Error', { context: 'contracts/renewals' }); }
}

export async function PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).contractRenewal.update({ where: { id: parseInt(data.id) }, data: { status: data.status, priceAdjustment: data.priceAdjustment ? parseFloat(data.priceAdjustment) : undefined, autoRenew: data.autoRenew } });
    return NextResponse.json(item);
  } catch (error: any) { return apiError(error, 'Error', { context: 'contracts/renewals' }); }
}
