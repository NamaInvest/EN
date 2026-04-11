import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        }

        const { confirmation } = await request.json();
        if (confirmation !== 'WIPE_SYSTEM_N11') {
            return NextResponse.json({ error: 'كلمة التأكيد غير صحيحة' }, { status: 400 });
        }

        // Extremely destructive operation: Wipe all operational data
        console.log('STARTING POSTGRESQL CASCADING TRUNCATE via API...');
        
        const excluded = ["'users'", "'settings'", "'companies'", "'branches'", "'subscriptions'", "'accounts'", "'system_alerts'", "'_prisma_migrations'"];
        const result = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (${excluded.join(', ')})`);
        // @ts-ignore
        const tables = result.map(r => r.tablename);
        
        if (tables.length > 0) {
            console.log('Truncating ' + tables.length + ' operational tables...');
            const query = `TRUNCATE TABLE ${tables.map((t: string) => '"' + t + '"').join(', ')} RESTART IDENTITY CASCADE;`;
            await prisma.$executeRawUnsafe(query);
        }
        
        // Reset account balances
        await prisma.$executeRawUnsafe('UPDATE accounts SET balance = 0;');
        
        // Delete non-admin users manually
        await prisma.$executeRawUnsafe("DELETE FROM user_permissions WHERE user_id IN (SELECT id FROM users WHERE role NOT IN ('admin', 'owner'));");
        await prisma.$executeRawUnsafe("DELETE FROM users WHERE role NOT IN ('admin', 'owner');");

        // Re-seed default customer for POS
        try {
            await prisma.customer.create({
                data: { id: 1, name: 'عميل نقدي', phone: '000000000', type: 0 }
            });
        } catch (e) {
            // already exists or can't be created
        }

        return NextResponse.json({ message: 'تم تهيئة وتصفير النظام بنجاح!' });
    } catch (error) {
        console.error('System Wipe Error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء تهيئة النظام' }, { status: 500 });
    }
}
