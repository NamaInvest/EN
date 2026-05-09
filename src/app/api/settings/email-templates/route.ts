import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { EmailTemplateEngine } from '@/lib/email-template-engine';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try { return NextResponse.json(await EmailTemplateEngine.list(prisma, user.tenantId || '')); }
    catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
async function _POST(req: NextRequest) {
    const user = getUserFromRequest(req as any) as any;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'render') return NextResponse.json(EmailTemplateEngine.renderTemplate({ subject: body.subject, body: body.body }, body.vars || {}));
        if (body.action === 'update') return NextResponse.json(await EmailTemplateEngine.update(prisma, body.id, body));
        return NextResponse.json(await EmailTemplateEngine.create(prisma, { ...body, tenantId: user.tenantId || '' }));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
