import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MfaEngine } from '@/lib/mfa-engine';

import { getUserFromRequest } from '@/lib/auth';
/**
 * POST /api/auth/2fa/backup-codes — Regenerate backup codes (invalidates old set)
 */
async function _POST(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        const body = await request.json().catch(() => ({}));
        const token = body.token;
        if (!token) return NextResponse.json({ error: 'رمز التحقق مطلوب' }, { status: 400 });

        // Verify before regenerating
        try {
            await MfaEngine.verify(user.userId, token, 'totp');
        } catch {
            return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 401 });
        }

        const codes = await MfaEngine.regenerateBackupCodes(user.userId);
        return NextResponse.json({ codes });
    } catch (e: any) {
        console.error('[2FA Backup Codes]', e);
        return NextResponse.json({ error: 'فشل إنشاء رموز الاحتياط' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
