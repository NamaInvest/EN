import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const data = await prisma.budget.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const body = await req.json();
        const data = await prisma.budget.create({
            data: {
                name: body.name,
                fiscalYear: parseInt(body.fiscalYear) || new Date().getFullYear(),
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                totalAmount: parseFloat(body.totalAmount) || 0,
                status: body.status || 'ACTIVE'
            }
        });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const body = await req.json();
        const data = await prisma.budget.update({
            where: { id: parseInt(body.id) },
            data: {
                name: body.name,
                fiscalYear: parseInt(body.fiscalYear),
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                totalAmount: parseFloat(body.totalAmount) || 0,
                status: body.status
            }
        });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    // Auth guard
    const { getUserFromRequest } = require('@/lib/auth');
    const _auth = getUserFromRequest(req as any);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(req as any);

    try {
        const url = new URL(req.url);
        const id = parseInt(url.searchParams.get('id') || '0');
        await prisma.budget.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
