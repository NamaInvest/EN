import { getUserFromRequest } from '@/lib/auth';
/**
 * Insurance → Auto-Journal API
 * POST /api/pharmacy/insurance/journal
 * يحوّل مطالبة تأمين محصّلة إلى قيد محاسبي تلقائي
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const { claimId, paidAmount } = body;

        // @ts-ignore — pharmacy model
        const claim = await prisma.insuranceClaim.findUnique({
            where: { id: parseInt(claimId) },
            include: { patient: { select: { name: true } } },
        });
        if (!claim) return NextResponse.json({ error: 'المطالبة غير موجودة' }, { status: 404 });

        const amount = parseFloat(paidAmount) || claim.insuranceAmount;

        const entryRef = `INS-CLM-${claim.id}`;
        await prisma.journalEntry.create({
            data: {
                entryNumber: entryRef,
                entryDate: new Date().toISOString().split('T')[0],
                reference: entryRef,
                description: `تحصيل مطالبة تأمين — ${claim.insuranceCompany} — ${claim.patient?.name}`,
                createdBy: user.userId,
                totalDebit: amount,
                totalCredit: amount,
                lines: {
                    create: [
                        {
                            accountId: 1, // Bank — عدّل حسب دليل الحسابات
                            debit: amount,
                            credit: 0,
                            description: `تحصيل من ${claim.insuranceCompany}`,
                        },
                        {
                            accountId: 3, // ذمم تأمين صحي — عدّل حسب دليل الحسابات
                            debit: 0,
                            credit: amount,
                            description: `مطالبة #${claim.claimRef}`,
                        },
                    ],
                },
            },
        });


        // Update claim status to paid
        // @ts-ignore — pharmacy model
        await prisma.insuranceClaim.update({
            where: { id: parseInt(claimId) },
            data: { status: 'paid', resolvedAt: new Date() },
        });

        return NextResponse.json({ success: true, message: 'تم تسجيل القيد المحاسبي بنجاح' });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'خطأ في تسجيل القيد' }, { status: 500 });
    }
}
