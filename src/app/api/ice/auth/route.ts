import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// بيانات دخول ICE - يمكن نقلها لـ env لاحقاً
const ICE_USERNAME = process.env.ICE_USERNAME || 'admin';
const ICE_PASSWORD = process.env.ICE_PASSWORD || 'O_O772040030';
const ICE_SECRET = process.env.ICE_SECRET || 'default-ice-secret-change-in-production';

function generateToken(): string {
    const payload = {
        user: ICE_USERNAME,
        exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 أيام
        rand: crypto.randomBytes(8).toString('hex'),
    };
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    const sig = crypto.createHmac('sha256', ICE_SECRET).update(data).digest('hex');
    return `${data}.${sig}`;
}

function verifyIceToken(token: string): boolean {
    try {
        const [data, sig] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', ICE_SECRET).update(data).digest('hex');
        if (sig !== expectedSig) return false;
        const payload = JSON.parse(Buffer.from(data, 'base64').toString());
        if (payload.exp < Date.now()) return false;
        return payload.user === ICE_USERNAME;
    } catch {
        return false;
    }
}

// POST: تسجيل الدخول
async function _POST(req: Request) {

    try {
        const { username, password } = await req.json();

        if (username !== ICE_USERNAME || password !== ICE_PASSWORD) {
            return NextResponse.json(
                { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        const token = generateToken();

        const response = NextResponse.json({ success: true });
        response.cookies.set('ice_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 أيام
        });

        return response;
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// DELETE: تسجيل الخروج
async function _DELETE() {

    const response = NextResponse.json({ success: true });
    response.cookies.delete('ice_token');
    return response;
}

// GET: فحص حالة الجلسة
async function _GET() {

    const cookieStore = await cookies();
    const token = cookieStore.get('ice_token')?.value;

    if (!token || !verifyIceToken(token)) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: ICE_USERNAME });
}

export const GET = withRoute(async ({ req }) => _GET(), { rateLimit: 'AUTH' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });

export const DELETE = withRoute(async ({ req }) => _DELETE(), { rateLimit: 'AUTH' });
