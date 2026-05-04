import { NextRequest, NextResponse } from 'next/server';
import { MfaEngine } from '@/lib/mfa-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, code } = body;
        if (!userId || !code) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const result = await MfaEngine.confirmEnrollment(userId, code);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
