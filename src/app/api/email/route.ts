import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, welcomeEmailTemplate, passwordResetTemplate } from '@/lib/email';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';

export async function POST(request: NextRequest) {

    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const prisma = getPrisma(request);
        const allowed = await hasPermission(auth.userId, 'manage_users', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();
        const { type, to, ...data } = body;

        let emailData: { subject: string; html: string } | null = null;

        if (type === 'welcome') {
            emailData = welcomeEmailTemplate(data.fullName, data.username, data.password, data.systemUrl || process.env.NEXTAUTH_URL || 'https://namainvist.com');
        } else if (type === 'password-reset') {
            emailData = passwordResetTemplate(data.fullName, data.newPassword);
        } else if (type === 'custom') {
            emailData = { subject: data.subject, html: data.html };
        } else {
            return NextResponse.json({ error: 'نوع البريد غير صحيح' }, { status: 400 });
        }

        const { emailQueue } = require('@/lib/queue');
        await emailQueue.add('sendEmail', { to, ...emailData });

        return NextResponse.json({ success: true, message: `✅ تمت إضافة البريد إلى الطابور للإرسال إلى ${to}` });
    } catch (err: any) {
        console.error('[API Email]', err);
        return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 });
    }
}

// Test endpoint (GET)
export async function GET(request: NextRequest) {

    try {
        const { searchParams } = new URL(request.url);
        // const auth = getUserFromRequest(request as any);
        // if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const targetEmail = searchParams.get('email') || process.env.ICE_OWNER_EMAIL || 'ialqrashi62@gmail.com';

        const { sendEmail } = await import('@/lib/email');
        const success = await sendEmail({
            to: targetEmail,
            subject: '✅ اختبار البريد الإلكتروني - نما انفست',
            html: '<div dir="rtl" style="font-family:Arial;padding:20px"><h2>🎉 نجح الاختبار!</h2><p>تم ربط ZeptoMail بنجاح مع نظام نما انفست.</p></div>',
        });

        return NextResponse.json({ success, message: success ? '✅ تم إرسال بريد الاختبار بنجاح!' : '❌ فشل إرسال البريد' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
