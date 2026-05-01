import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
    const prisma = getPrisma(request as any);
    const user = getUserFromRequest(request as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const { journalEntryId, reversalDate, reason } = await request.json();

        const originalEntry = await prisma.journalEntry.findUnique({
            where: { id: parseInt(journalEntryId) },
            include: { lines: true }
        });

        if (!originalEntry) return NextResponse.json({ error: 'القيد الأصلي غير موجود' }, { status: 404 });
        if (originalEntry.status !== 'posted') return NextResponse.json({ error: 'لا يمكن عكس قيد غير مُرحل' }, { status: 400 });

        // Generate Reversal Entry
        const reversalEntry = await prisma.$transaction(async (tx: any) => {
            const newEntry = await tx.journalEntry.create({
                data: {
                    entryNumber: `${originalEntry.entryNumber}-R`,
                    entryDate: reversalDate || new Date().toISOString().split('T')[0],
                    description: `قيد عكسي للقيد ${originalEntry.entryNumber} - السبب: ${reason || 'تصحيح خطأ'}`,
                    reference: originalEntry.entryNumber,
                    totalDebit: originalEntry.totalCredit, // Swapped
                    totalCredit: originalEntry.totalDebit, // Swapped
                    status: 'posted',
                    createdBy: user.userId,
                    currencyId: originalEntry.currencyId,
                    exchangeRate: originalEntry.exchangeRate,
                    branchId: originalEntry.branchId
                }
            });

            // Swap Debits and Credits
            for (const line of originalEntry.lines) {
                await tx.journalLine.create({
                    data: {
                        journalEntryId: newEntry.id,
                        accountId: line.accountId,
                        debit: line.credit,   // Reverse
                        credit: line.debit,   // Reverse
                        description: `عكس: ${line.description || ''}`,
                        costCenterId: line.costCenterId
                    }
                });

                // Update Account Balances (Impact Reversal)
                await tx.account.update({
                    where: { id: line.accountId },
                    data: {
                        balance: {
                            increment: line.credit - line.debit // Opposite of normal entry logic
                        }
                    }
                });
            }

            // Mark original as reversed
            await tx.journalEntry.update({
                where: { id: originalEntry.id },
                data: { status: 'reversed', description: `${originalEntry.description} [تم عكسه بقيد ${newEntry.entryNumber}]` }
            });

            return newEntry;
        });

        return NextResponse.json({
            success: true,
            reversalEntryNumber: reversalEntry.entryNumber,
            message: 'تم إنشاء القيد العكسي بنجاح'
        });

    } catch (error: any) {
        console.error("Reversal Engine Error:", error);
        return NextResponse.json({ error: error.message || 'فشل إنشاء القيد العكسي' }, { status: 500 });
    }
}
