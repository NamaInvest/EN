import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).rentalReturn.findMany({
            take: 100, include: { agreement: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'rental/returns' }); }
}
export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).rentalReturn.create({ data: { agreementId: parseInt(d.agreementId), returnDate: new Date(d.returnDate || new Date()), condition: d.condition || 'GOOD', damageNotes: d.damageNotes, damageCost: parseFloat(d.damageCost)||0, inspectedBy: d.inspectedBy } });
    await (prisma as any).rentalAgreement.update({ where: { id: parseInt(d.agreementId) }, data: { status: 'RETURNED' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'rental/returns' }); }
}
