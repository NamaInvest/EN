import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.banks.recon.match' });


const _POSTSchema = z.object({
  lineId: z.union([z.string(), z.number()]).optional(),
  targetType: z.any().optional(),
  targetId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { lineId, targetType, targetId } = body;

        if (!lineId || !targetType || !targetId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const line = await prisma.bankStatementLine.update({
            where: { id: parseInt(lineId, 10) },
            data: {
                matchStatus: 'MANUAL_MATCHED',
                matchedToType: targetType,
                matchedToId: parseInt(targetId, 10),
                matchedAt: new Date()
            }
        });

        return NextResponse.json({ message: 'Matched successfully', line });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
