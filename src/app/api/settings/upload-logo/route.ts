import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
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
        await prisma.setting.upsert({
            where: { key: 'company_logo' },
            update: { value: base64 },
            create: { key: 'company_logo', value: base64, description: 'شعار الشركة' },
        });

        return NextResponse.json({ success: true, logo: base64 });
    } catch (error: any) {
        console.error('Logo upload error:', error);
        return NextResponse.json({ error: 'فشل في رفع الشعار' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'UPLOAD' });
