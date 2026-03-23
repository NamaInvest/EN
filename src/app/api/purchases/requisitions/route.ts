import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const prs = await prisma.purchaseRequisition.findMany({
            include: {
                requester: { select: { fullName: true, username: true } },
                approver: { select: { fullName: true } },
                details: {
                    include: { product: { select: { name: true, imagePath: true } } }
                }
            },
            orderBy: { id: 'desc' }
        });

        return NextResponse.json(prs);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();
        const { department, notes, items } = body;

        // Auto-generate PR Number
        const agg = await prisma.purchaseRequisition.aggregate({ _max: { reqNo: true } });
        const nextNo = (agg._max.reqNo || 1000) + 1;

        const pr = await prisma.purchaseRequisition.create({
            data: {
                reqNo: nextNo,
                department: department || 'General',
                notes,
                requestedBy: decoded.userId,
                status: 'pending',
                details: {
                    create: items.map((i: any) => ({
                        productId: parseInt(i.productId),
                        productName: i.productName,
                        quantity: parseFloat(i.quantity),
                        notes: i.notes || ''
                    }))
                }
            }
        });

        // Optional: Could trigger a notification to the manager here
        return NextResponse.json(pr);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
