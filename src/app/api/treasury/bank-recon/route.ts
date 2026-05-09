import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        let statement = await (prisma as any).bankStatement.findFirst({
            include: { lines: true },
            orderBy: { id: 'desc' }
        });

        if (!statement) {
            // Seed a dummy statement for demo
            const newStatement = await (prisma as any).bankStatement.create({
                data: {
                    bankAccountId: 1, // Assumes bank account 1 exists
                    statementDate: new Date(),
                    statementNumber: 'STMT-2026-05',
                    openingBalance: 1200000.00,
                    closingBalance: 1250400.50,
                    status: 'IMPORTED',
                    lines: {
                        create: [
                            { transactionDate: new Date('2026-05-02'), description: 'INWARD TRANSFER REF 88291 (AL SHARQ)', amount: 20000.00, type: 'CREDIT', matchStatus: 'UNMATCHED' },
                            { transactionDate: new Date('2026-05-02'), description: 'BANK CHARGE - MONTHLY', amount: -400.50, type: 'DEBIT', matchStatus: 'UNMATCHED' },
                            { transactionDate: new Date('2026-05-01'), description: 'OUTWARD TRANSFER REF 1102', amount: -15000.00, type: 'DEBIT', matchStatus: 'AUTO_MATCHED', matchConfidence: 100 }
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
        // @ts-expect-error [TS7006] Implicit any parameter
        const matchedLines = lines.filter(l => l.matchStatus === 'MATCHED');
        const matchRate = lines.length > 0 ? (matchedLines.length / lines.length) * 100 : 0;
        
        // Mock book balance calculation based on statement balance and unmatched lines
        const statementBalance = Number(statement.closingBalance || 0);
        // @ts-expect-error [TS7006] Implicit any parameter
        const difference = lines.filter(l => l.matchStatus !== 'MATCHED').reduce((acc: any, curr: any) => acc + Number(curr.amount), 0);
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
    } catch (error: any) {
        console.error('Bank Recon GET error:', error);
        return NextResponse.json({ error: 'فشل جلب بيانات المطابقة البنكية' }, { status: 500 });
    }
}

async function _PUT(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();
        const { lineId, action } = body;

        if (action === 'auto-match') {
            // Mock auto-matching logic: match all lines that have 'auto' in description or similar heuristics
            const lines = await (prisma as any).bankStatementLine.findMany({
            take: 100, where: { matchStatus: 'UNMATCHED' } });
            let matchedCount = 0;
            for (const line of lines) {
                // If it's a generic outward transfer or fee, mock it as matched
                await (prisma as any).bankStatementLine.update({
                    where: { id: line.id },
                    data: { matchStatus: 'AUTO_MATCHED', matchConfidence: 95 }
                });
                matchedCount++;
            }
            return NextResponse.json({ success: true, matchedCount });
        } else if (lineId) {
            await (prisma as any).bankStatementLine.update({
                where: { id: lineId },
                data: { matchStatus: 'AUTO_MATCHED', matchConfidence: 100 }
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    } catch (error: any) {
        console.error('Bank Recon PUT error:', error);
        return NextResponse.json({ error: 'فشل تحديث حالة المطابقة' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'FINANCIAL' });
