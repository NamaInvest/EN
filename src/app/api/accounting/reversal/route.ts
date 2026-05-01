import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createJournalEntry } from '@/lib/auto-journal';

export async function POST(request: Request) {
    const prisma = getPrisma(request as any);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { journalEntryId, reversalDate, reason } = await request.json();

        const originalEntry = await prisma.journalEntry.findUnique({
            where: { id: parseInt(journalEntryId) },
            include: {
                lines: { include: { account: { select: { code: true } } } },
            },
        });

        if (!originalEntry) return NextResponse.json({ error: 'القيد الأصلي غير موجود' }, { status: 404 });
        if (originalEntry.status !== 'posted') return NextResponse.json({ error: 'لا يمكن عكس قيد غير مُرحل' }, { status: 400 });
        if (originalEntry.entryNumber.endsWith('-R')) {
            return NextResponse.json({ error: 'لا يمكن عكس قيد عكسي' }, { status: 400 });
        }

        // Build reversal lines: swap debits/credits, keep same accounts/cost-centers.
        // createJournalEntry handles balance updates centrally (CLAUDE.md §3.1).
        const reversalLines = originalEntry.lines.map((line: any) => ({
            accountCode: line.account.code,
            costCenterId: line.costCenterId ?? undefined,
            debit: line.credit,
            credit: line.debit,
            description: `عكس: ${line.description || ''}`.trim(),
        }));

        const result = await createJournalEntry({
            description: `قيد عكسي للقيد ${originalEntry.entryNumber} - السبب: ${reason || 'تصحيح خطأ'}`,
            reference: originalEntry.entryNumber,
            date: reversalDate || new Date().toISOString().split('T')[0],
            lines: reversalLines,
            userId: user.userId,
            branchId: originalEntry.branchId,
            currencyId: originalEntry.currencyId,
            exchangeRate: originalEntry.exchangeRate,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'فشل إنشاء القيد العكسي' }, { status: 500 });
        }

        // Mark original as reversed (does NOT touch account.balance — handled by createJournalEntry)
        const reversalEntry = await prisma.journalEntry.findUnique({ where: { id: result.entryId } });
        await prisma.journalEntry.update({
            where: { id: originalEntry.id },
            data: {
                status: 'reversed',
                description: `${originalEntry.description} [تم عكسه بقيد ${reversalEntry?.entryNumber || result.entryId}]`,
            },
        });

        return NextResponse.json({
            success: true,
            reversalEntryNumber: reversalEntry?.entryNumber,
            reversalEntryId: result.entryId,
            message: 'تم إنشاء القيد العكسي بنجاح',
        });

    } catch (error: any) {
        console.error('Reversal Engine Error:', error);
        return NextResponse.json({ error: error.message || 'فشل إنشاء القيد العكسي' }, { status: 500 });
    }
}
