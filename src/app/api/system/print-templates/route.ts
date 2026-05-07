import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { PrintTemplateEngine } from '@/lib/print-template-engine';

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const model = req.nextUrl.searchParams.get('model');
    if (!model) return NextResponse.json({ models: PrintTemplateEngine.getSupportedModels() });
    const fields = PrintTemplateEngine.getFields(model);
    const defaultTemplate = PrintTemplateEngine.getDefaultTemplate(model);
    return NextResponse.json({ fields, defaultTemplate });
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'render') {
            const html = await PrintTemplateEngine.render(prisma, body.templateId, body.recordId);
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        return NextResponse.json({ error: 'action: render' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
