import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const segment = searchParams.get('segment') || 'all'; // all, vip, overdue

        let whereClause: any = {
            type: { in: [0, 2] }, // Customer or Both
            // In a real system, you'd check active status and email opt-in
        };

        if (segment === 'vip') {
            whereClause.creditLimit = { gt: 50000 };
        } else if (segment === 'overdue') {
            whereClause.balance = { gt: 0 };
        }

        const count = await prisma.customer.count({
            where: whereClause
        });

        return NextResponse.json({ count });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
