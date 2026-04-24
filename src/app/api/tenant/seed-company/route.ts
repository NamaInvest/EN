import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getDbUrl } from '@/lib/prisma';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/tenant/seed-company
// يُستدعى من provision/route.ts بعد انتهاء Prisma db push
// يزرع بيانات الشركة وكيانات النظام الأساسية في قاعدة بيانات الـ tenant
// ──────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    let prisma: PrismaClient | null = null;
    try {
        const body = await req.json();
        const {
            subdomain,
            secret,
            companyNameAr,
            companyNameEn,
            vatNumber,
            crnNumber,
            mobile,
            city,
            district,
            address,
            buildingNo,
            postalCode,
            businessDomain,
            branchName,
            zatcaBranchNameEn,
            zatcaCityEn,
        } = body;

        // حماية بسيطة: secret مشترك بين provision route و seed route
        const expectedSecret = process.env.PROVISION_SECRET || 'namainvest-provision-2024';
        if (secret !== expectedSecret) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        if (!subdomain) {
            return NextResponse.json({ success: false, message: 'subdomain required' }, { status: 400 });
        }

        // الاتصال بقاعدة بيانات الـ tenant مباشرة
        const dbUrl = getDbUrl(subdomain);
        prisma = new PrismaClient({
            datasources: { db: { url: dbUrl } },
        });

        // ── Helper: upsert setting ───────────────────────────────────────────
        async function upsertSetting(key: string, value: string) {
            if (!value && value !== '0') return;
            await prisma!.setting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        }

        // ── 1. بيانات الشركة الأساسية ────────────────────────────────────────
        await upsertSetting('company_name', companyNameAr || '');
        await upsertSetting('company_name_en', companyNameEn || '');
        await upsertSetting('tax_number', vatNumber || '');
        await upsertSetting('zatca_crn', crnNumber || '');
        await upsertSetting('company_phone', mobile || '');
        await upsertSetting('company_address', `${city || ''} ${district || ''} ${address || ''} ${buildingNo || ''}`.trim());
        await upsertSetting('posFooterText', `Thank you for visiting ${companyNameEn || companyNameAr}`);
        await upsertSetting('zatca_industry', businessDomain || '');
        await upsertSetting('branch_name_en', zatcaBranchNameEn || '');
        await upsertSetting('zatca_city_en', zatcaCityEn || '');
        await upsertSetting('zatca_city', city || '');
        await upsertSetting('zatca_district', district || '');
        await upsertSetting('zatca_street', address || '');
        await upsertSetting('zatca_building', buildingNo || '');
        await upsertSetting('zatca_postal_code', postalCode || '');

        // ── 2. إعدادات النظام الافتراضية ─────────────────────────────────────
        const trialEndMs = Date.now() + (5 * 24 * 60 * 60 * 1000); // 5 أيام تجربة
        await upsertSetting('trialActive', 'true');
        await upsertSetting('trialEndsAt', trialEndMs.toString());
        await upsertSetting('maxTrialInvoices', '30');
        await upsertSetting('tax_rate', '15');
        await upsertSetting('POS_TAX_ENABLED', 'true');
        await upsertSetting('POS_TAX_INCLUSIVE', 'true');

        // ── 3. مستخدم admin ────────────────────────────────────────────────────
        const bcryptjs = require('bcryptjs');
        const adminHash = bcryptjs.hashSync('admin7773', 10);
        await prisma.user.upsert({
            where: { username: 'admin' },
            update: { passwordHash: adminHash, role: 'admin', active: true },
            create: {
                username: 'admin',
                fullName: `${companyNameAr} - مدير النظام`,
                passwordHash: adminHash,
                role: 'admin',
                active: true,
            },
        });

        // ── 4. الكيانات الأساسية (مرة واحدة فقط) ──────────────────────────────
        // أولاً: إنشاء سجل الشركة (مطلوب كـ FK للفرع)
        const existingCompany = await prisma.company.findFirst();
        const company = existingCompany ?? await prisma.company.create({
            data: {
                name: companyNameAr,
                nameEn: companyNameEn || companyNameAr,
                taxNumber: vatNumber || null,
                address: `${city || ''} ${address || ''}`.trim() || null,
            },
        });

        const existingBranch = await prisma.branch.findFirst();
        if (!existingBranch) {
            const defaultBranch = await prisma.branch.create({
                data: {
                    companyId: company.id,
                    name: branchName || companyNameAr || 'الفرع الرئيسي',
                    nameEn: 'Main Branch',
                    address: `${city || ''} ${address || ''}`.trim() || null,
                    isActive: true,
                },
            });

            await prisma.stock.create({
                data: {
                    name: companyNameAr || 'المستودع الرئيسي',
                    address: address || null,
                    branchId: defaultBranch.id,
                },
            });

            await prisma.customer.create({
                data: {
                    name: 'عميل نقدي',
                    phone: '0000000000',
                    active: true,
                },
            });

            await prisma.unit.createMany({
                data: [
                    { name: 'حبة' },
                    { name: 'كرتون' },
                ],
                skipDuplicates: true,
            });
        }


        return NextResponse.json({ success: true, message: 'Seeded successfully' });

    } catch (err: any) {
        console.error('[seed-company] Error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}
