import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request as any);

    try {
        const inspections = await prisma.qualityInspection.findMany({
            take: 100,
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
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


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
    } catch (error: any) {
        console.error('QC Creation Error:', error);
        return NextResponse.json({ error: 'Failed to create QC record' }, { status: 500 });
    }
}
