import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        }

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

        let createdCount = 0;
        for (const a of accounts) {
            const existing = await prisma.account.findFirst({ where: { code: a.code } });
            if (!existing) {
                await prisma.account.create({ data: { ...a, isActive: true, balance: 0 } });
                createdCount++;
            }
        }

        return NextResponse.json({ success: true, message: `تم تهيئة ${createdCount} حساب جديد بنجاح` });
    } catch (error: any) {
        console.error('Account init error:', error);
        return NextResponse.json({ error: 'فشل في تهيئة الحسابات' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
