import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const leases = await prisma.leaseContract.findMany({
      include: {
        tenant: true,
        unit: {
          include: {
            property: true
          }
        },
        installments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leases);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lease contracts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    
    // Create base lease
    const contract = await prisma.leaseContract.create({
      data: {
        contractNumber: data.contractNumber,
        unitId: parseInt(data.unitId),
        tenantId: parseInt(data.tenantId),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        rentAmount: parseFloat(data.rentAmount),
        paymentFrequency: data.paymentFrequency || 'MONTHLY',
        status: data.status || 'ACTIVE'
      }
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lease contract' }, { status: 500 });
  }
}

