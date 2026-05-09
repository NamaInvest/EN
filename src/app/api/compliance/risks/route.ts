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
    const items = await (prisma as any).riskRegister.findMany({
            take: 100, orderBy: { riskScore: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'compliance/risks' }); }
}
async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const score = (parseInt(d.likelihood) || 1) * (parseInt(d.impact) || 1);
    const item = await (prisma as any).riskRegister.create({ data: { title: d.title, category: d.category || 'OPERATIONAL', likelihood: parseInt(d.likelihood) || 1, impact: parseInt(d.impact) || 1, riskScore: score, owner: d.owner || null, mitigationPlan: d.mitigationPlan || null, status: d.status || 'OPEN', tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'compliance/risks' }); }
}
async function _PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const score = d.likelihood && d.impact ? parseInt(d.likelihood) * parseInt(d.impact) : undefined;
    const item = await (prisma as any).riskRegister.update({ where: { id: parseInt(d.id) }, data: { title: d.title, category: d.category, likelihood: d.likelihood ? parseInt(d.likelihood) : undefined, impact: d.impact ? parseInt(d.impact) : undefined, riskScore: score, owner: d.owner, mitigationPlan: d.mitigationPlan, status: d.status } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'compliance/risks' }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
