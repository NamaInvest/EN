import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'desktop-verify-license' });

export async function POST(req: NextRequest) {
    try {
        const prisma = getPrisma(req);
        const { licenseKey, hardwareId, appVersion } = await req.json();

        if (!licenseKey) {
            return NextResponse.json({ success: false, error: 'License key is required' }, { status: 400 });
        }

        const license = await prisma.desktopLicense.findUnique({
            where: { licenseKey }
        });

        if (!license) {
            return NextResponse.json({ success: false, error: 'Invalid license key' }, { status: 404 });
        }

        if (license.status === 'suspended' || license.status === 'expired') {
            return NextResponse.json({ success: false, error: 'License is suspended or expired' }, { status: 403 });
        }

        if (license.expiresAt && license.expiresAt < new Date()) {
            await prisma.desktopLicense.update({
                where: { id: license.id },
                data: { status: 'expired' }
            });
            return NextResponse.json({ success: false, error: 'License has expired' }, { status: 403 });
        }

        // Auto-bind hardware ID if not set
        if (!license.hardwareId && hardwareId) {
            await prisma.desktopLicense.update({
                where: { id: license.id },
                data: { hardwareId, appVersion, activatedAt: new Date(), lastVerifiedAt: new Date(), activatedDevices: 1 }
            });
        } else if (license.hardwareId && license.hardwareId !== hardwareId && hardwareId) {
             return NextResponse.json({ success: false, error: 'License is bound to another device' }, { status: 403 });
        } else {
            // Just update last verified
            await prisma.desktopLicense.update({
                where: { id: license.id },
                data: { lastVerifiedAt: new Date(), appVersion: appVersion || license.appVersion }
            });
        }

        return NextResponse.json({
            success: true,
            companyName: license.companyNameAr || license.companyNameEn,
            expiresAt: license.expiresAt,
            status: license.status
        });
    } catch (e: any) {
        log.error('Desktop License Verify error:', e.message);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
