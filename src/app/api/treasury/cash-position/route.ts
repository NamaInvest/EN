import { NextResponse } from 'next/server';
import { getPrisma, resolveTenant } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { searchParams } = new URL(request.url);
        const asOf = searchParams.get('asOf');

        let snapshot;
        
        if (asOf) {
            const date = new Date(asOf);
            // Get the closest snapshot before or on that date
            snapshot = await prisma.cashPositionSnapshot.findFirst({
                where: { tenantId, capturedAt: { lte: date } },
                orderBy: { capturedAt: 'desc' }
            });
        } else {
            // Get the latest
            snapshot = await prisma.cashPositionSnapshot.findFirst({
                where: { tenantId },
                orderBy: { capturedAt: 'desc' }
            });
        }

        return NextResponse.json(snapshot || { error: 'No snapshots found' });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
