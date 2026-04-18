import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fuels = await prisma.fuelLog.findMany({
      include: {
        vehicle: true,
        driver: true,
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(fuels);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fuel logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req);
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: parseInt(data.vehicleId),
        driverId: parseInt(data.driverId),
        date: new Date(data.date),
        liters: parseFloat(data.liters),
        cost: parseFloat(data.cost),
        odometerReading: parseInt(data.odometerReading),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log fuel' }, { status: 500 });
  }
}

