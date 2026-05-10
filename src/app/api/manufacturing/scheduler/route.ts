import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.scheduler' });
async function _GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const centers = await (prisma as any).workCenter.findMany({ take: 100,
            include: {
                operations: {
                    include: {
                        recipe: {
                            include: {
                                manufacturingOrders: {
                                    where: { status: { in: ['draft', 'in_progress'] } }
                                }
                            }
                        }
                    }
                }
            } as any
        });

        // Map to Gantt Chart events
        const schedulerData = centers.map((wc: any) => {
            const tasks: any[] = [];
            wc.operations.forEach((op: any) => {
                op.recipe?.manufacturingOrders?.forEach((order: any) => {
                    const start = new Date(order.startDate);
                    const durationMs = (op.durationMinutes * order.quantityToProduce) * 60 * 1000;
                    const end = new Date(start.getTime() + durationMs);
                    
                    tasks.push({
                        id: `${order.id}-${op.id}`,
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        operationName: op.operationName,
                        durationMinutes: op.durationMinutes * order.quantityToProduce,
                        startDate: start,
                        endDate: end,
                        status: order.status
                    });
                });
            });

            return {
                workCenterId: wc.id,
                workCenterName: wc.name,
                capacity: wc.capacity,
                tasks: tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
            };
        });

        return NextResponse.json(schedulerData);
    } catch (error: any) {
        log.error("Scheduler fetch error:", error);
        return NextResponse.json({ error: 'Failed to fetch scheduler data' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
