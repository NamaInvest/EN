import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'finance.cash-flow.forecast' });

import { getUserFromRequest } from '@/lib/auth';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const auth = await getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const weeks = Number(searchParams.get('weeks')) || 12; // Default 12 weeks horizon

        // Fetch AR and AP
        const customers = await prisma.customer.findMany({ take: 100,
            where: { tenantId: auth.tenantId, balance: { gt: 0 } },
            select: { id: true, balance: true }
        });
        
        const vendors = await prisma.customer.findMany({ take: 100,
            where: { tenantId: auth.tenantId, type: { in: [1, 2] }, balance: { gt: 0 } },
            select: { id: true, balance: true }
        });

        const totalAR = customers.reduce((sum: any, c: any) => sum + c.balance, 0);
        const totalAP = vendors.reduce((sum: any, v: any) => sum + v.balance, 0);

        // Fetch Current Bank Balances
        const bankAccounts = await prisma.bankAccount.findMany({ take: 100,
            where: { tenantId: auth.tenantId, isActive: true },
            select: { currentBalance: true }
        });
        const currentCash = bankAccounts.reduce((sum: number, b: any) => sum + Number(b.currentBalance || 0), 0);

        // Simulate 12-week forecast buckets
        const buckets = [];
        let runningBalance = currentCash;

        const baseArCollectionWeekly = totalAR / 12; // simplified
        const baseApPaymentWeekly = totalAP / 12; // simplified
        
        // Let's add some payroll & fixed costs (mocked logic or retrieved from DB if exists)
        const weeklyPayroll = 50000; 
        const monthlyRent = 20000;

        for (let i = 0; i < weeks; i++) {
            const date = new Date();
            date.setDate(date.getDate() + (i * 7));

            // Probability multiplier: further out = lower probability of exact timing
            const collectionProb = i < 4 ? 0.9 : 0.7;
            
            let inflows = baseArCollectionWeekly * collectionProb;
            let outflows = baseApPaymentWeekly + weeklyPayroll;

            // Add monthly rent every 4th week
            if (i % 4 === 0) {
                outflows += monthlyRent;
            }

            const netPosition = inflows - outflows;
            const closing = runningBalance + netPosition;

            buckets.push({
                week: `Week ${i + 1}`,
                date: date.toISOString(),
                opening: runningBalance,
                inflows,
                outflows,
                netPosition,
                closing
            });

            runningBalance = closing;
        }

        // Generate Alerts
        const alerts = [];
        const minThreshold = 100000; // minimum cash threshold
        
        const breachBucket = buckets.find(b => b.closing < minThreshold);
        if (breachBucket) {
            alerts.push({
                type: 'DANGER',
                message: `سيولة أقل من الحد الأدنى (${minThreshold.toLocaleString()}) متوقعة في ${breachBucket.week}.`
            });
        }

        return NextResponse.json({ 
            success: true, 
            data: { 
                currentCash, 
                totalAR, 
                totalAP, 
                buckets, 
                alerts 
            } 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  period: z.any().optional(),
  buckets: z.any().optional(),
  alerts: z.any().optional(),
  opening: z.any().optional(),
  closing: z.any().optional(),
  inflows: z.any().optional(),
  outflows: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const auth = await getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!['admin', 'owner', 'finance_manager', 'cfo'].includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { period, buckets, alerts, opening, closing, inflows, outflows } = body;

        // Save Snapshot
        const forecast = await prisma.cashFlowForecast.create({
            data: {
                tenantId: auth.tenantId,
                forecastDate: new Date(),
                period,
                scenario: 'REALISTIC',
                inflows: inflows,
                outflows: outflows,
                netPosition: inflows - outflows,
                openingBalance: opening,
                closingBalance: closing,
                bucketsJson: JSON.stringify(buckets),
                alertsJson: JSON.stringify(alerts),
                horizonMonths: Math.ceil(buckets.length / 4)
            }
        });

        return NextResponse.json({ success: true, data: forecast });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
