import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const QuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(50),
    action: z.string().optional(),
    entityType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request as any);
        
        if (!auth) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

        const tenantId = auth.tenantId;

        if (auth.role !== 'MASTER_ADMIN' && auth.role !== 'owner') {
            return NextResponse.json({ error: 'غير مصرح. يجب أن تكون مدير نظام.' }, { status: 403 });
        }

        const url = new URL(request.url);
        const params = Object.fromEntries(url.searchParams.entries());
        const parsedQuery = QuerySchema.safeParse(params);

        if (!parsedQuery.success) {
            return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
        }

        const { page, limit, action, entityType, startDate, endDate } = parsedQuery.data;

        const prisma = getPrisma(request as any);

        const where: any = { tenantId };

        if (action) {
            where.action = action;
        }

        if (entityType) {
            where.entityType = entityType;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [total, logs] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            })
        ]);

        return NextResponse.json({
            ok: true,
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
