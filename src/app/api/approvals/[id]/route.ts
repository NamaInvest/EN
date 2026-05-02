import { NextResponse } from 'next/server';
import { ApprovalEngine } from '@/lib/approval-engine';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const stepId = parseInt(params.id);

    try {
        const body = await request.json();
        const { action, notes } = body; // action: 'APPROVED' | 'REJECTED'

        if (action !== 'APPROVED' && action !== 'REJECTED') {
            return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
        }

        const result = await ApprovalEngine.processStep(stepId, _auth.id.toString(), action, notes);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Approvals POST error:', error);
        return NextResponse.json({ error: error.message || 'فشل في معالجة طلب الاعتماد' }, { status: 500 });
    }
}
