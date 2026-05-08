import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
const parseAmount = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val)
        .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
        .replace(/,/g, '.');
    const parsed = parseFloat(str);
    if (isNaN(parsed)) throw new Error('المبلغ ليس رقماً صحيحاً');
    return parsed;
};

export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

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
        console.error('Error fetching shifts:', error);
        return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request as any);

    try {
        const body = await request.json();
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
        console.error('Error creating shift:', error);
        return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

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
        console.error('Error updating shift:', error);
        return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

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
        console.error('Error deleting shift:', error);
        return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
    }
}
