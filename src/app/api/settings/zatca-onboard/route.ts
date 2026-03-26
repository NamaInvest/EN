import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            // Optional: fallback auth guard for testing
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        
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

        const updateTasks = settingsToSave.map(s => 
            prisma.setting.upsert({
                where: { key: s.key },
                update: { value: String(s.value) },
                create: { key: s.key, value: String(s.value) }
            })
        );
        
        await Promise.all(updateTasks);

        return NextResponse.json({ 
            success: true, 
            message: 'تم حفظ إعدادات الزكاة (البيانات الجغرافية) في قاعدة البيانات بنجاح.'
        });

    } catch (e: any) {
        console.error('ZATCA Save Settings Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
