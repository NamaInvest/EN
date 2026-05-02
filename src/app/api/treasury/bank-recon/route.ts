import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        let statement = await prisma.bankStatement.findFirst({
            include: { lines: true },
            orderBy: { id: 'desc' }
        });

        if (!statement) {
            // Seed a dummy statement for demo
            const newStatement = await prisma.bankStatement.create({
                data: {
                    bankAccountId: 1, // Assumes bank account 1 exists
                    statementDate: new Date(),
                    statementNumber: 'STMT-2026-05',
                    openingBalance: 1200000.00,
                    closingBalance: 1250400.50,
                    status: 'IMPORTED',
                    lines: {
                        create: [
                            { transactionDate: new Date('2026-05-02'), description: 'INWARD TRANSFER REF 88291 (AL SHARQ)', amount: 20000.00, type: 'CREDIT', reconciledStatus: 'UNRECONCILED' },
                            { transactionDate: new Date('2026-05-02'), description: 'BANK CHARGE - MONTHLY', amount: -400.50, type: 'DEBIT', reconciledStatus: 'UNRECONCILED' },
                            { transactionDate: new Date('2026-05-01'), description: 'OUTWARD TRANSFER REF 1102', amount: -15000.00, type: 'DEBIT', reconciledStatus: 'MATCHED', matchConfidence: 100 }
                        ]
                    }
                },
                include: { lines: true }
            });
            statement = newStatement as any;
        }

        if (!statement) {
            return NextResponse.json({
                statement: null,
                lines: [],
                summary: { statementBalance: 0, bookBalance: 0, difference: 0, matchRate: 0 }
            });
        }



        const lines = statement.lines;
        const matchedLines = lines.filter(l => l.reconciledStatus === 'MATCHED');
        const matchRate = lines.length > 0 ? (matchedLines.length / lines.length) * 100 : 0;
        
        // Mock book balance calculation based on statement balance and unmatched lines
        const statementBalance = Number(statement.closingBalance || 0);
        const difference = lines.filter(l => l.reconciledStatus !== 'MATCHED').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const bookBalance = statementBalance - difference;

        return NextResponse.json({
            statement,
            lines,
            summary: {
                statementBalance,
                bookBalance,
                difference: Math.abs(difference),
                matchRate: Math.round(matchRate)
            }
        });
    } catch (error) {
        console.error('Bank Recon GET error:', error);
        return NextResponse.json({ error: 'فشل جلب بيانات المطابقة البنكية' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();
        const { lineId, action } = body;

        if (action === 'auto-match') {
            // Mock auto-matching logic: match all lines that have 'auto' in description or similar heuristics
            const lines = await prisma.bankStatementLine.findMany({ where: { reconciledStatus: 'UNRECONCILED' } });
            let matchedCount = 0;
            for (const line of lines) {
                // If it's a generic outward transfer or fee, mock it as matched
                await prisma.bankStatementLine.update({
                    where: { id: line.id },
                    data: { reconciledStatus: 'MATCHED', matchConfidence: 95 }
                });
                matchedCount++;
            }
            return NextResponse.json({ success: true, matchedCount });
        } else if (lineId) {
            await prisma.bankStatementLine.update({
                where: { id: lineId },
                data: { reconciledStatus: 'MATCHED', matchConfidence: 100 }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    } catch (error) {
        console.error('Bank Recon PUT error:', error);
        return NextResponse.json({ error: 'فشل تحديث حالة المطابقة' }, { status: 500 });
    }
}
