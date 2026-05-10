import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bookings' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const bookings = await prisma.booking.findMany({ take: 100, orderBy: { id: 'desc' }, include: { customer: { select: { name: true } } } });
        return NextResponse.json(bookings);
    } catch (e: any) { log.error(e); return NextResponse.json([], { status: 500 }); }
}


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  total: z.number().optional(),
  deposit: z.any().optional(),
  date: z.string().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
        const last = await prisma.booking.findFirst({ orderBy: { bookingNo: 'desc' } });
        const bookingNo = (last?.bookingNo || 0) + 1;

        const booking = await prisma.booking.create({
            data: {
                bookingNo, customerId: body.customerId ? parseInt(body.customerId) : null,
                total: parseFloat(body.total) || 0, deposit: parseFloat(body.deposit) || 0,
                date: body.date ? new Date(body.date) : new Date(),
                status: 'pending', userId: body.userId || null, notes: body.notes || null,
            },
        });

        if (n(booking.deposit) > 0) {
            await prisma.treasury.create({ data: { type: 'in', amount: n(booking.deposit), description: `عربون حجز #${bookingNo}`, referenceType: 'booking', referenceId: booking.id, userId: body.userId || null } });
        }

        return NextResponse.json(booking, { status: 201 });
    } catch (e: any) { log.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  status: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _PUT(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const booking = await prisma.booking.update({ where: { id: body.id }, data: { status: body.status, notes: body.notes } });
        return NextResponse.json(booking);
    } catch (e: any) { log.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
