import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const plans = await (prisma as any).subscriptionPlan.findMany({ include: { _count: { select: { subscriptions: true } } }, orderBy: { price: 'asc' } });
    return NextResponse.json(plans);
  } catch (error: any) { return apiError(error, 'Error', { context: 'subscriptions/plans' }); }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const plan = await (prisma as any).subscriptionPlan.create({
      data: { name: data.name, code: data.code, description: data.description || null, billingCycle: data.billingCycle || 'MONTHLY', price: parseFloat(data.price), trialDays: parseInt(data.trialDays) || 0, features: data.features || null, maxUsers: data.maxUsers ? parseInt(data.maxUsers) : null, active: data.active !== false }
    });
    return NextResponse.json(plan);
  } catch (error: any) { return apiError(error, 'Error', { context: 'subscriptions/plans' }); }
}

export async function PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const plan = await (prisma as any).subscriptionPlan.update({ where: { id: parseInt(data.id) }, data: { name: data.name, code: data.code, description: data.description, billingCycle: data.billingCycle, price: data.price ? parseFloat(data.price) : undefined, active: data.active } });
    return NextResponse.json(plan);
  } catch (error: any) { return apiError(error, 'Error', { context: 'subscriptions/plans' }); }
}
