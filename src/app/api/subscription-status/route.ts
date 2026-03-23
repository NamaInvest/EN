import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ active: false });
        
        // Platform owner is immune to SaaS subscription locks
        if (user.role === 'owner') return NextResponse.json({ active: true });

        const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
        if (!dbUser?.branchId) return NextResponse.json({ active: true }); // e.g. floating system users

        const branch = await prisma.branch.findUnique({ where: { id: dbUser.branchId } });
        if (!branch) return NextResponse.json({ active: false });

        // Find the most recent subscription for their Company
        const sub = await prisma.subscription.findFirst({
            where: { companyId: branch.companyId },
            orderBy: { createdAt: 'desc' }
        });

        if (!sub) {
            return NextResponse.json({ active: false, reason: 'NO_SUBSCRIPTION' });
        }

        if (sub.status !== 'ACTIVE') {
            return NextResponse.json({ active: false, reason: sub.status });
        }

        // Check if date naturally expired past the allowed active window
        if (new Date(sub.endDate) < new Date()) {
            // Auto-flip to EXPIRED
            await prisma.subscription.update({
                where: { id: sub.id },
                data: { status: 'EXPIRED' }
            });
            return NextResponse.json({ active: false, reason: 'EXPIRED' });
        }

        return NextResponse.json({ active: true });
    } catch (error) {
        console.error('Subscription Status Error:', error);
        return NextResponse.json({ active: true }); // Fail-open to avoid locking legitimately paying users during database DB drops
    }
}
