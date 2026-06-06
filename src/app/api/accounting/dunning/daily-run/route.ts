import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { DunningEngineV2 } from '@/lib/dunning-engine-v2';
import { z } from 'zod';

const _POSTSchema = z.object({
  date: z.string().optional(),
}).passthrough();

async function _POST(req: NextRequest, prisma: import('@prisma/client').PrismaClient) {
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const date = body.date ? new Date(body.date) : new Date();
        
        const result = await DunningEngineV2.executeDailyRun(prisma, date);
        
        return NextResponse.json({ message: 'Dunning daily run completed successfully', date, result });
    } catch (e) {
        const error = e as Error;
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req, prisma }) => _POST(req, prisma as import('@prisma/client').PrismaClient), {
  rateLimit: 'FINANCIAL',
  module: 'accounting',
  permission: 'edit',
});
