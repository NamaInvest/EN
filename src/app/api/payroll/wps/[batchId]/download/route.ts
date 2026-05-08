import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(
    request: Request,
    context: { params: Promise<{ batchId: string }> }
) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request as any);

    try {
        const params = await context.params;
        const batchId = parseInt((await params).batchId);
        
        const batch = await prisma.wPSBatch.findUnique({
            where: { id: batchId },
        });

        if (!batch || !batch.fileContent) {
            return NextResponse.json(
                { error: 'Batch not found or file not generated' },
                { status: 404 }
            );
        }

        const fileName = `WPS_${batch.batchNumber}.txt`;

        return new NextResponse(batch.fileContent, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Type': 'text/plain',
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
