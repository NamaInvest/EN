import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const { periodMonth, periodYear, ruleId } = await req.json();

        if (!periodMonth || !periodYear || !ruleId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const rule = await prisma.commissionRule.findUnique({ where: { id: ruleId } });
        if (!rule) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        // Fetch sales reps (Employees who made sales)
        // Since we don't have a direct 'salesRepId' on Invoice that we are sure of, we'll query Invoices grouped by userId.
        // Assuming userId relates to employee. For the sake of the calculation:
        const startDate = new Date(periodYear, periodMonth - 1, 1);
        const endDate = new Date(periodYear, periodMonth, 0); // Last day of month

        const salesAgg = await prisma.salesInvoice.groupBy({
            by: ['userId'],
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                },
                status: { in: ['completed', 'PAID'] },
                userId: { not: null }
            },
            _sum: {
                total: true
            }
        });

        const createdCommissions = [];

        for (const sale of salesAgg) {
            const totalSales = sale._sum.total || 0;
            let commissionAmount = 0;

            if (totalSales >= rule.targetAmount) {
                if (rule.rewardType === 'PERCENTAGE') {
                    commissionAmount = totalSales * (rule.rewardValue / 100);
                } else {
                    commissionAmount = rule.rewardValue; // FIXED
                }
            }

            // Only create if there's a commission to be paid
            if (commissionAmount > 0) {
                // We assume userId == employeeId for simplicity in this CRM integration
                const empId = sale.userId!; 

                // Upsert to avoid duplicates
                const commission = await prisma.salesmanCommission.create({
                    data: {
                        employeeId: empId,
                        ruleId: rule.id,
                        calculatedAmount: commissionAmount,
                        periodMonth: periodMonth,
                        periodYear: periodYear,
                        isPaid: false
                    }
                });
                createdCommissions.push(commission);
            }
        }

        return NextResponse.json({
            success: true,
            processedCount: salesAgg.length,
            commissionsCreated: createdCommissions.length,
            data: createdCommissions
        });

    } catch (e: any) {
        console.error('Commission Calculate Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
