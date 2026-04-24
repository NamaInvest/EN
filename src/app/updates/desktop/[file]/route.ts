import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /updates/desktop/latest.yml
 * 
 * يوفّر ملف معلومات التحديث لـ electron-updater
 * ضع ملف latest.yml و NamaInvest-Setup-x.x.x.exe في /www/wwwroot/n11.namainvist.com/public/updates/
 */
export async function GET(req: Request, { params }: { params: { file: string } }) {
    const file = params.file;
    
    // أنواع الملفات المسموح بها فقط
    const allowed = ['latest.yml', 'latest-mac.yml', 'latest-linux.yml'];
    if (!allowed.includes(file) && !file.endsWith('.exe') && !file.endsWith('.dmg') && !file.endsWith('.AppImage')) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        const filePath = join(process.cwd(), 'public', 'updates', file);
        const content = readFileSync(filePath);
        
        const contentType = file.endsWith('.yml') ? 'text/yaml' : 'application/octet-stream';
        
        return new NextResponse(content, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': content.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
}
