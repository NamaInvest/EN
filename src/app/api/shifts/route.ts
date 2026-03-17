import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const branchId = searchParams.get('branchId');

        const where: any = {};
        if (status) where.status = status;
        if (branchId) where.branchId = parseInt(branchId);

        const shifts = await prisma.shift.findMany({
            where,
            include: {
                user: { select: { id: true, fullName: true } },
                branch: { select: { id: true, name: true } },
                _count: { select: { invoices: true, salesReturns: true } }
            },
            orderBy: { startTime: 'desc' }
        });

        return NextResponse.json(shifts);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, startCash, branchId, notes } = body;

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

        const shift = await prisma.shift.create({
            data: {
                userId: parseInt(userId),
                startingCash: parseFloat(startCash || 0),
                branchId: branchId ? parseInt(branchId) : null,
                notes: notes || '',
                status: 'open',
            }
        });

        return NextResponse.json(shift, { status: 201 });
    } catch (error) {
        console.error('Error creating shift:', error);
        return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, endCash, notes, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 });
        }

        const shift = await prisma.shift.update({
            where: { id: parseInt(id) },
            data: {
                endingCash: endCash !== undefined ? parseFloat(endCash) : undefined,
                notes: notes !== undefined ? notes : undefined,
                status: status || 'closed',
                endTime: status === 'closed' ? new Date() : undefined,
            }
        });

        return NextResponse.json(shift);
    } catch (error) {
        console.error('Error updating shift:', error);
        return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 });

        await prisma.shift.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
    }
}
