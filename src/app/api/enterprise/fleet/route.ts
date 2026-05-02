import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    const data = await request.json();
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber,
        make: data.make,
        model: data.model,
        year: parseInt(data.year),
        type: data.type || 'VAN',
        status: data.status || 'AVAILABLE',
        currentOdometer: parseInt(data.currentOdometer || 0),
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
      }
    });
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Vehicle Creation Error:", error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
