import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const trialSettings = await prisma.setting.findMany({
            where: { key: { in: ['trialActive', 'trialEndsAt', 'maxTrialInvoices'] } }
        });
        
        const getSetting = (k: string) => trialSettings.find(s => s.key === k)?.value;
        const isTrialActive = getSetting('trialActive') === 'true';

        if (!isTrialActive) {
            return NextResponse.json({ isTrialActive: false });
        }

        const endsAtStr = getSetting('trialEndsAt');
        const endsAt = endsAtStr ? parseInt(endsAtStr, 10) : 0;
        const maxInvoices = parseInt(getSetting('maxTrialInvoices') || '30');

        const currentInvoiceCount = await prisma.salesInvoice.count();

        const daysRemaining = endsAt > 0 ? Math.ceil((endsAt - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
        const isExpired = daysRemaining <= 0 || currentInvoiceCount >= maxInvoices;

        return NextResponse.json({
            isTrialActive: true,
            daysRemaining: Math.max(0, daysRemaining),
            invoicesRemaining: Math.max(0, maxInvoices - currentInvoiceCount),
            isExpired,
            maxInvoices,
            currentInvoiceCount
        });

    } catch (e: any) {
        console.error("Trial status error:", e);
        return NextResponse.json({ isTrialActive: false }, { status: 500 });
    }
}
