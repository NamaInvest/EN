import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const rfqs = await prisma.requestForQuotation.findMany({
            include: {
                supplier: { select: { name: true, phone: true } },
                user: { select: { fullName: true } },
                details: {
                    include: { product: { select: { name: true, imagePath: true, unit: true } } }
                }
            },
            orderBy: { id: 'desc' }
        });

        return NextResponse.json(rfqs);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret123');
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const body = await req.json();
        const { supplierId, dueDate, notes, items } = body;

        const agg = await prisma.requestForQuotation.aggregate({ _max: { rfqNo: true } });
        const nextNo = (agg._max.rfqNo || 2000) + 1;

        const rfq = await prisma.requestForQuotation.create({
            data: {
                rfqNo: nextNo,
                supplierId: supplierId ? parseInt(supplierId) : null,
                dueDate: !!dueDate ? new Date(dueDate) : null,
                notes,
                userId: decoded.userId,
                status: 'draft',
                details: {
                    create: items.map((i: any) => ({
                        productId: parseInt(i.productId),
                        productName: i.productName,
                        quantity: parseFloat(i.quantity),
                        targetPrice: i.targetPrice ? parseFloat(i.targetPrice) : null
                    }))
                }
            }
        });

        return NextResponse.json(rfq);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
