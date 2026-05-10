import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'shifts' });
const parseAmount = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val)
        .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
        .replace(/,/g, '.');
    const parsed = parseFloat(str);
    if (isNaN(parsed)) throw new Error('المبلغ ليس رقماً صحيحاً');
    return parsed;
};

async function _GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const branchId = searchParams.get('branchId');

        const where: any = {};
        if (status) where.status = status;
        if (branchId) where.branchId = parseInt(branchId);

        const shifts = await prisma.shift.findMany({
            take: 100,
            where,
            include: {
                user: { select: { id: true, fullName: true } },
                branch: { select: { id: true, name: true } },
                _count: { select: { invoices: true, salesReturns: true } }
            },
            orderBy: { startTime: 'desc' }
        });

        return NextResponse.json(shifts);
    } catch (error: any) {
        log.error('Error fetching shifts:', error);
        return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  startCash: z.any().optional(),
  startingCash: z.any().optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

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
        const { userId, startCash, startingCash, branchId, notes } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Check if user already has an open shift
        const existingOpenShift = await prisma.shift.findFirst({
            where: { userId: parseInt(userId), status: 'open' }
        });

        if (existingOpenShift) {
            return NextResponse.json({ error: 'User already has an open shift' }, { status: 400 });
        }

        let parsedStartCash = 0;
        try {
            parsedStartCash = parseAmount(startCash !== undefined ? startCash : startingCash);
        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

        const shift = await prisma.shift.create({
            data: {
                userId: parseInt(userId),
                startingCash: parsedStartCash,
                branchId: branchId ? parseInt(branchId) : null,
                notes: notes || '',
                status: 'open',
            }
        });

        return NextResponse.json(shift, { status: 201 });
    } catch (error: any) {
        log.error('Error creating shift:', error);
        return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
    }
}


const _PUTSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  endCash: z.any().optional(),
  endingCashActual: z.any().optional(),
  notes: z.any().optional(),
  status: z.any().optional(),
}).passthrough();

async function _PUT(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const body = await request.json();
        const { id, endCash, endingCashActual, notes, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 });
        }

        let parsedEndCash: number | undefined = undefined;
        const incomingEndCash = endCash !== undefined ? endCash : endingCashActual;
        if (incomingEndCash !== undefined && incomingEndCash !== '') {
            try {
                parsedEndCash = parseAmount(incomingEndCash);
            } catch (e: any) {
                return NextResponse.json({ error: e.message }, { status: 400 });
            }
        }

        const shift = await prisma.shift.update({
            where: { id: parseInt(id) },
            data: {
                endingCashActual: parsedEndCash !== undefined ? parsedEndCash : undefined,
                notes: notes !== undefined ? notes : undefined,
                status: status || 'closed',
                endTime: status === 'closed' ? new Date() : undefined,
            }
        });

        return NextResponse.json(shift);
    } catch (error: any) {
        log.error('Error updating shift:', error);
        return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest) {
    const prisma = getPrisma(request as any);

    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(request as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 });

        await prisma.shift.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Shift deleted successfully' });
    } catch (error: any) {
        log.error('Error deleting shift:', error);
        return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }) => _DELETE(req as any), { rateLimit: 'DEFAULT' });
