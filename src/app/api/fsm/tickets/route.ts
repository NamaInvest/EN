import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'fsm.tickets' });
async function _GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tickets = await prisma.serviceTicket.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, tickets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  description: z.any().optional(),
  priority: z.any().optional(),
  scheduledDate: z.string().optional(),
  technicianId: z.union([z.string(), z.number()]).optional(),
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
        const { customerId, description, priority, scheduledDate, technicianId } = body;

        const ticket = await prisma.serviceTicket.create({
            data: {
                ticketNo: Math.floor(Math.random() * 1000000), // Random int ticketNo
                customerId: customerId ? Number(customerId) : null,
                description,
                priority: priority || 'normal',
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                technicianId: technicianId ? Number(technicianId) : null,
                status: 'open'
            }
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
