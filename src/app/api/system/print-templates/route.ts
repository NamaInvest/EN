import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { PrintTemplateEngine } from '@/lib/print-template-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'system.print-templates' });
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const model = req.nextUrl.searchParams.get('model');
    if (!model) return NextResponse.json({ models: PrintTemplateEngine.getSupportedModels() });
    const fields = PrintTemplateEngine.getFields(model);
    const defaultTemplate = PrintTemplateEngine.getDefaultTemplate(model);
    return NextResponse.json({ fields, defaultTemplate });
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  templateId: z.union([z.string(), z.number()]).optional(),
  recordId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'render') {
            const html = await PrintTemplateEngine.render(prisma, body.templateId, body.recordId);
            return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        return NextResponse.json({ error: 'action: render' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
