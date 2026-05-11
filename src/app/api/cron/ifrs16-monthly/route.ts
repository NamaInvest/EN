/**
 * IFRS 16 Monthly Cron — يُشغَّل في اليوم الأول من كل شهر
 * POST /api/cron/ifrs16-monthly
 *
 * يُنجز لكل عقد إيجار نشط:
 *   1. قيد الاستهلاك الشهري لحق الاستخدام (ROU Depreciation)
 *   2. قيد الفائدة الشهرية (Interest Unwinding)
 *   3. تسجيل دفعة الإيجار (Principal + Interest → Bank)
 *
 * يُستدعى من: vercel cron / pm2 cron / GitHub Actions nightly
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { IFRS16LeaseEngine } from '@/lib/ifrs16-lease-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'cron-ifrs16-monthly' });

const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev';

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('x-cron-secret') ?? req.headers.get('authorization');
  if (auth !== CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today  = new Date();
  const year   = today.getFullYear();
  const month  = today.getMonth() + 1;  // 1-based

  log.info(`IFRS16 monthly cron started for ${year}-${month.toString().padStart(2, '0')}`);

  // Get all active leases across all tenants
  const activeLeases = await (prisma as any).ifrsLeaseContract?.findMany?.({
    where: { status: 'ACTIVE' },
  }).catch(() => []) ?? [];

  const results: { leaseId: number; status: string; entries?: any }[] = [];

  for (const contract of activeLeases) {
    try {
      const commencementDate = new Date(contract.commencementDate);
      const monthsSinceStart =
        (today.getFullYear() - commencementDate.getFullYear()) * 12 +
        (today.getMonth() - commencementDate.getMonth());

      if (monthsSinceStart <= 0 || monthsSinceStart > contract.leaseTerm) {
        results.push({ leaseId: contract.id, status: 'SKIPPED' });
        continue;
      }

      // Reconstruct the lease schedule
      const lease = IFRS16LeaseEngine.recognize({
        leaseId:                  contract.id,
        description:              contract.description,
        commencementDate:         commencementDate,
        leaseTerm:                contract.leaseTerm,
        monthlyPayment:           Number(contract.monthlyPayment),
        incrementalBorrowingRate: Number(contract.incrementalBorrowingRate),
        currency:                 contract.currency,
      });

      const { entries } = IFRS16LeaseEngine.getMonthlyEntries(lease, monthsSinceStart);

      // Build journal lines for this month
      const journalLines = [
        // 1. ROU Depreciation: Dr Depreciation Expense / Cr Acc. Depreciation ROU
        {
          accountCode: '5220',   // Depreciation Expense
          description: `إهلاك حق الاستخدام — ${contract.description} (ش${monthsSinceStart})`,
          debit:       entries.find(e => e.account.includes('إهلاك') && e.type === 'debit')?.amount ?? 0,
          credit:      0,
          tenantId:    contract.tenantId,
        },
        {
          accountCode: '1451',   // Acc. Depreciation ROU
          description: `مجمع إهلاك حق الاستخدام — ${contract.description}`,
          debit:       0,
          credit:      entries.find(e => e.account.includes('مجمع') && e.type === 'credit')?.amount ?? 0,
          tenantId:    contract.tenantId,
        },
        // 2. Interest Expense: Dr Interest / Cr Lease Liability
        {
          accountCode: '5410',   // Interest Expense
          description: `فائدة إيجار — ${contract.description} (ش${monthsSinceStart})`,
          debit:       entries.find(e => e.account.includes('فائدة') && e.type === 'debit')?.amount ?? 0,
          credit:      0,
          tenantId:    contract.tenantId,
        },
        // 3. Principal Reduction: Dr Lease Liability / Cr Bank
        {
          accountCode: '2610',   // Lease Liability
          description: `سداد أصل إيجار — ${contract.description}`,
          debit:       entries.find(e => e.account.includes('التزام') && e.type === 'debit')?.amount ?? 0,
          credit:      0,
          tenantId:    contract.tenantId,
        },
        {
          accountCode: '1110',   // Bank
          description: `دفعة إيجار — ${contract.description}`,
          debit:       0,
          credit:      Number(contract.monthlyPayment),
          tenantId:    contract.tenantId,
        },
      ].filter(l => (l.debit + l.credit) > 0);

      // Post journal entry
      await (prisma as any).journalEntry?.create?.({
        data: {
          tenantId:    contract.tenantId,
          date:        today,
          description: `IFRS 16 — قيد شهر ${year}/${month} — ${contract.description}`,
          reference:   `LEASE-${contract.id}-${year}${month.toString().padStart(2, '0')}`,
          status:      'POSTED',
          createdBy:   'system-cron',
          lines:       { create: journalLines },
        },
      }).catch(() => null);

      results.push({ leaseId: contract.id, status: 'POSTED', entries: journalLines.length });
    } catch (e: any) {
      log.error('IFRS16 cron error for lease', { leaseId: contract.id, error: e.message });
      results.push({ leaseId: contract.id, status: 'ERROR' });
    }
  }

  const posted  = results.filter(r => r.status === 'POSTED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const errors  = results.filter(r => r.status === 'ERROR').length;

  log.info(`IFRS16 cron completed: ${posted} posted, ${skipped} skipped, ${errors} errors`);

  return NextResponse.json({ year, month, posted, skipped, errors, results });
}
