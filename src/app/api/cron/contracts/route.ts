import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron.contracts' });

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const today = new Date();
        // Look for active contracts that need renewal alerts
        const activeContracts = await prisma.supplierContract.findMany({
            take: 100,
            where: { status: 'active' },
            include: { supplier: true }
        });

        const alerts = [];
        const autoRenewed = [];

        for (const contract of activeContracts) {
            const endDate = new Date(contract.endDate);
            const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

            if (daysRemaining <= contract.alertDaysBefore && daysRemaining > 0) {
                alerts.push({
                    contractNo: contract.contractNo,
                    supplier: contract.supplier.name,
                    daysRemaining,
                    action: contract.autoRenew ? 'Will auto-renew' : 'Needs manual review'
                });

                // Simulate sending email to procurement lead
                log.info(`[ALERT] Contract ${contract.contractNo} expires in ${daysRemaining} days.`);
            } else if (daysRemaining <= 0) {
                if (contract.autoRenew) {
                    // Auto renew for another year
                    const newEndDate = new Date(endDate);
                    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                    
                    await prisma.supplierContract.update({
                        where: { id: contract.id },
                        data: { endDate: newEndDate }
                    });
                    autoRenewed.push(contract.contractNo);
                } else {
                    // Mark expired
                    await prisma.supplierContract.update({
                        where: { id: contract.id },
                        data: { status: 'expired' }
                    });
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            alertsGenerated: alerts.length, 
            alerts,
            autoRenewed: autoRenewed.length 
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'CRON' });
