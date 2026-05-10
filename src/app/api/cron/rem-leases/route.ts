import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { requireCronSecret } from '@/lib/cron-guard';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron/rem-leases' });
async function _POST(req: Request) {
  const guard = requireCronSecret(req as any);
  if (guard) return guard;


    const prisma = getPrisma(req);
  try {
    // 1. Fetch Leases that expire in Exactly 7 Days or are overdue Payment!
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 7);

    // Filter active leases where an installment is due in the next 7 days and is unpaid
    const dueInstallments = await prisma.rentInstallment.findMany({
            take: 100,
      where: {
        isPaid: false,
        dueDate: {
          lte: targetDate,
          gte: new Date(today.setHours(0,0,0,0))
        }
      },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: { include: { property: true } }
          }
        }
      }
    });

    let sentCount = 0;

    for (const inst of dueInstallments) {
      // In real life, we would also generate the Journal Entry / Invoice automatically here.
      // But for now, we trigger a WhatsApp Notification to the Tenant:
      if (inst.contract.tenant.phone) {
        const message = `مرحباً ${inst.contract.tenant.name}،\nنذكركم باقتراب موعد استحقاق الدفعة الإيجارية لعقار ${inst.contract.unit.property.name} - وحدة ${inst.contract.unit.unitNumber} بقيمة ${inst.amount} ريال.\nيرجى السداد قبل تاريخ ${inst.dueDate.toLocaleDateString('en-GB')} لتجنب الغرامات.\nشكراً لتعاونكم.`;
        
        try {
          // Attempting generic whatsapp send logic, or simply logging it to DB for daemon to pick up
          // Mocking the call:
          log.info(`[Auto-Lease] Sending WhatsApp to: ${inst.contract.tenant.phone} - Msg: ${message}`);
          sentCount++;
        } catch (e: any) {
          log.error(`Failed to send WA to ${inst.contract.tenant.phone}`, e);
        }
      }
    }

    // 2. Fetch Leases expiring in 30 days to send Renewal Notification
    const expireTarget = new Date();
    expireTarget.setDate(today.getDate() + 30);
    const expiringContracts = await prisma.leaseContract.findMany({
            take: 100,
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: expireTarget,
          gte: new Date(today.setHours(0,0,0,0))
        }
      },
      include: { tenant: true }
    });

    for (const contract of expiringContracts) {
      log.info(`[Auto-Lease-Renewal] Reminding tenant ${contract.tenant.name} about contract expiring on ${contract.endDate.toLocaleDateString('en-GB')}`);
      // Also can auto-generate a Draft Contract for next year!
    }

    return NextResponse.json({ message: 'Lease Automation Executed Successfully', notificationsSent: sentCount, renewalsFound: expiringContracts.length });
  } catch (error: any) {
    log.error('Lease Automation Error:', error);
    return NextResponse.json({ error: 'Failed to run lease automation' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'CRON' });
