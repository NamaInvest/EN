import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { MfaEngine } from '@/lib/mfa-engine';

/**
 * POST /api/auth/2fa/backup-codes â€” Regenerate backup codes
 */
export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'ط؛ظٹط± ظ…طµط±ط­' }, { status: 401 });

        // Optionally, require verifying current TOTP before regenerating
        const body = await request.json().catch(() => ({}));
        const token = body.token;
        if (!token) {
            return NextResponse.json({ error: 'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ظ…ط·ظ„ظˆط¨' }, { status: 400 });
        }

        const isValid = await MfaEngine.verifyToken(user.userId, token);
        if (!isValid) return NextResponse.json({ error: 'ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ط؛ظٹط± طµط­ظٹط­' }, { status: 401 });

        const newCodes = await MfaEngine.generateBackupCodes(user.userId);

        return NextResponse.json({ codes: newCodes }, { status: 200 });
    } catch (e: any) {
        console.error('[2FA Backup Codes]', e);
        return NextResponse.json({ error: 'ظپط´ظ„ ط¥ظ†ط´ط§ط، ط±ظ…ظˆط² ط§ظ„ط§ط­طھظٹط§ط·' }, { status: 500 });
    }
}
