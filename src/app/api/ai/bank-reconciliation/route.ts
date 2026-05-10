import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'ai.bank-reconciliation' });
const prisma = new PrismaClient();

async function _POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'عفوا، صلاحيات الدخول غير صالحة.' }, { status: 401 });

        // In a strictly 'Agentic' system, this endpoint receives a raw bank statement (CSV/JSON/Text).
        // The Agent parses the statement and sends the structured transactions here to be reconciled mechanically.
        const { transactions } = await request.json();

        if (!transactions || !Array.isArray(transactions)) {
            return NextResponse.json({ error: 'لم يتم توفير حركات بنكية صالحة للمطابقة.' }, { status: 400 });
        }

        const reconciliationResults = [];

        for (const trx of transactions) {
            // trx format expects: { amount: 500, date: '2026-03-24', reference: 'INV-1004' }

            let matchedInvoice = null;

            // 1. Attempt exact match by reference number (if captured by Agent)
            if (trx.reference) {
                const invoiceIdMatch = trx.reference.match(/\d+/); // extracts numbers
                if (invoiceIdMatch) {
                    matchedInvoice = await prisma.salesInvoice.findUnique({
                        where: { id: parseInt(invoiceIdMatch[0]) }
                    });
                }
            }

            // 2. Fallback: Match by exact amount and date proximity
            if (!matchedInvoice) {
                const trxDate = new Date(trx.date);
                const startOfDay = new Date(trxDate.setHours(0, 0, 0, 0));
                const endOfDay = new Date(trxDate.setHours(23, 59, 59, 999));

                matchedInvoice = await prisma.salesInvoice.findFirst({
                    where: {
                        total: trx.amount,
                        date: { gte: startOfDay, lte: endOfDay }
                    }
                });
            }

            // 3. Register Result
            if (matchedInvoice) {
                // In a full ERP, we would generate a 'BankReconciliation' record here bridging the two.
                reconciliationResults.push({
                    transactionAmount: trx.amount,
                    status: 'MATCHED',
                    invoiceId: matchedInvoice.id,
                    confidence: trx.reference ? 'HIGH' : 'MEDIUM'
                });
            } else {
                reconciliationResults.push({
                    transactionAmount: trx.amount,
                    status: 'UNMATCHED',
                    reason: 'No corresponding sales invoice or receipt voucher found for this amount/date.'
                });
            }
        }

        const matchedCount = reconciliationResults.filter(r => r.status === 'MATCHED').length;

        return NextResponse.json({
            success: true,
            summary: `تم فحص ${transactions.length} حركة بنكية. المطابقات الناجحة: ${matchedCount}.`,
            results: reconciliationResults
        });

    } catch (e: any) {
        log.error('Bank Reconciliation AI Error:', e);
        return NextResponse.json({ error: 'حدث خطأ داخلي أثناء عملية المطابقة الذكية.' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AI' });
