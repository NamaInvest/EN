import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionEngine } from '@/lib/subscription-engine';

export async function POST(req: NextRequest) {
    try {
        // In production, verify cron secret
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await SubscriptionEngine.processRenewals();

        return NextResponse.json({ success: true, processedCount: results.length, renewals: results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
