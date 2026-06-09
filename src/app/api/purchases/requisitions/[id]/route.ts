import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'purchases.requisitions.id' });

async function _PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const prisma = getPrisma(req as any);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, (process.env.JWT_SECRET as string));
        if (!decoded) return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });

        const id = parseInt((await params).id);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await req.json();
        const { status } = body;

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updated = await prisma.purchaseRequisition.update({
            where: { id },
            data: {
                status,
                approvedBy: decoded.userId
            }
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });
