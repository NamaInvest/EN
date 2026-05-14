import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();
        
        // Simple hardcoded master credentials (can be moved to .env)
        const validUser = process.env.MASTER_PANEL_USER || 'admin';
        const validPass = process.env.MASTER_PANEL_PASS || 'namasoft2024';

        if (username === validUser && password === validPass) {
            const res = NextResponse.json({ success: true });
            res.cookies.set('master_token', 'SECURE_MASTER_VALIDATED', {
                httpOnly: true,
                path: '/',
                maxAge: 60 * 60 * 24 // 1 day
            });
            return res;
        }

        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
