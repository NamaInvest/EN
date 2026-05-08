import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// GET - دفتر الأستاذ لحساب معين
import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const { searchParams } = new URL(request.url);
        const accountId = parseInt(searchParams.get('accountId') || '0');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!accountId) {
            return NextResponse.json({ error: 'معرف الحساب مطلوب' }, { status: 400 });
        }

        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account) {
            return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
        }

        // Build where clause for journal entry dates
        const entryWhere: Record<string, unknown> = {};
        if (from) entryWhere.entryDate = { ...(entryWhere.entryDate as object || {}), gte: from };
        if (to) entryWhere.entryDate = { ...(entryWhere.entryDate as object || {}), lte: to };

        const lines = await prisma.journalLine.findMany({
            take: 100,
            where: {
                accountId,
                entry: entryWhere,
            },
            include: {
                entry: {
                    select: { entryNumber: true, entryDate: true, description: true, reference: true },
                },
            },
            orderBy: { entry: { entryDate: 'asc' } },
        });

        // Calculate running balance
        let runningBalance = 0;
        const isDebitNormal = ['asset', 'expense'].includes(account.type);

        const ledgerLines = lines.map(line => {
            if (isDebitNormal) {
                runningBalance += line.debit - line.credit;
            } else {
                runningBalance += line.credit - line.debit;
            }
            return {
                id: line.id,
                date: line.entry.entryDate,
                entryNumber: line.entry.entryNumber,
                description: line.description || line.entry.description,
                reference: line.entry.reference,
                debit: line.debit,
                credit: line.credit,
                balance: Math.round(runningBalance * 100) / 100,
            };
        });

        return NextResponse.json({
            account: { id: account.id, code: account.code, name: account.name, type: account.type },
            lines: ledgerLines,
            totalDebit: Math.round(lines.reduce((s: any, l: any) => s + l.debit, 0) * 100) / 100,
            totalCredit: Math.round(lines.reduce((s: any, l: any) => s + l.credit, 0) * 100) / 100,
            closingBalance: Math.round(runningBalance * 100) / 100,
        });
    } catch (error: any) {
        console.error('Ledger GET error:', error);
        return NextResponse.json({ error: 'فشل في جلب دفتر الأستاذ' }, { status: 500 });
    }
}
