import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'namainvest-secret';
const DEMO_SUBDOMAIN = 'brightstartradingco';

/**
 * GET /api/demo/enter
 * 
 * مسار الدخول التجريبي المباشر — يسمح بالدخول لحساب الشركة الوهمية
 * بدون الحاجة لاسم مستخدم أو كلمة سر.
 */
export async function GET(req: Request) {
    const DEMO_DB_URL = `postgresql://n11_db:n11_pass123@localhost:5432/${DEMO_SUBDOMAIN}_db?schema=public`;

    let prisma: PrismaClient | null = null;

    try {
        prisma = new PrismaClient({
            datasources: { db: { url: DEMO_DB_URL } },
        });

        // ابحث عن مستخدم admin نشط
        const admin = await prisma.user.findFirst({
            where: { role: 'admin', active: true },
        });

        if (!admin) {
            return NextResponse.json({ error: 'لم يتم العثور على حساب المدير' }, { status: 404 });
        }

        // توليد JWT Token بنفس الطريقة المستخدمة في النظام
        const token = jwt.sign(
            {
                userId: admin.id,
                username: admin.username,
                role: admin.role,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // إنشاء صفحة HTML تقوم بتخزين الـ Token وتحويل الزائر للداشبورد
        const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>جاري الدخول للحساب التجريبي...</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0f172a;
            color: white;
            font-family: 'Noto Sans Arabic', sans-serif;
        }
        .container { text-align: center; }
        .spinner {
            width: 48px; height: 48px;
            border: 4px solid #6366f1;
            border-top: 4px solid transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        p { color: #94a3b8; font-size: 16px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <p>🚀 جاري الدخول للحساب التجريبي...</p>
    </div>
    <script>
        var token = "${token}";
        var user = ${JSON.stringify({
            id: admin.id,
            username: admin.username,
            fullName: admin.fullName || 'مدير النظام',
            role: admin.role,
        })};
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        document.cookie = 'token=' + token + '; path=/; max-age=' + (60 * 60 * 24) + '; domain=.namainvist.com';
        
        window.location.replace('https://${DEMO_SUBDOMAIN}.namainvist.com/dashboard');
    </script>
</body>
</html>`;

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });

    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في الاتصال بالحساب التجريبي', details: e.message }, { status: 500 });
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}
