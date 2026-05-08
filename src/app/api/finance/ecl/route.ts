import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// Baseline IFRS 9 PD (Probability of Default) per bucket
const PD_RATES = {
    '0-30': 0.005,  // 0.5%
    '31-60': 0.02,  // 2%
    '61-90': 0.05,  // 5%
    '91-180': 0.15, // 15%
    '181-365': 0.35,// 35%
    '>365': 0.70    // 70%
};

// Default LGD (Loss Given Default) = 1 - Recovery Rate
// Assuming an average recovery rate of 40%, LGD = 60% (0.6)
const DEFAULT_LGD = 0.6;

export async function GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const customers = await prisma.customer.findMany({
            take: 100,
            where: { balance: { gt: 0 } },
            select: {
                id: true,
                name: true,
                balance: true,
                salesInvoices: {
                    where: { remaining: { gt: 0 } },
                    select: { id: true, date: true, remaining: true, invoiceNo: true }
                }
            }
        });

        const now = new Date().getTime();
        const portfolioECL = {
            '0-30': 0,
            '31-60': 0,
            '61-90': 0,
            '91-180': 0,
            '181-365': 0,
            '>365': 0,
            totalECL: 0,
            totalEAD: 0
        };

        const customerECLDetails = customers.map((c: any) => {
            const aging = {
                '0-30': 0,
                '31-60': 0,
                '61-90': 0,
                '91-180': 0,
                '181-365': 0,
                '>365': 0
            };

            c.salesInvoices.forEach((inv: any) => {
                const daysOld = Math.floor((now - new Date(inv.date).getTime()) / (1000 * 3600 * 24));
                const amt = inv.remaining;

                if (daysOld <= 30) aging['0-30'] += amt;
                else if (daysOld <= 60) aging['31-60'] += amt;
                else if (daysOld <= 90) aging['61-90'] += amt;
                else if (daysOld <= 180) aging['91-180'] += amt;
                else if (daysOld <= 365) aging['181-365'] += amt;
                else aging['>365'] += amt;
            });

            // If balance > invoices remaining (e.g. manual JEs), put the difference in 0-30
            const allocated = Object.values(aging).reduce((a: any, b: any) => a + b, 0);
            if (c.balance > allocated) {
                aging['0-30'] += (c.balance - allocated);
            }

            // Calculate ECL per bucket for this customer
            // ECL = PD * LGD * EAD
            let totalCustomerECL = 0;
            const eclBreakdown = Object.keys(aging).reduce((acc: any, key: string) => {
                const ead = aging[key as keyof typeof aging];
                const pd = PD_RATES[key as keyof typeof PD_RATES];
                const lgd = DEFAULT_LGD;
                const bucketECL = ead * pd * lgd;

                acc[key] = bucketECL;
                totalCustomerECL += bucketECL;

                // Add to portfolio
                portfolioECL[key as keyof typeof PD_RATES] += bucketECL;
                portfolioECL.totalECL += bucketECL;
                portfolioECL.totalEAD += ead;

                return acc;
            }, {});

            return {
                customerId: c.id,
                customerName: c.name,
                balance: c.balance,
                aging,
                eclBreakdown,
                totalCustomerECL
            };
        });

        // Sort by highest ECL
        customerECLDetails.sort((a, b) => b.totalCustomerECL - a.totalCustomerECL);

        return NextResponse.json({
            success: true,
            data: {
                portfolioECL,
                customerECLDetails,
                parameters: { PD_RATES, DEFAULT_LGD }
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const { totalECL } = body;

        // In a real scenario, we'd check the current balance of the Allowance account (1219)
        // and only book the adjustment (delta).
        // Dr 5710 Bad Debt Expense 
        // Cr 1219 Allowance for Doubtful Accounts

        // Mock response
        return NextResponse.json({ 
            success: true, 
            message: `تم إنشاء قيد يومية بمبلغ ${totalECL.toFixed(2)} SAR (مخصص الإهلاك).` 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
