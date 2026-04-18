import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { generateB2BToken } from '@/lib/b2b-auth';

export async function POST(req: NextRequest) {
    const prisma = getPrisma(req);
    try {
        const { phone, password } = await req.json();
        if (!phone) return NextResponse.json({ success: false, error: 'الرجاء إدخال رقم الجوال' }, { status: 400 });

        const customer = await prisma.customer.findFirst({
            where: { phone, b2bEnabled: true }
        });

        if (!customer) {
            return NextResponse.json({ success: false, error: 'هذا الرقم غير مصرح له بالدخول للبوابة الجملة. يرجى مراجعة الإدارة.' }, { status: 401 });
        }

        // Check password if set
        if (customer.password && customer.password !== password) {
             return NextResponse.json({ success: false, error: 'كلمة المرور غير صحيحة' }, { status: 401 });
        }

        const token = generateB2BToken({
            customerId: customer.id,
            phone: customer.phone || '',
            b2b: true
        });

        const response = NextResponse.json({ success: true, customer: { id: customer.id, name: customer.name } });
        response.cookies.set('b2b_token', token, { httpOnly: true, path: '/' });
        return response;

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
