import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { transition, assertEditable, DocumentType, DocumentStatus } from '@/lib/document-state-machine';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
async function checkFiscalPeriodOpen(prisma: any, dateString: string) {
    const [year, month] = dateString.split('-').map(Number);
    if (year && month) {
        const period = await prisma.fiscalPeriod.findUnique({
            where: { year_month: { year, month } }
        });
        if (period && period.status !== 'open') {
            throw new Error(`الفترة المالية (${month}/${year}) غير مفتوحة (حالتها: ${period.status}).`);
        }
    }
}


const _PUTSchema = z.object({
  description: z.any().optional(),
  reference: z.any().optional(),
  date: z.string().optional(),
  lines: z.array(z.any()).optional(),
}).passthrough();

async function _PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
    const { getUserFromRequest } = require('@/lib/auth');
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    const params = await context.params;
    const id = parseInt((await params).id);

    try {
        // 1. Fetch current document to check its status
        const entry = await prisma.journalEntry.findUnique({
            where: { id },
            select: { status: true, id: true, entryDate: true }
        });

        if (!entry) {
            return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });
        }

        // 2. Validate if document is editable (Throws if POSTED, REVERSED, etc.)
        assertEditable(entry.status, DocumentType.JOURNAL_ENTRY);

        // 3. Process the update
        const body = await request.json();

        const _parsed = _PATCHSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { description, reference, date, lines } = body;
        
        await checkFiscalPeriodOpen(prisma, date || entry.entryDate);

        // ... validation ...
        if (!lines || lines.length < 2) {
            return NextResponse.json({ error: 'سطرين على الأقل مطلوبين' }, { status: 400 });
        }
        const totalDebit = lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
        const totalCredit = lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: 'القيد غير متوازن' }, { status: 400 });
        }

        const { ACCOUNTS } = require('@/lib/auto-journal');
        const CONTROL_ACCOUNTS = [ACCOUNTS.RECEIVABLES, ACCOUNTS.PAYABLES, ACCOUNTS.INVENTORY, ACCOUNTS.WIP, ACCOUNTS.FINISHED_GOODS, ACCOUNTS.VAT_INPUT, ACCOUNTS.VAT_OUTPUT]; 
        const isRestricted = lines.some((l: any) => CONTROL_ACCOUNTS.includes(l.accountCode || l.accountId)); // l.accountId is used but accountCode might be passed
        // Wait, lines from body uses accountId in PUT. Let's fetch account codes for the accountIds provided.
        // Actually it's better to fetch the account types or codes from the DB to be safe.
        // Let's do it using Prisma.
        const accountIds = lines.map((l: any) => l.accountId);
        const accounts = await prisma.account.findMany({
            take: 100, where: { id: { in: accountIds } } });
        const isRestrictedByCode = accounts.some((acc: any) => CONTROL_ACCOUNTS.includes(acc.code));
        if (isRestrictedByCode) {
            try {
                await prisma.auditLog.create({
                    data: {
                        userId: auth?.userId || 1,
                        action: 'GOVERNANCE_VIOLATION_ATTEMPT',
                        tableName: 'JournalEntry',
                        recordId: String(id),
                        details: JSON.stringify({ reason: 'Attempted to manually update control account', attemptedLines: lines })
                    }
                });
            } catch (e: any) { console.error(e); }
             return NextResponse.json({ error: 'منع رقابي: يمنع إدخال قيد يدوي مباشر على حسابات المراقبة (عملاء، موردين، مخزون).' }, { status: 403 });
        }

        // 4. Update the journal entry (Inside a transaction usually)
        const beforeEntry = await prisma.journalEntry.findUnique({ where: { id } });
        await prisma.$transaction(async (tx) => {
            // Delete old lines
            await tx.journalLine.deleteMany({ where: { entryId: id } });

            // Update entry and add new lines
            await tx.journalEntry.update({
                where: { id },
                data: {
                    description,
                    reference,
                    entryDate: date,
                    totalDebit: Math.round(totalDebit * 100) / 100,
                    totalCredit: Math.round(totalCredit * 100) / 100,
                    lines: {
                        create: lines.map((l: any) => ({
                            accountId: l.accountId,
                            costCenterId: l.costCenterId || null,
                            debit: l.debit || 0,
                            credit: l.credit || 0,
                            foreignDebit: l.foreignDebit || l.debit || 0,
                            foreignCredit: l.foreignCredit || l.credit || 0,
                            description: l.description,
                        }))
                    }
                }
            });
        });

        // 5. Audit Log
        try {
            const { logFieldChanges, auditContextFromRequest } = require('@/lib/field-audit');
            const afterEntry = await prisma.journalEntry.findUnique({ where: { id } });
            await logFieldChanges(prisma, 'JournalEntry', id, beforeEntry, afterEntry, auditContextFromRequest(request, auth));
        } catch (auditErr: unknown) {
            console.error('Audit Log failed:', auditErr);
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error('Journal update error:', error);
        return NextResponse.json({ error: error.message || 'فشل في تحديث القيد' }, { status: 500 });
    }
}


const _PATCHSchema = z.object({
  status: z.any().optional(),
  reason: z.any().optional(),
}).passthrough();

async function _PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  // @ts-expect-error [TS2448] Block-scoped variable ordering issue
    const { getUserFromRequest } = require('@/lib/auth');
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    const params = await context.params;
    const id = parseInt((await params).id);

    try {
        const body = await request.json();
        const { status, reason } = body;

        const entry = await prisma.journalEntry.findUnique({
            where: { id },
            select: { status: true, entryDate: true }
        });

        if (!entry) return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });

        await checkFiscalPeriodOpen(prisma, entry.entryDate);

        // استخدم State Machine لتطبيق التغيير
        await transition(prisma, {
            docType: DocumentType.JOURNAL_ENTRY,
            docId: id,
            from: entry.status,
            to: status,
            userId: auth.userId,
            reason: reason,
            apply: async () => {
                // If it's becoming POSTED, we must update the account balances!
                if (status === DocumentStatus.POSTED && entry.status !== DocumentStatus.POSTED) {
                    const lines = await prisma.journalLine.findMany({
            take: 100, where: { entryId: id } });
                    for (const line of lines) {
                        const account = await prisma.account.findUnique({ where: { id: line.accountId } });
                        if (account) {
                            let balanceChange = 0;
                            if (['asset', 'expense'].includes(account.type)) {
                                balanceChange = n(line.debit) - n(line.credit);
                            } else {
                                balanceChange = n(line.credit) - n(line.debit);
                            }
                            await prisma.account.update({
                                where: { id: line.accountId },
                                data: { balance: { increment: Math.round(balanceChange * 100) / 100 } },
                            });
                        }
                    }
                }
                
                await prisma.journalEntry.update({
                    where: { id },
                    data: { status }
                });
            }
        });

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        console.error('Journal status transition error:', error);
        return NextResponse.json({ error: error.message || 'فشل في تغيير الحالة' }, { status: 400 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'FINANCIAL' });

export const PATCH = withRoute(async ({ req }, context) => _PATCH(req as any, context), { rateLimit: 'FINANCIAL' });
