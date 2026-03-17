import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const branchQuery = searchParams.get('branchId');

        const auth = getUserFromRequest(request);
        const user = auth?.userId ? await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, branchId: true } }) : null;

        const where: Record<string, unknown> = {};
        if (from || to) { where.date = {}; if (from) (where.date as Record<string, unknown>).gte = new Date(from); if (to) (where.date as Record<string, unknown>).lte = new Date(to + 'T23:59:59'); }

        // Branch Isolation Logic
        if (user && user.role !== 'admin' && user.branchId) {
            where.branchId = user.branchId;
        } else if (branchQuery) {
            where.branchId = parseInt(branchQuery);
        }

        const entries = await prisma.treasury.findMany({ where, include: { user: { select: { id: true, username: true, fullName: true, role: true, phone: true } } }, orderBy: { date: 'desc' } });
        return NextResponse.json(entries);
    } catch (error) { console.error(error); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const userId = body.userId ? parseInt(body.userId) : null;
        let branchId = body.branchId ? parseInt(body.branchId) : null;
        if (!branchId && userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
            branchId = user?.branchId || null;
        }

        const entry = await prisma.treasury.create({
            data: { type: body.type, amount: parseFloat(body.amount), description: body.description || null, referenceType: body.referenceType || 'manual', referenceId: body.referenceId || null, userId, branchId },
        });
        return NextResponse.json(entry, { status: 201 });
    } catch (error) { console.error(error); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
