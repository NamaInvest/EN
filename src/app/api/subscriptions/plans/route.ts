import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const plans = await (prisma as any).subscriptionPlan.findMany({
            take: 100, include: { _count: { select: { subscriptions: true } } }, orderBy: { price: 'asc' } });
    return NextResponse.json(plans);
  } catch (error: any) { return apiError(error, 'Error', { context: 'subscriptions/plans' }); }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  code: z.any().optional(),
  description: z.any().optional(),
  billingCycle: z.any().optional(),
  price: z.number().optional(),
  trialDays: z.union([z.string(), z.number()]).optional(),
  features: z.any().optional(),
  maxUsers: z.any().optional(),
  active: z.boolean().optional(),
  id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const plan = await (prisma as any).subscriptionPlan.create({
      data: { name: data.name, code: data.code, description: data.description || null, billingCycle: data.billingCycle || 'MONTHLY', price: parseFloat(data.price), trialDays: parseInt(data.trialDays) || 0, features: data.features || null, maxUsers: data.maxUsers ? parseInt(data.maxUsers) : null, active: data.active !== false }
    });
    return NextResponse.json(plan);
  } catch (error: any) { return apiError(error, 'Error', { context: 'subscriptions/plans' }); }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  code: z.any().optional(),
  description: z.any().optional(),
  billingCycle: z.any().optional(),
  price: z.number().optional(),
  active: z.boolean().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const plan = await (prisma as any).subscriptionPlan.update({ where: { id: parseInt(data.id) }, data: { name: data.name, code: data.code, description: data.description, billingCycle: data.billingCycle, price: data.price ? parseFloat(data.price) : undefined, active: data.active } });
    return NextResponse.json(plan);
  } catch (error: any) { return apiError(error, 'Error', { context: 'subscriptions/plans' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
