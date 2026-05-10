import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.approvals' });
async function _GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const rules = await prisma.approvalRule.findMany({ take: 100,
            include: { approver: { select: { id: true, fullName: true, role: true } } },
            orderBy: { level: 'asc' }
        });
        return NextResponse.json(rules);
    } catch (error: any) {
        log.error("GET approvals error:", error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  documentType: z.any().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  approverRole: z.any().optional(),
  approverId: z.union([z.string(), z.number()]).optional(),
  level: z.any().optional(),
  isActive: z.boolean().optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const data = await request.json();

        const _parsed = _POSTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const newRule = await prisma.approvalRule.create({
            data: {
                documentType: data.documentType,
                minAmount: parseFloat(data.minAmount) || 0,
                maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
                approverRole: data.approverRole || '',
                approverId: data.approverId ? parseInt(data.approverId) : null,
                level: parseInt(data.level) || 1,
                isActive: data.isActive !== undefined ? data.isActive : true,
            }
        });
        
        return NextResponse.json(newRule);
    } catch (error: any) {
        log.error("POST approval error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء الإضافة' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
