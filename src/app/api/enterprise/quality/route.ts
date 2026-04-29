import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const inspections = await prisma.qualityInspection.findMany({
            orderBy: { inspectionDate: 'desc' }
        });
        return NextResponse.json(inspections);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        const inspection = await prisma.qualityInspection.create({
            data: {
                referenceNumber: data.referenceNumber || `QC-${Date.now()}`,
                inspectorId: data.inspectorId || 1,
                status: data.status || 'PENDING',
                notes: data.notes || '',
                inspectionDate: new Date(),
            }
        });
        return NextResponse.json(inspection);
    } catch (error) {
        console.error('QC Creation Error:', error);
        return NextResponse.json({ error: 'Failed to create QC record' }, { status: 500 });
    }
}
