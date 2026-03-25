import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const data = await prisma.pettyCashFund.findMany({
            include: { custodian: true },
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
        
        // Ensure there is at least one employee if not provided
        let empId = parseInt(body.custodianId);
        if (!empId) {
            const firstEmp = await prisma.employee.findFirst();
            if (firstEmp) {
                empId = firstEmp.id;
            } else {
                const newEmp = await prisma.employee.create({
                    data: { name: 'أمين الصندوق (افتراضي)', position: 'أمين صندوق', salary: 0 }
                });
                empId = newEmp.id;
            }
        }

        const data = await prisma.pettyCashFund.create({
            data: {
                fundName: body.fundName,
                custodianId: empId,
                maxLimit: parseFloat(body.maxLimit) || 0,
                currentBalance: parseFloat(body.currentBalance) || 0,
                status: body.status || 'ACTIVE'
            },
            include: { custodian: true }
        });
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const data = await prisma.pettyCashFund.update({
            where: { id: parseInt(body.id) },
            data: {
                fundName: body.fundName,
                custodianId: body.custodianId ? parseInt(body.custodianId) : undefined,
                maxLimit: parseFloat(body.maxLimit),
                currentBalance: parseFloat(body.currentBalance),
                status: body.status
            },
            include: { custodian: true }
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
        await prisma.pettyCashFund.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
