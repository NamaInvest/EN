import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        const prisma = getPrisma(request);
        const settings = await prisma.setting.findMany();
        // Filter out sensitive ZATCA keys from public response
        const sensitiveKeys = ['zatca_private_key', 'zatca_certificate', 'zatca_compliance_token', 'zatca_compliance_secret', 'zatca_production_token', 'zatca_production_secret'];
        const filtered = settings.map(s => sensitiveKeys.includes(s.key) ? { ...s, value: '***' } : s);
        return NextResponse.json(filtered);
    } catch (error) { console.error(error); return NextResponse.json([], { status: 500 }); }
}

// Clear ZATCA integration data
export async function DELETE(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const prisma = getPrisma(request);
        const allowed = await hasPermission(auth.userId, 'clear_zatca');
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية حذف بيانات الزكاة' }, { status: 403 });

        const zatcaKeys = [
            'zatca_private_key', 'zatca_certificate', 'zatca_csr',
            'zatca_compliance_token', 'zatca_compliance_secret',
            'zatca_production_token', 'zatca_production_secret',
            'zatca_request_id',
        ];
        const result = await prisma.setting.deleteMany({ where: { key: { in: zatcaKeys } } });
        // Also reset the zatca_settings table so onboarding starts fresh
        try {
            await prisma.$executeRawUnsafe(
                `UPDATE zatca_settings SET onboarding_status='disconnected', private_key=NULL, certificate=NULL,
                 csid=NULL, csid_secret=NULL, production_csid=NULL, production_secret=NULL,
                 zatca_compliance_token=NULL, zatca_compliance_secret=NULL, zatca_compliance_request_id=NULL,
                 zatca_production_token=NULL, zatca_production_secret=NULL`
            );
        } catch (e) { console.error('Reset zatca_settings table:', e); }
        return NextResponse.json({ success: true, message: `تم حذف ${result.count} من بيانات ربط الزكاة والدخل` });
    } catch (error) {
        console.error('Settings DELETE (ZATCA clear) error:', error);
        return NextResponse.json({ error: 'فشل في حذف بيانات الزكاة' }, { status: 500 });
    }
}

// Save or Update Configuration Settings
export async function POST(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const prisma = getPrisma(request);
        const allowed = await hasPermission(auth.userId, 'settings');
        if (!allowed && auth.role !== 'admin' && auth.role !== 'owner') {
            return NextResponse.json({ error: 'غير مصرح - ليس لديك صلاحية التعديل' }, { status: 403 });
        }

        const data = await request.json();
        const updatePromises = Object.entries(data).map(([key, value]) => {
            return prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value), description: '' }
            });
        });

        await prisma.$transaction(updatePromises);
        return NextResponse.json({ success: true, message: 'تم حفظ الإعدادات' });
    } catch (error: any) {
        console.error('Settings POST error:', error);
        return apiError(error, 'فشل في حفظ الإعدادات', { context: 'settings' });
    }
}
