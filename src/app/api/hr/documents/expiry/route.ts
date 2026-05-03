/**
 * Document Expiry API Routes
 * GET  /api/hr/documents/expiry — لوحة انتهاء الوثائق
 * POST /api/hr/documents/expiry — تشغيل الفحص الدوري
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { DocumentExpiryEngine } from '@/lib/document-expiry';

export async function GET(req: Request) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const dashboard = await DocumentExpiryEngine.getDashboard();
        return NextResponse.json(dashboard);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const channels = body.channels || ['DASHBOARD'];
        const result = await DocumentExpiryEngine.scanAndAlert(channels);
        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
