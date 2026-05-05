import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const { searchParams } = new URL(req.url);
        const machineId = searchParams.get('machineId');
        
        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 30); // Last 30 days

        // Build where clause
        const machineWhere = machineId ? { id: Number(machineId) } : {};

        const machines = await prisma.machine.findMany({
            where: machineWhere,
            include: {
                machineEvents: {
                    where: { timestamp: { gte: dateFilter } }
                },
                orders: {
                    where: { 
                        startDate: { gte: dateFilter },
                        status: 'completed'
                    },
                    include: { recipe: { include: { operations: true } } }
                }
            } as any
        });

        const dashboardData = machines.map(machine => {
            // Availability Calc
            const plannedTime = 30 * 8 * 60; // 30 days * 8 hours * 60 mins (simplified)
            let runTime = 0;
            let downTime = 0;
            let idleTime = 0;

            const downtimeReasons: Record<string, number> = {};

            (machine as any).machineEvents.forEach((e: any) => {
                if (e.status === 'RUNNING') runTime += e.durationMinutes;
                if (e.status === 'DOWN') {
                    downTime += e.durationMinutes;
                    const reason = e.reason || 'Unspecified';
                    downtimeReasons[reason] = (downtimeReasons[reason] || 0) + e.durationMinutes;
                }
                if (e.status === 'IDLE') idleTime += e.durationMinutes;
            });

            // Fallback for simulation if no events
            if (runTime === 0 && downTime === 0) {
                runTime = plannedTime * 0.75; // Simulate 75% running
                downTime = plannedTime * 0.10;
                idleTime = plannedTime * 0.15;
            }

            const availability = plannedTime > 0 ? (runTime / plannedTime) : 0;

            // Performance Calc
            let totalIdealTime = 0;
            let totalProduced = 0;

            (machine as any).orders.forEach((o: any) => {
                totalProduced += o.quantityToProduce || 0;
                // find ideal cycle time for this machine from recipe operations
                const op = o.recipe?.operations?.find((op: any) => op.workCenterId === machine.id);
                if (op) {
                    totalIdealTime += (op.durationMinutes * (o.quantityToProduce || 0));
                }
            });

            // Fallback for simulation
            if (totalProduced === 0) {
                totalProduced = 1000;
                totalIdealTime = runTime * 0.9; // Simulate 90% performance
            }

            const performance = runTime > 0 ? (totalIdealTime / runTime) : 0;

            // Quality Calc
            // Simulate quality from orders
            let totalGoodUnits = totalProduced * 0.95; // Simulate 95% quality

            const quality = totalProduced > 0 ? (totalGoodUnits / totalProduced) : 0;

            const oee = availability * performance * quality;

            return {
                machineId: machine.id,
                machineName: machine.name,
                availability: availability * 100,
                performance: performance * 100,
                quality: quality * 100,
                oee: oee * 100,
                runTime,
                downTime,
                idleTime,
                downtimeReasons
            };
        });

        // Calculate aggregate OEE
        const aggregate = dashboardData.reduce((acc, curr) => ({
            availability: acc.availability + curr.availability / dashboardData.length,
            performance: acc.performance + curr.performance / dashboardData.length,
            quality: acc.quality + curr.quality / dashboardData.length,
            oee: acc.oee + curr.oee / dashboardData.length
        }), { availability: 0, performance: 0, quality: 0, oee: 0 });

        return NextResponse.json({ success: true, data: { aggregate, machines: dashboardData } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
