/**
 * EOS Actions API
 * POST /api/hr/eos/[id] — approve or pay
 */
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { SaudiEOSEngine } from '@/lib/saudi-eos-engine';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const eosId = parseInt((await params).id);

    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'approve') {
            await SaudiEOSEngine.approve(eosId, user.userId);
            return NextResponse.json({ success: true, message: 'تم الموافقة على التسوية' });
        } else if (action === 'pay') {
            await SaudiEOSEngine.pay(eosId, user.userId);
            return NextResponse.json({ success: true, message: 'تم صرف التسوية وإنشاء القيد' });
        } else {
            return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
        }
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
