import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const orders = await prisma.manufacturingOrder.findMany({
            take: 100,
            where: { status: 'completed' },
            include: {
                recipe: { include: { operations: { include: { workCenter: true } } } },
                costs: { where: { costType: 'overhead' } }
            }
        });

        const efficiencyReport = orders.map((order: any) => {
            // Standard Hours
            let standardHours = 0;
            order.recipe?.operations?.forEach((op: any) => {
                standardHours += (op.durationMinutes / 60) * order.quantityToProduce;
            });

            // Actual Cost Logged (We approximate actual hours from the cost)
            // In a real system, we'd have a time-clock table. Here we use the overhead cost variance.
            const totalOverheadCost = order.costs.reduce((acc: number, c: any) => acc + c.amount, 0);
            const avgRate = order.recipe?.operations?.[0]?.workCenter?.costPerHour || 1;
            const actualHoursApprox = totalOverheadCost / avgRate;

            const efficiencyVariance = standardHours - actualHoursApprox;
            const efficiencyPercentage = actualHoursApprox > 0 ? (standardHours / actualHoursApprox) * 100 : 100;

            return {
                orderNumber: order.orderNumber,
                standardHours: standardHours.toFixed(2),
                actualHours: actualHoursApprox.toFixed(2),
                efficiencyVariance: efficiencyVariance.toFixed(2),
                efficiencyPercentage: efficiencyPercentage.toFixed(1),
                status: efficiencyVariance >= 0 ? 'Favorable' : 'Adverse'
            };
        });

        return NextResponse.json({
            module: "Labor & Machine Efficiency",
            data: efficiencyReport
        });
    } catch (error: any) {
        console.error("Efficiency error:", error);
        return NextResponse.json({ error: 'Failed to generate efficiency report' }, { status: 500 });
    }
}
