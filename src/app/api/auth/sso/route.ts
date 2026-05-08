import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { SSOEngine } from '@/lib/sso-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const tenantDomain = req.nextUrl.searchParams.get('domain') || 'namainvist.com';
    return new NextResponse(SSOEngine.generateSPMetadata(tenantDomain), {
        headers: { 'Content-Type': 'application/xml' },
    });
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
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
