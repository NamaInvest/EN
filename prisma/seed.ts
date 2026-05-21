import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { runPharmacySeed } from './seeds/verticals/pharmacy/index.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 بدء إعداد قاعدة البيانات...');

    const args = process.argv.slice(2);
    const verticalArg = args.find(a => a.startsWith('--vertical='));
    const tenantArg = args.find(a => a.startsWith('--tenantId='));
    
    if (verticalArg) {
        const vertical = verticalArg.split('=')[1];
        const tenantId = tenantArg ? tenantArg.split('=')[1] : `namasoft-${vertical}-demo`;

        if (vertical === 'retail') {
            const { runRetailSeed } = await import('./seeds/verticals/retail/index');
            await runRetailSeed(prisma, tenantId);
            return;
        }
        
        if (vertical === 'pharmacy') {
            await runPharmacySeed(prisma, tenantId);
            return;
        }
    }

    // 1. Admin User
    const adminHash = bcrypt.hashSync('admin', 10);
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: adminHash,
            fullName: 'مدير النظام',
            role: 'admin',
            phone: '',
            active: true,
        },
    });
    console.log('✅ تم إنشاء حساب المدير (admin/admin)');

    // 2. Default Units
    const units = ['حبة', 'كرتون', 'كيلو', 'جرام', 'لتر', 'متر', 'علبة', 'كيس', 'طن'];
    for (const name of units) {
        const existingUnit = await prisma.unit.findFirst({ where: { name } });
        if (!existingUnit) {
            await prisma.unit.create({ data: { name } });
        }
    }
    console.log('✅ تم إنشاء وحدات القياس');

    // 3. Default Company (required for Branch FK)
    const company = await prisma.company.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, name: 'الشركة الرئيسية' },
    }).catch(() => null); // ignore if Company model doesn't exist in older schemas

    // 3.1 Default Branch
    let mainBranch = await prisma.branch.findFirst({ where: { id: 1 } });
    if (!mainBranch) {
        mainBranch = await prisma.branch.create({
            data: { id: 1, companyId: 1, name: 'الفرع الرئيسي', isActive: true },
        }).catch(() => null);
    }
    const mainBranchId = mainBranch?.id ?? null;
    if (mainBranch) console.log('✅ تم إنشاء الفرع الرئيسي');

    // 3.2 Default Stock (Warehouse) — مرتبط بالفرع الرئيسي
    await prisma.stock.upsert({
        where: { id: 1 },
        update: { branchId: mainBranchId },   // ← ربط المستودع بالفرع دائماً
        create: { name: 'المستودع الرئيسي', address: '', branchId: mainBranchId },
    });
    console.log('✅ تم إنشاء المستودع الرئيسي ومرتبط بالفرع الرئيسي');


    // 4. Default Settings
    const settings = [
        { key: 'company_name', value: 'نماء سوفت', description: 'اسم الشركة' },
        { key: 'company_phone', value: '', description: 'هاتف الشركة' },
        { key: 'company_address', value: '', description: 'عنوان الشركة' },
        { key: 'tax_number', value: '', description: 'الرقم الضريبي' },
        { key: 'currency', value: 'ريال', description: 'العملة' },
        { key: 'tax_rate', value: '15', description: 'نسبة الضريبة' },
        { key: 'zatca_enabled', value: '1', description: 'تفعيل ZATCA' },
        { key: 'receipt_header', value: 'بسم الله الرحمن الرحيم', description: 'رأس الفاتورة' },
        { key: 'receipt_footer', value: 'شكراً لتعاملكم معنا', description: 'تذييل الفاتورة' },
        { key: 'printer_name', value: '', description: 'اسم الطابعة' },
        { key: 'whatsapp_token', value: '', description: 'WhatsApp Token' },
        { key: 'whatsapp_phone_id', value: '', description: 'WhatsApp Phone ID' },
    ];
    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        });
    }
    console.log('✅ تم إنشاء الإعدادات الافتراضية');

    // 5. Default Chart of Accounts
    const accounts = [
        { code: '1000', name: 'الأصول', nameEn: 'Assets', type: 'asset', level: 1, parentId: 0 },
        { code: '1100', name: 'النقدية والبنوك', nameEn: 'Cash & Banks', type: 'asset', level: 2, parentId: 1 },
        { code: '1110', name: 'الصندوق', nameEn: 'Cash on Hand', type: 'asset', level: 3, parentId: 2 },
        { code: '1120', name: 'البنك', nameEn: 'Bank', type: 'asset', level: 3, parentId: 2 },
        { code: '1200', name: 'المدينون (العملاء)', nameEn: 'Receivables', type: 'asset', level: 2, parentId: 1 },
        { code: '1300', name: 'المخزون', nameEn: 'Inventory', type: 'asset', level: 2, parentId: 1 },
        { code: '1400', name: 'ضريبة مدخلات (مشتريات)', nameEn: 'VAT Input', type: 'asset', level: 2, parentId: 1 },
        { code: '2000', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', level: 1, parentId: 0 },
        { code: '2100', name: 'الدائنون (الموردون)', nameEn: 'Payables', type: 'liability', level: 2, parentId: 8 },
        { code: '2200', name: 'القروض', nameEn: 'Loans', type: 'liability', level: 2, parentId: 8 },
        { code: '2300', name: 'ضريبة مخرجات (مبيعات)', nameEn: 'VAT Output', type: 'liability', level: 2, parentId: 8 },
        { code: '3000', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', level: 1, parentId: 0 },
        { code: '3100', name: 'رأس المال', nameEn: 'Capital', type: 'equity', level: 2, parentId: 12 },
        { code: '4000', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', level: 1, parentId: 0 },
        { code: '4100', name: 'المبيعات', nameEn: 'Sales', type: 'revenue', level: 2, parentId: 14 },
        { code: '4110', name: 'مرتجعات المبيعات', nameEn: 'Sales Returns', type: 'revenue', level: 3, parentId: 15 },
        { code: '4120', name: 'خصم مسموح به', nameEn: 'Sales Discount', type: 'revenue', level: 3, parentId: 15 },
        { code: '4200', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', level: 2, parentId: 14 },
        { code: '5000', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', level: 1, parentId: 0 },
        { code: '5100', name: 'تكلفة البضاعة المباعة', nameEn: 'COGS', type: 'expense', level: 2, parentId: 19 },
        { code: '5110', name: 'مرتجعات المشتريات', nameEn: 'Purchase Returns', type: 'expense', level: 3, parentId: 20 },
        { code: '5200', name: 'الرواتب', nameEn: 'Salaries', type: 'expense', level: 2, parentId: 19 },
        { code: '5300', name: 'الإيجار', nameEn: 'Rent', type: 'expense', level: 2, parentId: 19 },
        { code: '5400', name: 'الكهرباء', nameEn: 'Electricity', type: 'expense', level: 2, parentId: 19 },
        { code: '5500', name: 'الاتصالات', nameEn: 'Telecommunications', type: 'expense', level: 2, parentId: 19 },
        { code: '5600', name: 'الصيانة', nameEn: 'Maintenance', type: 'expense', level: 2, parentId: 19 },
        { code: '5700', name: 'التسويق', nameEn: 'Marketing', type: 'expense', level: 2, parentId: 19 },
        { code: '5800', name: 'مصروفات إدارية وعامة', nameEn: 'General Expenses', type: 'expense', level: 2, parentId: 19 },
        { code: '5950', name: 'مصروفات متنوعة', nameEn: 'Miscellaneous Expenses', type: 'expense', level: 2, parentId: 19 },
    ];
    for (const a of accounts) {
        const existing = await prisma.account.findFirst({ where: { code: a.code } });
        if (!existing) {
            await prisma.account.create({ data: a });
        }
    }
    console.log('✅ تم إنشاء شجرة الحسابات');

    // 6. Admin Permissions (all modules)
    const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (adminUser) {
        const modules = [
            'dashboard', 'sales', 'purchases', 'sales-returns', 'purchase-returns', 
            'products', 'stock', 'customers', 'treasury', 'expenses', 'reports', 
            'employees', 'settings', 'bookings', 'promotions', 'accounting', 
            'manufacturing', 'fixed-assets', 'coupons', 'loyalty', 'gift-cards', 
            'batches', 'audit-logs', 'branches', 'manage_users', 'manage_permissions', 
            'delete_invoices', 'delete_expense', 'delete_all_expenses', 'edit_expense', 
            'delete_products', 'reset_stock', 'delete_all_sales', 'reset_password', 'clear_zatca'
        ];
        for (const module of modules) {
            const existing = await prisma.userPermission.findFirst({ where: { userId: adminUser.id, module } });
            if (!existing) {
                await prisma.userPermission.create({
                    data: { userId: adminUser.id, module, canView: true, canAdd: true, canEdit: true, canDelete: true, canPrint: true },
                });
            }
        }
        console.log('✅ تم إنشاء وتوسيع كافة صلاحيات المدير');
    }

    // 9. Numbering Sequences (Foundation 0.1) — قوالب التكوين الافتراضية
    // كل (code) له صف "master" بدون fiscalYear/fiscalMonth (current=0) يُستخدم كقالب.
    // عند أول استدعاء فعلي، تُنشأ سلاسل فترات (yearly/monthly) مستقلة تلقائياً.
    const numberingDefaults = [
        { code: 'JE',  name: 'قيد يومية',     prefix: 'JE-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'INV', name: 'فاتورة مبيعات', prefix: 'INV-', padLength: 6, resetFrequency: 'yearly'  },
        { code: 'PO',  name: 'أمر شراء',      prefix: 'PO-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'PR',  name: 'طلب شراء',      prefix: 'PR-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'GRN', name: 'إذن استلام',    prefix: 'GRN-', padLength: 6, resetFrequency: 'yearly'  },
        { code: 'RFQ', name: 'طلب عرض سعر',   prefix: 'RFQ-', padLength: 6, resetFrequency: 'yearly'  },
        { code: 'SO',  name: 'أمر بيع',       prefix: 'SO-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'DN',  name: 'إذن تسليم',     prefix: 'DN-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'WO',  name: 'أمر تشغيل',     prefix: 'WO-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'FA',  name: 'أصل ثابت',      prefix: 'FA-',  padLength: 6, resetFrequency: 'never'   },
        { code: 'EMP', name: 'موظف',          prefix: 'EMP-', padLength: 5, resetFrequency: 'never'   },
        { code: 'SAL', name: 'مسير راتب',     prefix: 'SAL-', padLength: 6, resetFrequency: 'monthly' },
        { code: 'EXP', name: 'مصروف',         prefix: 'EXP-', padLength: 6, resetFrequency: 'yearly'  },
        { code: 'PV',  name: 'سند صرف',       prefix: 'PV-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'RV',  name: 'سند قبض',       prefix: 'RV-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'CHK', name: 'شيك',           prefix: 'CHK-', padLength: 6, resetFrequency: 'yearly'  },
        { code: 'SR',  name: 'مرتجع مبيعات',  prefix: 'SR-',  padLength: 6, resetFrequency: 'yearly'  },
        { code: 'PRT', name: 'مرتجع مشتريات', prefix: 'PRT-', padLength: 6, resetFrequency: 'yearly'  },
        { code: 'ADJ', name: 'تسوية مخزون',   prefix: 'ADJ-', padLength: 6, resetFrequency: 'yearly'  },
        { code: 'TRN', name: 'تحويل مخزون',   prefix: 'TRN-', padLength: 6, resetFrequency: 'yearly'  },
    ];

    for (const def of numberingDefaults) {
        const existing = await prisma.numberingSequence.findFirst({
            where: { code: def.code, branchId: null, fiscalYear: null, fiscalMonth: null },
        });
        if (!existing) {
            await prisma.numberingSequence.create({
                data: { ...def, current: BigInt(0), branchId: null, isActive: true },
            });
        }
    }
    console.log('✅ تم إنشاء قوالب سلاسل الترقيم الافتراضية (' + numberingDefaults.length + ' سلسلة)');

    console.log('\n🎉 تم إعداد قاعدة البيانات بنجاح!');
    console.log('📌 حساب المدير: admin / admin');
}

main()
    .catch((e) => { console.error('❌ خطأ:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
