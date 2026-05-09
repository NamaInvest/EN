import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { EmailTemplateEngine } from '@/lib/email-template-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try { return NextResponse.json(await EmailTemplateEngine.list(prisma, user.tenantId || '')); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

const _POSTSchema = z.object({
  action: z.any().optional(),
  subject: z.any().optional(),
  body: z.any().optional(),
  vars: z.any().optional(),
  id: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        if (body.action === 'render') return NextResponse.json(EmailTemplateEngine.renderTemplate({ subject: body.subject, body: body.body }, body.vars || {}));
        if (body.action === 'update') return NextResponse.json(await EmailTemplateEngine.update(prisma, body.id, body));
        return NextResponse.json(await EmailTemplateEngine.create(prisma, { ...body, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
