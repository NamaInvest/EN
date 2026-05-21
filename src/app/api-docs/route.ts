import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'docs', 'api-docs.html');
        const html = fs.readFileSync(filePath, 'utf-8');
        
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600'
            }
        });
    } catch (e) {
        return NextResponse.json({ error: 'API Docs not built. Run npm run build-docs first.' }, { status: 404 });
    }
}
