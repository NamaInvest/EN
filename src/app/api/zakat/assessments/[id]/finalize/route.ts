import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { ZakatEngine } from '@/lib/zakat-engine';
import { apiError } from '@/lib/api-error';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    try {
        const result = await ZakatEngine.finalize(parseInt(id, 10), user.userId);
        return NextResponse.json(result);
    } catch (e) {
        return apiError(e, 'فشل اعتماد التقدير', { context: 'zakat/finalize' });
    }
}
