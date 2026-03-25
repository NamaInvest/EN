import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const payload = getUserFromRequest(request);
        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { permissions: true },
        });

        if (!user || !user.active) {
            return NextResponse.json({ error: 'User disabled or not found' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                permissions: user.permissions,
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Server error fetching user profile' }, { status: 500 });
    }
}
