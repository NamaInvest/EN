import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { WPSGenerator } from '@/lib/wps-generator';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(
    request: Request,
    context: { params: Promise<{ batchId: string }> }
) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    try {
        const params = await context.params;
        const batchId = parseInt((await params).batchId);
        
        await WPSGenerator.submitToBank(batchId);

        return NextResponse.json({
            message: 'Batch marked as uploaded successfully',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
