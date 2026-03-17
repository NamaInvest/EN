/**
 * بذر شجرة الحسابات الافتراضية - المعيار السعودي
 * تشغيل: npx tsx prisma/seed-accounts.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const defaultAccounts = [
    // ===== 1000 الأصول =====
    { code: '1000', name: 'الأصول', nameEn: 'Assets', type: 'asset', parentId: 0, level: 0 },
    { code: '1100', name: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', parentId: 0, level: 1 },
    { code: '1110', name: 'الصندوق', nameEn: 'Cash', type: 'asset', parentId: 0, level: 2 },
    { code: '1120', name: 'البنك', nameEn: 'Bank', type: 'asset', parentId: 0, level: 2 },
    { code: '1130', name: 'شيكات تحت التحصيل', nameEn: 'Checks Receivable', type: 'asset', parentId: 0, level: 2 },
    { code: '1200', name: 'المدينون (العملاء)', nameEn: 'Accounts Receivable', type: 'asset', parentId: 0, level: 2 },
    { code: '1300', name: 'المخزون', nameEn: 'Inventory', type: 'asset', parentId: 0, level: 2 },
    { code: '1400', name: 'ضريبة القيمة المضافة - مدخلات', nameEn: 'VAT Input', type: 'asset', parentId: 0, level: 2 },
    { code: '1500', name: 'مصروفات مدفوعة مقدماً', nameEn: 'Prepaid Expenses', type: 'asset', parentId: 0, level: 2 },
    { code: '1600', name: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset', parentId: 0, level: 1 },
    { code: '1610', name: 'أثاث ومعدات', nameEn: 'Furniture & Equipment', type: 'asset', parentId: 0, level: 2 },
    { code: '1620', name: 'أجهزة كمبيوتر', nameEn: 'Computers', type: 'asset', parentId: 0, level: 2 },
    { code: '1630', name: 'سيارات', nameEn: 'Vehicles', type: 'asset', parentId: 0, level: 2 },
    { code: '1690', name: 'مجمع الإهلاك', nameEn: 'Accumulated Depreciation', type: 'asset', parentId: 0, level: 2 },

    // ===== 2000 الخصوم =====
    { code: '2000', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', parentId: 0, level: 0 },
    { code: '2100', name: 'الدائنون (الموردون)', nameEn: 'Accounts Payable', type: 'liability', parentId: 0, level: 1 },
    { code: '2200', name: 'القروض', nameEn: 'Loans', type: 'liability', parentId: 0, level: 1 },
    { code: '2300', name: 'ضريبة القيمة المضافة - مخرجات', nameEn: 'VAT Output', type: 'liability', parentId: 0, level: 1 },
    { code: '2400', name: 'رواتب مستحقة', nameEn: 'Salaries Payable', type: 'liability', parentId: 0, level: 1 },
    { code: '2500', name: 'مصروفات مستحقة', nameEn: 'Accrued Expenses', type: 'liability', parentId: 0, level: 1 },

    // ===== 3000 حقوق الملكية =====
    { code: '3000', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', parentId: 0, level: 0 },
    { code: '3100', name: 'رأس المال', nameEn: 'Capital', type: 'equity', parentId: 0, level: 1 },
    { code: '3200', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', parentId: 0, level: 1 },
    { code: '3300', name: 'جاري المالك', nameEn: 'Owner Drawing', type: 'equity', parentId: 0, level: 1 },

    // ===== 4000 الإيرادات =====
    { code: '4000', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', parentId: 0, level: 0 },
    { code: '4100', name: 'المبيعات', nameEn: 'Sales', type: 'revenue', parentId: 0, level: 1 },
    { code: '4110', name: 'مرتجعات المبيعات', nameEn: 'Sales Returns', type: 'revenue', parentId: 0, level: 1 },
    { code: '4120', name: 'خصم مسموح به', nameEn: 'Sales Discount', type: 'revenue', parentId: 0, level: 1 },
    { code: '4200', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', parentId: 0, level: 1 },

    // ===== 5000 المصروفات =====
    { code: '5000', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', parentId: 0, level: 0 },
    { code: '5100', name: 'تكلفة البضاعة المباعة', nameEn: 'Cost of Goods Sold', type: 'expense', parentId: 0, level: 1 },
    { code: '5110', name: 'مرتجعات المشتريات', nameEn: 'Purchase Returns', type: 'expense', parentId: 0, level: 1 },
    { code: '5200', name: 'الرواتب والأجور', nameEn: 'Salaries & Wages', type: 'expense', parentId: 0, level: 1 },
    { code: '5300', name: 'الإيجار', nameEn: 'Rent', type: 'expense', parentId: 0, level: 1 },
    { code: '5400', name: 'الكهرباء والماء', nameEn: 'Utilities', type: 'expense', parentId: 0, level: 1 },
    { code: '5500', name: 'اتصالات وإنترنت', nameEn: 'Telecom & Internet', type: 'expense', parentId: 0, level: 1 },
    { code: '5600', name: 'صيانة ونظافة', nameEn: 'Maintenance', type: 'expense', parentId: 0, level: 1 },
    { code: '5700', name: 'مصروفات تسويق', nameEn: 'Marketing', type: 'expense', parentId: 0, level: 1 },
    { code: '5800', name: 'مصروفات إدارية', nameEn: 'Administrative', type: 'expense', parentId: 0, level: 1 },
    { code: '5900', name: 'إهلاك الأصول', nameEn: 'Depreciation', type: 'expense', parentId: 0, level: 1 },
    { code: '5950', name: 'مصروفات متنوعة', nameEn: 'Miscellaneous', type: 'expense', parentId: 0, level: 1 },
];

async function seedAccounts() {
    console.log('🌳 بذر شجرة الحسابات...');

    let created = 0;
    let skipped = 0;

    for (const acc of defaultAccounts) {
        const exists = await prisma.account.findFirst({ where: { code: acc.code } });
        if (exists) {
            skipped++;
            continue;
        }
        await prisma.account.create({
            data: {
                code: acc.code,
                name: acc.name,
                nameEn: acc.nameEn,
                type: acc.type,
                parentId: acc.parentId,
                level: acc.level,
                isActive: true,
                balance: 0,
            },
        });
        created++;
    }

    console.log(`✅ تم: ${created} حساب جديد | ${skipped} موجود مسبقاً`);
}

seedAccounts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
