import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { VendorPortalEngine } from '@/lib/vendor-portal-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const supplierId = parseInt(req.nextUrl.searchParams.get('supplierId') || '0');
        const view = req.nextUrl.searchParams.get('view');
        if (view === 'dashboard') return NextResponse.json(await VendorPortalEngine.dashboard(prisma, supplierId));
        if (view === 'payments') return NextResponse.json(await VendorPortalEngine.getMyPayments(prisma, supplierId));
        return NextResponse.json(await VendorPortalEngine.getMyPOs(prisma, supplierId));
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const prisma = getPrisma(req);
    try {
        const body = await req.json();
        if (body.action === 'submit_invoice') return NextResponse.json(await VendorPortalEngine.submitInvoice(prisma, body));
        return NextResponse.json({ error: 'action: submit_invoice' }, { status: 400 });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
