import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        // Find all vehicles and calculate maintenance alerts based on odometer
        const vehicles = await prisma.vehicle.findMany({
            include: {
                trips: {
                    orderBy: { departureTime: 'desc' },
                    take: 1
                }
            }
        });

        const alerts = [];
        const MAINTENANCE_INTERVAL_KM = 10000;

        for (const v of vehicles) {
            const currentOdo = v.currentOdometer || 0;
            // Assuming we check if odometer is close to next interval
            const nextMaintenanceAt = Math.ceil((currentOdo + 1) / MAINTENANCE_INTERVAL_KM) * MAINTENANCE_INTERVAL_KM;
            const kmRemaining = nextMaintenanceAt - currentOdo;

            let status = 'OK';
            if (kmRemaining <= 0) status = 'OVERDUE';
            else if (kmRemaining < 1000) status = 'DUE_SOON';

            if (status !== 'OK') {
                alerts.push({
                    vehicleId: v.id,
                    plateNumber: v.plateNumber,
                    model: v.model,
                    currentOdometer: currentOdo,
                    nextMaintenanceAt,
                    kmRemaining,
                    status
                });
            }
        }

        // Dummy maintenance logs
        const maintenanceLogs = [
            { id: 1, vehicleId: vehicles[0]?.id || 1, plateNumber: vehicles[0]?.plateNumber || 'XYZ 1234', date: '2026-04-15', description: 'تغيير زيت وفلتر', cost: 450, odoAtMaintenance: 40000 },
            { id: 2, vehicleId: vehicles[1]?.id || 2, plateNumber: vehicles[1]?.plateNumber || 'ABC 5678', date: '2026-03-20', description: 'تغيير إطارات', cost: 1200, odoAtMaintenance: 35000 }
        ];

        return NextResponse.json({ success: true, data: { alerts, maintenanceLogs } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
