import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { sendEmail, welcomeEmailTemplate, passwordResetTemplate } from '@/lib/email';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { z } from 'zod';


const _POSTSchema = z.object({
  type: z.any().optional(),
  to: z.any().optional(),
}).passthrough();

async function _POST(request: NextRequest) {

    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const prisma = getPrisma(request);
        const allowed = await hasPermission(auth.userId, 'manage_users', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
async function _GET(request: NextRequest) {

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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
