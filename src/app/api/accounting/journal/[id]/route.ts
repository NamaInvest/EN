import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { transition, assertEditable, DocumentType, DocumentStatus } from '@/lib/document-state-machine';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runFinancialTx } from '@/lib/db/transaction';
import { assertTenant, requireTenantFilter } from '@/lib/security/tenant-guard';
import { FinancialPolicyEngine } from '@/lib/security/financial-policy-engine';
import { JournalValidationLayer } from '@/lib/security/journal-validation-layer';
import { EnterpriseLogger } from '@/lib/observability/logger';

const log = logger.child({ service: 'accounting/journal' });

const _PUTSchema = z.object({
  description: z.any().optional(),
  reference: z.any().optional(),
  date: z.string().optional(),
  lines: z.array(z.any()).optional(),
}).passthrough();

const _PATCHSchema = z.object({
  status: z.any().optional(),
  reason: z.any().optional(),
}).passthrough();

async function checkFiscalPeriodOpen(tx: any, tenantId: string, dateString: string) {
    const [year, month] = dateString.split('-').map(Number);
    if (year && month) {
        const period = await tx.fiscalPeriod.findFirst({
            where: {
                tenantId,
                year,
                month
            }
        });
        if (period && period.status !== 'open') {
            throw new Error(`الفترة المالية (${month}/${year}) غير مفتوحة (حالتها: ${period.status}).`);
        }
    }
}

async function _PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const tenantId = assertTenant(auth.tenantId);
    const prisma = getPrisma(request);
    const params = await context.params;
    const id = parseInt((await params).id);

    try {
        const entry = await prisma.journalEntry.findFirst({
            where: { id, tenantId },
            select: { status: true, id: true, entryDate: true }
        });

        if (!entry) {
            return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });
        }

        assertEditable(entry.status, DocumentType.JOURNAL_ENTRY);

        const body = await request.json();

        const _parsed2 = _PUTSchema.safeParse(body);
        if (!_parsed2.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed2.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const { description, reference, date, lines } = body;
        
        if (!lines || lines.length < 2) {
            return NextResponse.json({ error: 'سطرين على الأقل مطلوبين' }, { status: 400 });
        }

        try {
           FinancialPolicyEngine.validateJournalBalance(lines);
        } catch (error: any) {
           return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const totalDebit = lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
        const totalCredit = lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);

        const accountIds = lines.map((l: any) => l.accountId);
        const accounts = await prisma.account.findMany({ 
            take: 100, 
            where: { id: { in: accountIds }, tenantId } 
        });
        
        const { ACCOUNTS } = require('@/lib/auto-journal');
        const CONTROL_ACCOUNTS = [ACCOUNTS.RECEIVABLES, ACCOUNTS.PAYABLES, ACCOUNTS.INVENTORY, ACCOUNTS.WIP, ACCOUNTS.FINISHED_GOODS, ACCOUNTS.VAT_INPUT, ACCOUNTS.VAT_OUTPUT]; 
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
            } catch (e: any) { log.error(e); }
             return NextResponse.json({ error: 'منع رقابي: يمنع إدخال قيد يدوي مباشر على حسابات المراقبة (عملاء، موردين، مخزون).' }, { status: 403 });
        }

        const beforeEntry = await prisma.journalEntry.findFirst({ where: { id, tenantId } });
        
        await runFinancialTx(prisma, async (tx: any) => {
            await checkFiscalPeriodOpen(tx, tenantId, date || entry.entryDate);

            await tx.journalLine.deleteMany({ where: { entryId: id, tenantId } });

            await tx.journalEntry.update({
                where: { id, tenantId },
                data: {
                    description,
                    reference,
                    entryDate: date,
                    totalDebit: Math.round(totalDebit * 100) / 100,
                    totalCredit: Math.round(totalCredit * 100) / 100,
                    lines: {
                        create: lines.map((l: any) => ({
                            tenantId,
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

            EnterpriseLogger.traceFinancialTx(
                `JOURNAL_UPDATE_${id}`,
                'JOURNAL_UPDATED',
                tenantId,
                { journalId: id }
            );
        }, `JOURNAL_UPDATE_${id}`);

        try {
            const { logFieldChanges, auditContextFromRequest } = require('@/lib/field-audit');
            const afterEntry = await prisma.journalEntry.findFirst({ where: { id, tenantId } });
            await logFieldChanges(prisma, 'JournalEntry', id, beforeEntry, afterEntry, auditContextFromRequest(request, auth));
        } catch (auditErr: unknown) {
            log.error('Audit Log failed:', auditErr);
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        EnterpriseLogger.error('Journal update error:', { tenantId, userId: auth.userId }, error);
        return NextResponse.json({ error: error.message || 'فشل في تحديث القيد' }, { status: 500 });
    }
}

async function _PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const tenantId = assertTenant(auth.tenantId);
    const prisma = getPrisma(request);
    const params = await context.params;
    const id = parseInt((await params).id);

    try {
        const body = await request.json();
        const { status, reason } = body;

        const entry = await prisma.journalEntry.findFirst({
            where: { id, tenantId },
            select: { status: true, entryDate: true }
        });

        if (!entry) return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });

        await runFinancialTx(prisma, async (tx: any) => {
            await checkFiscalPeriodOpen(tx, tenantId, entry.entryDate);

            await transition(tx, {
                docType: DocumentType.JOURNAL_ENTRY,
                docId: id,
                from: entry.status,
                to: status,
                userId: auth.userId,
                reason: reason,
                apply: async () => {
                    if (status === DocumentStatus.POSTED && entry.status !== DocumentStatus.POSTED) {
                        const lines = await tx.journalLine.findMany({ take: 100, where: { entryId: id, tenantId } });
                        for (const line of lines) {
                            const account = await tx.account.findFirst({ where: { id: line.accountId, tenantId } });
                            if (account) {
                                let balanceChange = 0;
                                if (['asset', 'expense'].includes(account.type)) {
                                    balanceChange = n(line.debit) - n(line.credit);
                                } else {
                                    balanceChange = n(line.credit) - n(line.debit);
                                }
                                await tx.account.update({
                                    where: { id: line.accountId, tenantId },
                                    data: { balance: { increment: Math.round(balanceChange * 100) / 100 } },
                                });
                            }
                        }
                    }
                    
                    await tx.journalEntry.update({
                        where: { id, tenantId },
                        data: { status }
                    });
                }
            });

            EnterpriseLogger.traceFinancialTx(
                `JOURNAL_PATCH_${id}`,
                'JOURNAL_STATUS_CHANGED',
                tenantId,
                { journalId: id, newStatus: status }
            );
        }, `JOURNAL_PATCH_${id}`);

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        EnterpriseLogger.error('Journal status transition error:', { tenantId, userId: auth.userId }, error);
        return NextResponse.json({ error: error.message || 'فشل في تغيير الحالة' }, { status: 400 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'FINANCIAL' });
export const PATCH = withRoute(async ({ req }, context) => _PATCH(req as any, context), { rateLimit: 'FINANCIAL' });
