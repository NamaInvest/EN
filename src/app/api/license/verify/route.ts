import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * ════════════════════════════════════════════════════════
 * Desktop License Verification Server (Law 2)
 * ════════════════════════════════════════════════════════
 * 
 * وظيفة هذا الخادم:
 * 1. استلام مفتاح الترخيص (License Key) ومعرف اللوحة الأم (Hardware ID) من تطبيق الـ EXE (Qt أو Electron).
 * 2. التحقق من صلاحية الاشتراك (Subscription Status).
 * 3. التحقق من ربط الجهاز أو منعه من العمل على أكثر من جهاز مسموح.
 * 4. إرجاع Token مشفر يحتوي على الـ Feature Flags لتفعيل/تعطيل الأقسام داخل الـ EXE.
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { licenseKey, hardwareId, appVersion } = body;

        if (!licenseKey || !hardwareId) {
            return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
        }

        // 1. التحقق من وجود الترخيص
        const license = await prisma.desktopLicense.findUnique({
            where: { licenseKey },
            include: { 
                tenantAccount: true,
                featureFlags: true
            }
        });

        if (!license) {
            return NextResponse.json({ error: 'Invalid License Key' }, { status: 401 });
        }

        // 2. التحقق من حالة الاشتراك
        if (license.status === 'suspended') {
            return NextResponse.json({ error: 'License has been suspended by administration' }, { status: 403 });
        }

        const now = new Date();
        if (license.expiresAt && license.expiresAt < now) {
            return NextResponse.json({ error: 'License expired' }, { status: 403 });
        }

        // 3. التحقق من Hardware ID (منع القرصنة وتعدد الأجهزة بدون تصريح)
        // إذا كان فارغاً (أول تشغيل)، قم بربطه
        if (!license.hardwareId) {
            await prisma.desktopLicense.update({
                where: { id: license.id },
                data: {
                    hardwareId,
                    activatedAt: now,
                    status: 'active',
                    appVersion
                }
            });
        } else if (license.hardwareId !== hardwareId) {
            // الجهاز لا يتطابق
            return NextResponse.json({ error: 'Hardware ID mismatch. Please contact support to reset device lock.' }, { status: 403 });
        }

        // تحديث آخر تسجيل دخول للترخيص
        await prisma.desktopLicense.update({
            where: { id: license.id },
            data: { lastVerifiedAt: now, appVersion }
        });

        // 4. بناء الـ Feature Flags
        const activeModules: Record<string, boolean> = {};
        for (const flag of license.featureFlags) {
            activeModules[flag.moduleName] = flag.isEnabled;
        }

        // توقيع البيانات (Signature) لضمان عدم التلاعب بها داخل الـ EXE
        // يتم التوقيع باستخدام الـ JWT_SECRET أو مفتاح مخصص
        const secret = process.env.JWT_SECRET || 'nama-fallback-secret-key-2024';
        const payload = JSON.stringify({
            tenantId: license.tenantId,
            orgName: license.tenantAccount?.orgName || license.companyNameEn,
            modules: activeModules,
            validUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000) // صالحة لمدة 24 ساعة فقط (يجب التحقق يومياً)
        });

        const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        return NextResponse.json({
            status: 'success',
            data: payload,
            signature
        });

    } catch (error) {
        console.error('[LicenseServer] Error verifying license:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
