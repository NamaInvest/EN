import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { MFAEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/backup-codes — Regenerate backup codes
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

        // Optionally, require verifying current TOTP before regenerating
        const body = await request.json().catch(() => ({}));
        const token = body.token;
        if (!token) {
            return NextResponse.json({ error: 'رمز التحقق مطلوب' }, { status: 400 });
        }

        const isValid = await MFAEngine.verifyToken(user.userId, token);
        if (!isValid) return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 401 });

        const newCodes = await MFAEngine.generateBackupCodes(user.userId);

        return NextResponse.json({ codes: newCodes }, { status: 200 });
    } catch (e: any) {
        console.error('[2FA Backup Codes]', e);
        return NextResponse.json({ error: 'فشل إنشاء رموز الاحتياط' }, { status: 500 });
    }
}
