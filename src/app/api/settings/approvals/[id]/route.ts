import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

const _PUTSchema = z.object({
  documentType: z.any().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  approverRole: z.any().optional(),
  approverId: z.union([z.string(), z.number()]).optional(),
  level: z.any().optional(),
  isActive: z.boolean().optional(),
}).passthrough();

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt((await params).id);
        const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const updated = await prisma.approvalRule.update({
            where: { id },
            data: {
                documentType: data.documentType,
                minAmount: parseFloat(data.minAmount) || 0,
                maxAmount: data.maxAmount ? parseFloat(data.maxAmount) : null,
                approverRole: data.approverRole || '',
                approverId: data.approverId ? parseInt(data.approverId) : null,
                level: parseInt(data.level) || 1,
                isActive: data.isActive,
            }
        });
        
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("PUT approval error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt((await params).id);
        await prisma.approvalRule.delete({ where: { id } });
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE approval error:", error);
        return NextResponse.json({ error: 'حدث خطأ. لا يمكن حذف القاعدة المرتبطة بعمليات.' }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
