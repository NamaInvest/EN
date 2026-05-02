import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request as any);

    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        let workflows = await (prisma as any).bpmWorkflow.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Seed default workflows if empty
        if (workflows.length === 0) {
            const wf1 = await (prisma as any).bpmWorkflow.create({
                data: {
                    name: 'Purchase Order Approval',
                    entityType: 'PurchaseOrder',
                    triggerEvent: 'ON_CREATE',
                    definition: { steps: 2 },
                    isActive: true,
                    version: 2
                }
            });
            const wf2 = await (prisma as any).bpmWorkflow.create({
                data: {
                    name: 'CapEx Request',
                    entityType: 'CapEx',
                    triggerEvent: 'MANUAL',
                    definition: { steps: 4 },
                    isActive: false,
                    version: 1
                }
            });
            const wf3 = await (prisma as any).bpmWorkflow.create({
                data: {
                    name: 'Leave Request',
                    entityType: 'LeaveRequest',
                    triggerEvent: 'ON_CREATE',
                    definition: { steps: 2 },
                    isActive: true,
                    version: 5
                }
            });
            workflows = [wf1, wf2, wf3];
        }

        const stats = {
            activeWorkflows: workflows.filter((w: any) => w.isActive).length,
            runningInstances: 84, // mock
            pendingTasks: 45, // mock
            slaBreached: 3 // mock
        };

        return NextResponse.json({ workflows, stats });
    } catch (error) {
        console.error('BPM fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch BPM data' }, { status: 500 });
    }
}
