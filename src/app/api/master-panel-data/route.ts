import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const companies = await prisma.company.findMany({
            include: {
                branches: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json({ companies });
    } catch (error) {
        console.error('Master Panel fetch error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
