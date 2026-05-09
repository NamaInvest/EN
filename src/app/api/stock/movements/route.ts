import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function _GET(req: NextRequest) {
    const prisma = getPrisma(req as any);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded: any = jwt.verify(authHeader.split(' ')[1], (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const url = new URL(req.url);
        const productId = url.searchParams.get('productId');
        const type = url.searchParams.get('type');

        const movements = await prisma.stockMovement.findMany({
            where: {
                ...(productId ? { productId: parseInt(productId) } : {}),
                ...(type ? { type } : {})
            },
            include: {
                product: { select: { name: true, } },
                stock: { select: { name: true } },
                user: { select: { fullName: true } }
            },
            orderBy: { date: 'desc' },
            take: 200
        });

        return NextResponse.json(movements);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error', details: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
