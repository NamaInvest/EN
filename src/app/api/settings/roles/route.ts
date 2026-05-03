import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            include: { permissions: true },
            orderBy: { id: 'asc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch users and permissions', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { targetUserId, modules } = await request.json();

        if (!targetUserId || !Array.isArray(modules)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Remove old permissions
            await tx.userPermission.deleteMany({
                where: { userId: targetUserId }
            });

            // Insert new permissions
            if (modules.length > 0) {
                await tx.userPermission.createMany({
                    data: modules.map((m: string) => ({
                        userId: targetUserId,
                        module: m
                    }))
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update permissions', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
