import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.zatca-onboard' });

const _POSTSchema = z.object({
  orgName: z.any().optional(),
  orgNameEn: z.any().optional(),
  vatNumber: z.any().optional(),
  crn: z.any().optional(),
  street: z.any().optional(),
  building: z.any().optional(),
  district: z.any().optional(),
  city: z.any().optional(),
  cityEn: z.any().optional(),
  postal: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const user = getUserFromRequest(req as any);
        if (!user || !['admin', 'owner'].includes(user.role)) {
            return NextResponse.json({ error: 'صلاحية المسؤول مطلوبة' }, { status: 403 });
        }

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const settingsToSave = [
            { key: 'company_name', value: body.orgName || '' },
            { key: 'company_name_en', value: body.orgNameEn || 'Nama Company' },
            { key: 'tax_number', value: body.vatNumber || '' },
            { key: 'zatca_crn', value: String(body.crn || '') },
            { key: 'zatca_street', value: body.street || '' },
            { key: 'zatca_building', value: String(body.building || '') },
            { key: 'zatca_district', value: body.district || '' },
            { key: 'zatca_city', value: body.city || '' },
            { key: 'zatca_city_en', value: body.cityEn || 'Riyadh' },
            { key: 'zatca_postal_code', value: String(body.postal || '') },
            { key: 'zatca_industry', value: 'Retail' },
            { key: 'zatca_environment', value: 'simulation' }
        ];

        const updateTasks = settingsToSave.map(async (s) => {
            const existing = await prisma.setting.findFirst({
                where: { key: s.key, tenantId: user.tenantId }
            });
            if (existing) {
                return prisma.setting.update({
                    where: { id: existing.id },
                    data: { value: String(s.value) }
                });
            } else {
                return prisma.setting.create({
                    data: { key: s.key, value: String(s.value), tenantId: user.tenantId }
                });
            }
        });
        
        await Promise.all(updateTasks);

        return NextResponse.json({ 
            success: true, 
            message: 'تم حفظ إعدادات الزكاة (البيانات الجغرافية) في قاعدة البيانات بنجاح.'
        });

    } catch (e: any) {
        log.error('ZATCA Save Settings Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
