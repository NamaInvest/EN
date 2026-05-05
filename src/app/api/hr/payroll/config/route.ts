import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: 'payroll_accounting_config' }
        });

        const accounts = await prisma.account.findMany({
            where: { isActive: true },
            select: { id: true, code: true, name: true, type: true }
        });

        let config = setting?.value ? JSON.parse(setting.value) : {
            basicSalary: null,
            housingAllowance: null,
            transportAllowance: null,
            otherAllowance: null,
            gosiDeduction: null,
            unpaidLeaveDeduction: null,
            netPayableLiability: null
        };

        return NextResponse.json({ success: true, data: { config, accounts } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { config } = body;

        await prisma.setting.upsert({
            where: { key: 'payroll_accounting_config' },
            update: { value: JSON.stringify(config) },
            create: { key: 'payroll_accounting_config', value: JSON.stringify(config), description: 'Mapping of payroll components to GL Accounts' }
        });

        return NextResponse.json({ success: true, message: 'تم حفظ إعدادات الرواتب المحاسبية بنجاح' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
