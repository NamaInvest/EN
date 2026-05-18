import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.upload-logo' });
async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (user.role !== 'admin' && user.role !== 'owner') return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });

        const formData = await request.formData();
        const file = formData.get('logo') as File;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'يجب اختيار ملف صورة' }, { status: 400 });
        }

        // Validate size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'حجم الصورة يجب أن يكون أقل من 2 ميغابايت' }, { status: 400 });
        }

        // Convert to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Save to settings
        const existing = await prisma.setting.findFirst({
            where: { key: 'company_logo', tenantId: user.tenantId },
        });

        if (existing) {
            await prisma.setting.update({
                where: { id: existing.id },
                data: { value: base64 },
            });
        } else {
            await prisma.setting.create({
                data: { key: 'company_logo', value: base64, description: 'شعار الشركة', tenantId: user.tenantId },
            });
        }

        return NextResponse.json({ success: true, logo: base64 });
    } catch (error: any) {
        log.error('Logo upload error:', error);
        return NextResponse.json({ error: 'فشل في رفع الشعار' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'UPLOAD' });
