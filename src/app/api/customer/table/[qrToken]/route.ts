import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'customer.table' });

export async function GET(req: NextRequest, { params }: { params: { qrToken: string } }) {
    try {
        const prisma = getPrisma(req);
        
        const table = await prisma.restaurantTable.findUnique({
            where: { qrToken: params.qrToken },
            include: { zone: true }
        });

        if (!table) {
            return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, table });
    } catch (e: any) {
        log.error('Customer Table GET error:', e.message);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { qrToken: string } }) {
    try {
        const prisma = getPrisma(req);
        const { action } = await req.json();

        const table = await prisma.restaurantTable.findUnique({
            where: { qrToken: params.qrToken }
        });

        if (!table) {
            return NextResponse.json({ success: false, error: 'Table not found' }, { status: 404 });
        }

        if (action === 'CALL_WAITER') {
            const call = await prisma.waiterCall.create({
                data: {
                    tenantId: table.tenantId,
                    tableId: table.id,
                    status: 'PENDING'
                }
            });
            return NextResponse.json({ success: true, call });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        log.error('Customer Table POST error:', e.message);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
