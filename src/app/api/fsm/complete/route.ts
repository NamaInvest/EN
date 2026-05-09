import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _POSTSchema = z.object({
  ticketId: z.union([z.string(), z.number()]).optional(),
  parts: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { ticketId, parts } = body;

        if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 });

        let totalPartsCost = 0;
        if (parts && parts.length > 0) {
            totalPartsCost = parts.reduce((acc: number, p: any) => acc + (Number(p.cost) * Number(p.quantity)), 0);
        }

        const ticket = await prisma.serviceTicket.update({
            where: { id: Number(ticketId) },
            data: { 
                status: 'completed', 
                completedDate: new Date(),
                partsCost: totalPartsCost
            }
        });

        return NextResponse.json({ success: true, result: ticket });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
