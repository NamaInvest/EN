import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const renewals = await (prisma as any).contractRenewal.findMany({
            take: 100, orderBy: { renewalDate: 'asc' } });
    return NextResponse.json(renewals);
  } catch (error: any) { return apiError(error, 'Error', { context: 'contracts/renewals' }); }
}

async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const item = await (prisma as any).contractRenewal.create({
      data: { contractId: parseInt(data.contractId), renewalDate: new Date(data.renewalDate), newEndDate: new Date(data.newEndDate), priceAdjustment: data.priceAdjustment ? parseFloat(data.priceAdjustment) : null, autoRenew: data.autoRenew || false, reminderDays: parseInt(data.reminderDays) || 30 }
    });
    return NextResponse.json(item);
  } catch (error: any) { return apiError(error, 'Error', { context: 'contracts/renewals' }); }
}

async function _PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


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
