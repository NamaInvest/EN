import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const renewals = await (prisma as any).contractRenewal.findMany({
            take: 100, orderBy: { renewalDate: 'asc' } });
    return NextResponse.json(renewals);
  } catch (error: any) { return apiError(error, 'Error', { context: 'contracts/renewals' }); }
}


const _POSTSchema = z.object({
  contractId: z.union([z.string(), z.number()]).optional(),
  renewalDate: z.string().optional(),
  newEndDate: z.string().optional(),
  priceAdjustment: z.number().optional(),
  autoRenew: z.any().optional(),
  reminderDays: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
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
    const item = await (prisma as any).contractRenewal.create({
      data: { contractId: parseInt(data.contractId), renewalDate: new Date(data.renewalDate), newEndDate: new Date(data.newEndDate), priceAdjustment: data.priceAdjustment ? parseFloat(data.priceAdjustment) : null, autoRenew: data.autoRenew || false, reminderDays: parseInt(data.reminderDays) || 30 }
    });
    return NextResponse.json(item);
  } catch (error: any) { return apiError(error, 'Error', { context: 'contracts/renewals' }); }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  priceAdjustment: z.number().optional(),
  autoRenew: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).contractRenewal.update({ where: { id: parseInt(data.id) }, data: { status: data.status, priceAdjustment: data.priceAdjustment ? parseFloat(data.priceAdjustment) : undefined, autoRenew: data.autoRenew } });
    return NextResponse.json(item);
  } catch (error: any) { return apiError(error, 'Error', { context: 'contracts/renewals' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
