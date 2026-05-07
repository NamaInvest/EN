import { NextResponse } from 'next/server';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = resolveTenant(request as any);

        // Fetch logs for the tenant
        const logs = await prisma.promptUsageLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit for dashboard
        });

        // Calculate aggregates
        const aggregates = await prisma.promptUsageLog.aggregate({
            where: { tenantId },
            _sum: {
                promptTokens: true,
                completionTokens: true,
            },
            _avg: {
                latencyMs: true,
            },
            _count: {
                id: true
            }
        });

        const successCount = await prisma.promptUsageLog.count({
            where: { tenantId, success: true }
        });

        return NextResponse.json({
            logs,
            stats: {
                totalRequests: aggregates._count.id,
                totalTokens: (aggregates._sum.promptTokens || 0) + (aggregates._sum.completionTokens || 0),
                avgLatency: Math.round(aggregates._avg.latencyMs || 0),
                successRate: aggregates._count.id > 0 ? Math.round((successCount / aggregates._count.id) * 100) : 100
            }
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
