import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'upload' });

async function _POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'حجم الملف يتجاوز 2MB' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'نوع الملف غير مدعوم. استخدم PNG, JPG, WEBP أو GIF' }, { status: 400 });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadsDir, filename);
        await writeFile(filePath, buffer);

        // Return URL
        const url = `/uploads/${filename}`;
        return NextResponse.json({ success: true, url, filename });
    } catch (err: any) {
        log.error('Upload error:', err);
        return NextResponse.json({ error: err.message || 'فشل رفع الملف' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'UPLOAD' });
