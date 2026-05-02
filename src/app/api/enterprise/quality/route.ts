import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const inspections = await prisma.qualityInspection.findMany({
            orderBy: { inspectionDate: 'desc' }
        });
        
        // Map to what UI expects
        const formatted = inspections.map(i => ({
            id: i.id,
            referenceNumber: i.referenceNumber,
            batchNumber: i.referenceNumber, // Use referenceNumber as batchNumber
            inspector: `Inspector #${i.inspectorId}`, // Mock name
            inspectionDate: i.inspectionDate,
            result: i.status === 'PASSED' ? 'PASS' : 'REJECT',
            notes: i.notes
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const data = await request.json();
        const inspection = await prisma.qualityInspection.create({
            data: {
                referenceNumber: data.batchNumber || `QC-${Date.now()}`,
                inspectorId: 1, // hardcode for now
                status: data.result === 'PASS' ? 'PASSED' : 'FAILED',
                notes: `${data.inspector ? 'Inspector: ' + data.inspector + '. ' : ''}${data.notes || ''}`,
                inspectionDate: new Date(),
            }
        });
        return NextResponse.json(inspection);
    } catch (error) {
        console.error('QC Creation Error:', error);
        return NextResponse.json({ error: 'Failed to create QC record' }, { status: 500 });
    }
}
