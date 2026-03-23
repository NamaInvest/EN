import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'owner') {
        return NextResponse.json({ error: 'عفواً، هذه الصلاحية مخصصة لمالك المنصة فقط' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { companyId, action, days, planLabel } = body;

        if (!companyId || !action) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        if (action === 'extend') {
            const extraDays = parseInt(days) || 30;
            const newEndDate = new Date();
            newEndDate.setDate(newEndDate.getDate() + extraDays);
            
            // Suspend old ones
            await prisma.subscription.updateMany({
                where: { companyId: parseInt(companyId), status: 'ACTIVE' },
                data: { status: 'EXPIRED' }
            });

            // Create new one
            await prisma.subscription.create({
                data: {
                    companyId: parseInt(companyId),
                    planLabel: planLabel || 'PRO',
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: newEndDate
                }
            });
            return NextResponse.json({ message: 'تم تجديد الاشتراك بنجاح' });
        }

        if (action === 'suspend') {
            await prisma.subscription.updateMany({
                where: { companyId: parseInt(companyId), status: 'ACTIVE' },
                data: { status: 'SUSPENDED' }
            });
            return NextResponse.json({ message: 'تم إيقاف الاشتراك بنجاح' });
        }

        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    } catch (error: any) {
        console.error('Subscription API Error:', error);
        return NextResponse.json({ error: 'حدث خطأ داخلي' }, { status: 500 });
    }
}
