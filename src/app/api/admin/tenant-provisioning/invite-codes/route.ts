import { NextResponse } from 'next/server';
import { withGuard } from '@/lib/auth';
import { validateInviteCode } from '@/lib/tenant/provisioning-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withGuard(async (req, params, user) => {
    if (user.role !== 'admin' && user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    const envCodes = process.env.ONBOARDING_INVITE_CODES;
    const codes = envCodes
        ? envCodes.split(',').map(c => c.trim())
        : ['NAMA-GA-2026', 'NAMA-GA-PROD-2026'];

    return NextResponse.json({
        success: true,
        codes,
    });
});

export const POST = withGuard(async (req, params, user) => {
    if (user.role !== 'admin' && user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ success: false, error: 'code is required' }, { status: 400 });
        }

        const isValid = validateInviteCode(code);
        return NextResponse.json({
            success: true,
            code,
            valid: isValid,
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
});
