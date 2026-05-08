import { NextRequest, NextResponse } from 'next/server';
import { ZakatEngine } from '@/lib/zakat-engine';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    try {
        const body = await req.json().catch(() => ({}));
        const updated = await ZakatEngine.markFiled(parseInt(id, 10), user.userId, {
            zatcaTransactionId: body.zatcaTransactionId,
            filingReference: body.filingReference,
        });
        return NextResponse.json(updated);
    } catch (e: any) {
        return apiError(e, 'فشل تسجيل التقديم', { context: 'zakat/file' });
    }
}
