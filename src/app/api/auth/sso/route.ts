import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { SSOEngine } from '@/lib/sso-engine';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.sso' });
async function _GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantDomain = req.nextUrl.searchParams.get('domain') || 'namainvist.com';
    return new NextResponse(SSOEngine.generateSPMetadata(tenantDomain), {
        headers: { 'Content-Type': 'application/xml' },
    });
}


const _POSTSchema = z.object({
  action: z.any().optional(),
  user: z.any().optional(),
  email: z.string().email().optional(),
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
        if (body.action === 'provision') {
            const result = await SSOEngine.scimProvisionUser(prisma, body.user);
            return NextResponse.json(result);
        }
        if (body.action === 'deprovision') {
            await SSOEngine.scimDeprovisionUser(prisma, body.email);
            return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: 'action: provision | deprovision' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AUTH' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
