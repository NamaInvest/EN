import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
    try {
        const workflows = [
            {
                id: 1,
                name: 'Purchase Order Approval',
                entityType: 'PurchaseOrder',
                triggerEvent: 'ON_CREATE',
                definition: { steps: 2 },
                isActive: true,
                version: 2,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'CapEx Request',
                entityType: 'CapEx',
                triggerEvent: 'MANUAL',
                definition: { steps: 4 },
                isActive: false,
                version: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Leave Request',
                entityType: 'LeaveRequest',
                triggerEvent: 'ON_CREATE',
                definition: { steps: 2 },
                isActive: true,
                version: 5,
                createdAt: new Date().toISOString()
            }
        ];

        const stats = {
            activeWorkflows: 2,
            runningInstances: 84,
            pendingTasks: 45,
            slaBreached: 3
        };

        return NextResponse.json({ workflows, stats });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch BPM data' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
