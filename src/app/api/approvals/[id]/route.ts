import { NextResponse } from 'next/server';
import { ApprovalEngine } from '@/lib/approval-engine';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const params = await context.params;
    const stepId = parseInt((await params).id);

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
