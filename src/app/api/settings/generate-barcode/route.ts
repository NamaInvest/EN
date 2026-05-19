import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.generate-barcode' });
async function _POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user || !['admin', 'owner'].includes(user.role)) {
            return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });
        }

        const settingKey = `next_barcode_${user.tenantId}`;
        const setting = await prisma.setting.findUnique({ where: { key: settingKey } });
        const nextBarcode = setting && setting.value ? parseInt(String(setting.value), 10) : 1000;
        
        if (setting) {
            await prisma.setting.update({
                where: { id: setting.id },
                data: { value: String(nextBarcode + 1) }
            });
        } else {
            await prisma.setting.create({
                data: { key: settingKey, value: String(nextBarcode + 1), tenantId: user.tenantId }
            });
        }

        return NextResponse.json({ barcode: String(nextBarcode) });
    } catch (error: any) {
        log.error('Barcode generation error:', error);
        return NextResponse.json({ error: 'خطأ في توليد الباركود' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
