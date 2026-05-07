import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).portalUser.findMany({
            take: 100, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'portal/users' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(d.password || '123456', 10);
    const item = await (prisma as any).portalUser.create({ data: { partyId: d.partyId ? parseInt(d.partyId) : null, name: d.name, email: d.email, passwordHash: hash, tenantId: d.tenantId || 'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'portal/users' }); }
}
