import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        }

        const { confirmation } = await request.json();
        if (confirmation !== 'WIPE_SYSTEM_N11') {
            return NextResponse.json({ error: 'كلمة التأكيد غير صحيحة' }, { status: 400 });
        }

        // Extremely destructive operation: Wipe all operational data
        console.log('STARTING POSTGRESQL CASCADING TRUNCATE via API...');
        
        // Settings are intentionally NOT excluded so they get completely wiped.
        // user_permissions is EXCLUDED from Truncate to prevent Admin/Owner lockout.
        // accounts is NOT excluded as per user request to wipe chart of accounts.
        const excluded = ["'users'", "'user_permissions'", "'companies'", "'branches'", "'subscriptions'", "'system_alerts'", "'_prisma_migrations'"];
        const result = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (${excluded.join(', ')})`);
        // @ts-ignore
        const tables = result.map(r => r.tablename);
        
        if (tables.length > 0) {
            console.log('Truncating ' + tables.length + ' operational tables...');
            const query = `TRUNCATE TABLE ${tables.map((t: string) => '"' + t + '"').join(', ')} RESTART IDENTITY CASCADE;`;
            await prisma.$executeRawUnsafe(query);
        }
        
        // Factory reset company and branches data (Emptying fields)
        await prisma.$executeRawUnsafe("UPDATE companies SET name = 'مؤسسة جديدة', name_en = NULL, tax_number = NULL, commercial_record = NULL, address = NULL, logo_path = NULL;");
        await prisma.$executeRawUnsafe("UPDATE branches SET name = 'الفرع الرئيسي', name_en = NULL, address = NULL, phone = NULL;");

        // Delete non-admin/non-owner users manually to keep the top tier safe
        await prisma.$executeRawUnsafe("DELETE FROM user_permissions WHERE user_id IN (SELECT id FROM users WHERE role NOT IN ('admin', 'owner'));");
        await prisma.$executeRawUnsafe("DELETE FROM users WHERE role NOT IN ('admin', 'owner');");

        // Re-seed essential generic infrastructure to prevent POS and System crash
        try {
            await prisma.unit.upsert({
                where: { id: 1 },
                update: { name: 'حبة' },
                create: { id: 1, name: 'حبة' }
            });
            await prisma.stock.upsert({
                where: { id: 1 },
                update: { name: 'المستودع الرئيسي', active: true },
                create: { id: 1, name: 'المستودع الرئيسي', active: true }
            });
            await prisma.customer.upsert({
                where: { id: 1 },
                update: { name: 'عميل نقدي', phone: '000000000', type: 0 },
                create: { id: 1, name: 'عميل نقدي', phone: '000000000', type: 0 }
            });

            // Re-seed base Accounts required by auto-journal to prevent system collapse
            const defaultAccounts = [
                { code: '1110', name: 'الصندوق (النقدية)', type: 'asset', level: 1 },
                { code: '1120', name: 'البنك', type: 'asset', level: 1 },
                { code: '1200', name: 'العملاء (المدينون)', type: 'asset', level: 1 },
                { code: '1300', name: 'المخزون', type: 'asset', level: 1 },
                { code: '1310', name: 'بضاعة بالطريق', type: 'asset', level: 1 },
                { code: '1400', name: 'ضريبة المدخلات', type: 'asset', level: 1 },
                { code: '2100', name: 'الموردون (الدائنون)', type: 'liability', level: 1 },
                { code: '2110', name: 'مستحقات الاستلام غير المفوترة', type: 'liability', level: 1 },
                { code: '2300', name: 'ضريبة المخرجات', type: 'liability', level: 1 },
                { code: '4100', name: 'المبيعات', type: 'revenue', level: 1 },
                { code: '4110', name: 'مرتجعات المبيعات', type: 'revenue', level: 1 },
                { code: '4120', name: 'خصم المبيعات', type: 'revenue', level: 1 },
                { code: '4200', name: 'إيرادات أخرى', type: 'revenue', level: 1 },
                { code: '5100', name: 'تكلفة المبيعات', type: 'expense', level: 1 },
                { code: '5110', name: 'مرتجعات المشتريات', type: 'expense', level: 1 },
                { code: '5120', name: 'تسويات وعجز المخزون', type: 'expense', level: 1 },
                { code: '5200', name: 'الرواتب والأجور', type: 'expense', level: 1 },
                { code: '5950', name: 'مصروفات متنوعة', type: 'expense', level: 1 }
            ];
            for (const acc of defaultAccounts) {
                const existing = await prisma.account.findFirst({ where: { code: acc.code } });
                if (!existing) {
                    await prisma.account.create({ data: acc });
                }
            }
        } catch (e) {
            console.log('Re-seed error after wipe (Soft Ignore):', e);
        }

        return NextResponse.json({ message: 'تم تهيئة وتصفير النظام بنجاح!' });
    } catch (error) {
        console.error('System Wipe Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء تهيئة النظام' }, { status: 500 });
    }
}
