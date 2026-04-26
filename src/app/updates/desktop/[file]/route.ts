import { NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /updates/desktop/latest.yml
 * 
 * يوفّر ملف معلومات التحديث لـ electron-updater
 */
export async function GET(req: Request, { params }: { params: { file: string } | Promise<{ file: string }> }) {
    const resolvedParams = await Promise.resolve(params);
    const file = resolvedParams?.file;
    
    if (!file) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // أنواع الملفات المسموح بها فقط
    const allowed = ['latest.yml', 'latest-mac.yml', 'latest-linux.yml'];
    if (!allowed.includes(file) && !file.endsWith('.exe') && !file.endsWith('.dmg') && !file.endsWith('.AppImage') && !file.endsWith('.blockmap')) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        const filePath = join(process.cwd(), 'public', 'updates', 'desktop', file);
        const stats = statSync(filePath);
        
        // @ts-ignore
        const stream = createReadStream(filePath);
        
        const contentType = file.endsWith('.yml') ? 'text/yaml' : 'application/octet-stream';
        
        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': stats.size.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'File not found', details: e.message }, { status: 404 });
    }
}
