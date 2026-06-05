import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'upload' });

function checkMagicBytes(buffer: Buffer): string | null {
    if (buffer.length < 4) return null;
    
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    
    // GIF: 47 49 46 38
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
        return 'image/gif';
    }
    
    // WEBP: RIFF at 0 and WEBP at 8
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
    }
    
    return null;
}

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

        // Validate Magic Bytes to prevent MIME spoofing
        const detectedType = checkMagicBytes(buffer);
        if (!detectedType || !allowedTypes.includes(detectedType)) {
            return NextResponse.json({ error: 'نوع الملف الفعلي غير مدعوم أو غير متطابق مع الامتداد' }, { status: 400 });
        }
        if (detectedType !== file.type) {
            return NextResponse.json({ error: 'نوع ترويسة الملف لا يطابق البايتات السحرية للملف' }, { status: 400 });
        }

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
