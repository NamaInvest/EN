import { NextResponse, NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { MfaEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/backup-codes — Regenerate backup codes (invalidates old set)
 */
export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
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
    } catch (e) {
        console.error('[2FA Backup Codes]', e);
        return NextResponse.json({ error: 'فشل إنشاء رموز الاحتياط' }, { status: 500 });
    }
}
