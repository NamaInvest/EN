import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
