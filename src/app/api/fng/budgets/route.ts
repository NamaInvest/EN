import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const data = await prisma.budget.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
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

export async function PUT(req: Request) {
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

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = parseInt(url.searchParams.get('id') || '0');
        await prisma.budget.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
