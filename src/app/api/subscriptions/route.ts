import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'subscriptions' });
const prisma = new PrismaClient();

const SSO_SECRET = process.env.SSO_SECRET || 'namainvest-sso-2024';

import { getPrisma, getClient } from '@/lib/prisma';

const _POSTSchema = z.object({
  tenantId: z.union([z.string(), z.number()]).optional(),
  action: z.any().optional(),
  days: z.union([z.string(), z.number()]).optional(),
  planLabel: z.any().optional(),
  userQuota: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: NextRequest) {
    const user = await getUserFromRequest(request as any);
    const masterToken = request.cookies.get('master_token')?.value;
    if (masterToken !== 'SECURE_MASTER_VALIDATED' && (!user || user.role !== 'owner')) {
        return NextResponse.json({ error: 'عفواً، هذه الصلاحية مخصصة لمالك المنصة فقط' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const { tenantId, action, days, planLabel, userQuota } = body;

        if (!tenantId || !action) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        const tenantAccount = await prisma.tenantAccount.findUnique({
            where: { id: parseInt(tenantId) }
        });

        if (!tenantAccount) {
            return NextResponse.json({ error: 'الشركة غير موجودة' }, { status: 404 });
        }

        if (action === 'extend') {
            const extraDays = parseInt(days) || 30;
            const currentEndDate = tenantAccount.trialEndsAt ? new Date(tenantAccount.trialEndsAt) : new Date();
            const newEndDate = new Date(Math.max(Date.now(), currentEndDate.getTime()));
            newEndDate.setDate(newEndDate.getDate() + extraDays);
            
            // Update tenant's DB setting
            const tenantPrisma = getClient(tenantAccount.subdomain);
            await tenantPrisma.setting.upsert({
                where: { key: 'trialEndsAt' },
                update: { value: newEndDate.getTime().toString() },
                create: { key: 'trialEndsAt', value: newEndDate.getTime().toString() }
            });
            await tenantPrisma.setting.upsert({
                where: { key: 'trialActive' },
                update: { value: 'true' },
                create: { key: 'trialActive', value: 'true' }
            });

            // Update Master DB
            await prisma.tenantAccount.update({
                where: { id: tenantAccount.id },
                data: { 
                    trialEndsAt: newEndDate, 
                    subscriptionStatus: 'active',
                    plan: planLabel || tenantAccount.plan
                }
            });

            return NextResponse.json({ message: 'تم تمديد الصلاحية بنجاح' });
        }

        if (action === 'suspend') {
            const tenantPrisma = getClient(tenantAccount.subdomain);
            await tenantPrisma.setting.upsert({
                where: { key: 'trialActive' },
                update: { value: 'false' },
                create: { key: 'trialActive', value: 'false' }
            });

            await prisma.tenantAccount.update({
                where: { id: tenantAccount.id },
                data: { status: 'suspended', subscriptionStatus: 'suspended' }
            });
            return NextResponse.json({ message: 'تم إيقاف الاشتراك بنجاح' });
        }
        
        if (action === 'update_quota') {
            const q = parseInt(userQuota) || 1;
            await prisma.tenantAccount.update({
                where: { id: tenantAccount.id },
                data: { userQuota: q }
            });
            return NextResponse.json({ message: 'تم تحديث الحد الأقصى للمستخدمين' });
        }

        if (action === 'open') {
            const payload = {
                type: 'sso-auto-login',
                clerkUserId: 'master-override',
                email: tenantAccount.userEmail,
                subdomain: tenantAccount.subdomain,
                exp: Date.now() + (15 * 60 * 1000),
                overrideRole: 'owner'
            };
            const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const signature = createHmac('sha256', SSO_SECRET).update(payloadB64).digest('hex');
            const ssoToken = `${payloadB64}:${signature}`;
            const targetUrl = `https://${tenantAccount.subdomain}.namainvist.com/auto-login?token=${encodeURIComponent(ssoToken)}`;
            return NextResponse.json({ url: targetUrl });
        }

        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    } catch (error: any) {
        log.error('Subscription API Error:', error);
        return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
