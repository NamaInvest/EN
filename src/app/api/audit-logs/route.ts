import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitStr = searchParams.get('limit') || '100';
        const limit = parseInt(limitStr);

        const logs = await prisma.auditLog.findMany({
            take: limit,
            orderBy: { date: 'desc' },
            include: {
                user: { select: { fullName: true, username: true } }
            }
        });
        
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
