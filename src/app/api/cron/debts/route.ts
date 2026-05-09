import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

// This is an automation endpoint expected to be called by a CRON daemon
import { getUserFromRequest } from '@/lib/auth';
import { requireCronSecret } from '@/lib/cron-guard';
async function _POST(req: Request) {
  const guard = requireCronSecret(req as any);
  if (guard) return guard;

    const prisma = getPrisma(req);
    try {
        console.log(">> CRON EXECUTION: Running Financial Debt Automation...");
        
        const today = new Date().toISOString().split('T')[0];

        // 1. Find all unpaid installment segments that have passed their due date
        const overduePayments = await prisma.installmentPayment.findMany({
            take: 100,
            where: {
                paid: false,
                dueDate: { lt: today }
            },
            include: { installment: true }
        });

        if (overduePayments.length === 0) {
            return NextResponse.json({ message: 'لا توجد ديون أو أقساط متأخرة.' }, { status: 200 });
        }

        let totalOverdueFlagged = 0;
        let compromisedCustomers = new Set<number>();

        // 2. Execute mathematical tagging sequentially inside an Atomic Transaction
        await prisma.$transaction(async (tx) => {
            for (const payment of overduePayments) {
                // If the parent installment isn't flagged already, flag it
                if (payment.installment.status !== 'overdue') {
                    await tx.installment.update({
                        where: { id: payment.installment.id },
                        data: { status: 'overdue' }
                    });
                    totalOverdueFlagged++;
                }

                // Append the customer to the compromised index
                compromisedCustomers.add(payment.installment.customerId);
            }
        });

        // 3. Mark the Customer entity itself as "Delinquent / Overdue" if necessary
        // In some systems, this locks their ability to make new purchases on credit.
        const compromisedArray = Array.from(compromisedCustomers);
        
        let customNoticesInjected = 0;
        for (const custId of compromisedArray) {
            const customer = await prisma.customer.findUnique({ where: { id: custId } });
            if (customer) {
                const currentNotes = customer.notes || '';
                const warningString = `[CRON-AUTO-WARNING]: عميل متأخر في السداد منذ ${today}`;
                
                if (!currentNotes.includes(warningString)) {
                    await prisma.customer.update({
                        where: { id: custId },
                        data: { notes: `${warningString}\n${currentNotes}` }
                    });
                    customNoticesInjected++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'تم فحص الأقساط ومعالجتها بنجاح',
            metrics: {
                overduePaymentsFound: overduePayments.length,
                parentInstallmentsFlagged: totalOverdueFlagged,
                compromisedCustomers: compromisedArray.length,
                noticesInjected: customNoticesInjected
            }
        });

    } catch (e: any) {
        console.error("CRON Debt Automation Error:", e);
        return NextResponse.json({ error: e.message || 'فشل تشغيل فحص الديون التلقائي' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'CRON' });
