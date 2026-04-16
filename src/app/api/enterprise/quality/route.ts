import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const inspections = await prisma.qualityInspection.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(inspections);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const inspection = await prisma.qualityInspection.create({
      data: {
        referenceNumber: `QC-${Date.now()}`,
        inspectorId: 1, // fallback inspector id
        status: data.status || 'PENDING',
        notes: data.notes || '',
        inspectionDate: new Date(),
      }
    });
    return NextResponse.json(inspection);
  } catch (error) {
    console.error("QC Creation Error:", error);
    return NextResponse.json({ error: 'Failed to create QC record' }, { status: 500 });
  }
}
