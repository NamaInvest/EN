import { NextResponse } from 'next/server';
import { getPrisma, resolveTenant } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);

        const banks = await prisma.bankAccount.findMany({
            take: 100,
            where: { isActive: true }
        });

        let totalCashSAR = 0;
        const data = banks.map(b => {
            // In a real system, fetch exchange rates. 
            // For now, assume USD = 3.75, EUR = 4.0, SAR = 1
            let rate = 1;
            if (b.currency === 'USD') rate = 3.75;
            if (b.currency === 'EUR') rate = 4.0;
            if (b.currency === 'GBP') rate = 4.7;

            const sarEquivalent = n(b.currentBalance) * rate;
            totalCashSAR += sarEquivalent;

            return {
                bankAccountId: b.id,
                bankName: b.bankName,
                accountNumber: b.accountNumber,
                balance: b.currentBalance,
                currency: b.currency,
                sarEquivalent
            };
        });

        const snapshot = await prisma.cashPositionSnapshot.create({
            data: {
                tenantId,
                capturedAt: new Date(),
                totalCashSAR,
                bankCount: banks.length,
                data
            }
        });

        return NextResponse.json({ success: true, snapshot });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
