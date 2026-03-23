import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const inspections = await prisma.qualityInspection.findMany({
      include: {
        product: true
      },
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
        productId: data.productId || null,
        batchNumber: data.batchNumber || '',
        inspector: data.inspector || 'System User',
        status: data.status || 'PENDING',
        result: data.result || 'PENDING',
        notes: data.notes || '',
        inspectionDate: new Date(),
      },
      include: { product: true }
    });
    return NextResponse.json(inspection);
  } catch (error) {
    console.error("QC Creation Error:", error);
    return NextResponse.json({ error: 'Failed to create QC record' }, { status: 500 });
  }
}
