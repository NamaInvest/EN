import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { SubscriptionEngine } from '@/lib/subscription-engine';
import { requireCronSecret } from '@/lib/cron-guard';

async function _POST(req: NextRequest) {
  const guard = requireCronSecret(req as any);
  if (guard) return guard;

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

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
