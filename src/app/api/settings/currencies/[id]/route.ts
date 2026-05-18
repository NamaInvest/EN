import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.currencies.id' });

const _PUTSchema = z.object({
  isDefault: z.boolean().optional(),
  code: z.any().optional(),
  nameAr: z.any().optional(),
  nameEn: z.any().optional(),
  symbol: z.any().optional(),
  exchangeRate: z.number().optional(),
  isActive: z.boolean().optional(),
}).passthrough();

async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!['admin', 'owner'].includes(user.role)) {
            return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });
        }
        
        const id = parseInt((await params).id);
        const data = await request.json();

        const _parsed = _PUTSchema.safeParse(data);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        // Disable other defaults if this becomes default
        if (data.isDefault) {
             await prisma.currency.updateMany({
                where: { tenantId: user.tenantId, isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }
        
        // Verify ownership first
        const existing = await prisma.currency.findFirst({
            where: { id, tenantId: user.tenantId }
        });
        
        if (!existing) {
            return NextResponse.json({ error: 'العملة غير موجودة' }, { status: 404 });
        }
        
        const updated = await prisma.currency.update({
            where: { id },
            data: {
                code: data.code,
                nameAr: data.nameAr,
                nameEn: data.nameEn,
                symbol: data.symbol,
                exchangeRate: parseFloat(data.exchangeRate),
                isDefault: data.isDefault,
                isActive: data.isActive,
            }
        });
        
        return NextResponse.json(updated);
    } catch (error: any) {
        log.error("PUT currency error:", error);
        return NextResponse.json({ error: 'حدث خطأ أثناء التحديث' }, { status: 500 });
    }
}

async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!['admin', 'owner'].includes(user.role)) {
            return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });
        }
        
        const id = parseInt((await params).id);
        await prisma.currency.deleteMany({ where: { id, tenantId: user.tenantId } });
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        log.error("DELETE currency error:", error);
        return NextResponse.json({ error: 'حدث خطأ. لا يمكن حذف عملة مرتبطة بعمليات.' }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
