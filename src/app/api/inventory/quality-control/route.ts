import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get PENDING inspections
        const pending = await prisma.qualityInspection.findMany({
            take: 100,
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
        });

        // Get recent completed
        const completed = await prisma.qualityInspection.findMany({
            where: { status: { in: ['PASSED', 'FAILED', 'REWORK'] } },
            orderBy: { updatedAt: 'desc' },
            take: 20
        });

        return NextResponse.json({ pending, completed });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req as any);
    try {
        const auth = getUserFromRequest(req);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { id, status, notes } = body;

        const inspection = await prisma.qualityInspection.update({
            where: { id },
            data: {
                status,
                notes,
                inspectorId: auth.userId
            }
        });

        // Depending on status, trigger CAPA/NCR or move stock
        if (status === 'FAILED') {
            // Log logic for NCR (Non-Conformance Report)
            console.log('NCR Triggered for', inspection.referenceNumber);
        }

        return NextResponse.json({ message: 'Inspection updated', inspection });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}
