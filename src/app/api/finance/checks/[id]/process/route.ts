import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { createJournalEntry } from '@/lib/auto-journal';
import { getUserFromRequest, hasPermission } from '@/lib/auth';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';


const _PUTSchema = z.object({
  status: z.any().optional(),
}).passthrough();

async function _PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {

    const prisma = getPrisma(request);
    try {
        const auth = await getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        if (!(await hasPermission(auth.userId, 'treasury', prisma))) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        // Await params correctly for Next.js 15
        const params = await context.params;
        const id = parseInt((await params).id);

        const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { status } = body; // UNDER_COLLECTION, CLEARED, BOUNCED

        if (!status) return NextResponse.json({ error: 'يجب توفير الحالة الجديدة' }, { status: 400 });

        // @ts-ignore
        const currentCheck = await prisma.checkTransaction.findUnique({ where: { id } });
        if (!currentCheck) return NextResponse.json({ error: 'الشيك غير موجود' }, { status: 404 });

        if (currentCheck.status === status) {
            return NextResponse.json(currentCheck);
        }

        // Update the status
        // @ts-ignore
        const updatedCheck = await prisma.checkTransaction.update({
            where: { id },
            data: { status }
        });

        // ==================== AUTO JOURNAL LOGIC ====================
        // Depending on type and new status, we create journal entries
        // For simplicity, we assume standard accounts 
        // 1220: أوراق قبض (Notes Receivable)
        // 2120: أوراق دفع (Notes Payable)
        
        let debitAccount = '';
        let creditAccount = '';
        let description = '';

        if (currentCheck.type === 'RECEIVABLE') {
            // Received from Customer -> PENDING
            // PENDING -> UNDER_COLLECTION (bank is holding it)
            if (status === 'UNDER_COLLECTION') {
                debitAccount = '1220'; // Notes Receivable under collection
                creditAccount = '1220'; // Notes Receivable in safe
                description = `شيك تحت التحصيل رقم ${currentCheck.checkNumber}`;
            } else if (status === 'CLEARED') {
                // Bank cleared it, money in bank
                debitAccount = '1120'; // Bank
                creditAccount = '1220'; // Notes Receivable
                description = `تحصيل شيك رقم ${currentCheck.checkNumber}`;
            } else if (status === 'BOUNCED') {
                // Check bounced, reverse to customer
                debitAccount = '1200'; // Accounts Receivable (Customer)
                creditAccount = '1220'; // Notes Receivable
                description = `شيك مرتجع رقم ${currentCheck.checkNumber}`;
            }
        } else if (currentCheck.type === 'PAYABLE') {
            // Issued to Supplier
            if (status === 'CLEARED') {
                // We paid it from bank
                debitAccount = '2120'; // Notes Payable
                creditAccount = '1120'; // Bank
                description = `صرف شيك رقم ${currentCheck.checkNumber}`;
            } else if (status === 'BOUNCED') {
                // Bounced back to supplier
                debitAccount = '2120'; // Notes Payable
                creditAccount = '2100'; // Accounts Payable (Supplier)
                description = `شيك مرتجع للمورد رقم ${currentCheck.checkNumber}`;
            }
        }

        if (debitAccount && creditAccount) {
            // Check if accounts exist to avoid error
            const dAcct = await prisma.account.findFirst({ where: { code: debitAccount } });
            const cAcct = await prisma.account.findFirst({ where: { code: creditAccount } });
            
            if (dAcct && cAcct) {
                // Create the journal entry
                await createJournalEntry({
                    description: description,
                    reference: `CHK-${currentCheck.id}`,
                    date: new Date().toISOString().split('T')[0],
                    userId: auth.userId,
                    lines: [
                        { accountCode: debitAccount, debit: n(currentCheck.amount), credit: 0, description },
                        { accountCode: creditAccount, debit: 0, credit: n(currentCheck.amount), description },
                    ]
                });
            } else {
                console.warn('Treasury auto-journal missing standard codes (1220/2120)');
            }
        }

        return NextResponse.json(updatedCheck);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), { rateLimit: 'DEFAULT' });
