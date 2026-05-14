import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import crypto from 'crypto';

async function _GET(req: NextRequest) {
    const masterToken = req.cookies.get('master_token')?.value;
    const user = await getUserFromRequest(req as any);
    if (masterToken !== 'SECURE_MASTER_VALIDATED' && (!user || user.role !== 'owner')) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const prisma = getPrisma(req);
        const licenses = await prisma.desktopLicense.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ licenses });
    } catch (e: any) {
        console.error('Licenses fetch error:', e.message);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

async function _POST(req: NextRequest) {
    const masterToken = req.cookies.get('master_token')?.value;
    const user = await getUserFromRequest(req as any);
    if (masterToken !== 'SECURE_MASTER_VALIDATED' && (!user || user.role !== 'owner')) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const prisma = getPrisma(req);
        const { action, companyNameAr } = await req.json();

        if (action === 'CREATE') {
            const licenseKey = [1, 2, 3, 4].map(() => crypto.randomBytes(4).toString('hex').toUpperCase()).join('-');
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year license

            const newLicense = await prisma.desktopLicense.create({
                data: {
                    licenseKey,
                    companyNameAr,
                    status: 'active',
                    expiresAt,
                    maxDevices: 3
                }
            });
            return NextResponse.json({ success: true, license: newLicense });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        console.error('License execute error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT', requireAuth: false });
