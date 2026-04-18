import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury'))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const searchParams = request.nextUrl.searchParams;
        const bankAccountId = searchParams.get('bankAccountId');
        
        const conditions: any = {};
        if (bankAccountId) conditions.bankAccountId = parseInt(bankAccountId);

        // @ts-ignore
        const records = await prisma.bankReconciliation.findMany({
            where: conditions,
            include: { bankAccount: true },
            orderBy: { statementDate: 'desc' }
        });

        return NextResponse.json(records);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury'))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await request.json();
        
        if (!body.bankAccountId || !body.statementDate || body.statementBalance === undefined) {
             return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 });
        }

        const date = new Date(body.statementDate);
        date.setHours(23, 59, 59, 999); // End of day

        // Calculate system balance for this bank account up to this date
        // 1. Get all journal lines for this account where date <= statementDate
        const aggr = await prisma.journalLine.aggregate({
            where: {
                accountId: parseInt(body.bankAccountId),
                entry: {
                    entryDate: { lte: body.statementDate } // entryDate is string YYYY-MM-DD
                }
            },
            _sum: { debit: true, credit: true }
        });

        const sumDebit = aggr._sum.debit || 0;
        const sumCredit = aggr._sum.credit || 0;
        const systemBal = sumDebit - sumCredit; // assuming Bank is Asset (Debit normally)
        
        const diff = parseFloat(body.statementBalance) - systemBal;

        // @ts-ignore
        const record = await prisma.bankReconciliation.create({
            data: {
                bankAccountId: parseInt(body.bankAccountId),
                statementDate: date,
                statementBalance: parseFloat(body.statementBalance),
                systemBalance: systemBal,
                difference: diff,
                status: 'DRAFT'
            }
        });

        // Fetch uncleared lines to return them for matching
        const unclearedLines = await prisma.journalLine.findMany({
            where: {
                accountId: parseInt(body.bankAccountId),
                isReconciled: false,
                entry: { entryDate: { lte: body.statementDate } }
            },
            include: { entry: true }
        });

        return NextResponse.json({ reconciliation: record, unclearedLines }, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
