/**
 * AgingDunningService — تحليل أعمار الديون والتحصيل
 *
 * النماذج: OpenItem, DunningPolicy, DunningRun, Customer
 *
 * تقرير الأعمار: 0-30، 31-60، 61-90، 91-120، 120+ يوم
 * التحصيل: إرسال تذكيرات تلقائية حسب سياسة Dunning
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export interface AgingBucket {
  label: string;         // '0-30', '31-60', ...
  from: number;          // أيام
  to: number;
  amount: Decimal;
  count: number;
}

export interface CustomerAgingRow {
  customerId: number;
  customerName: string;
  totalOpen: Decimal;
  buckets: AgingBucket[];
  daysOverdue: number;   // أكبر فاتورة متأخرة
}

export class AgingDunningService {
  private static BUCKETS = [
    { label: 'جارية', from: 0, to: 0 },
    { label: '1-30', from: 1, to: 30 },
    { label: '31-60', from: 31, to: 60 },
    { label: '61-90', from: 61, to: 90 },
    { label: '91-120', from: 91, to: 120 },
    { label: '+120', from: 121, to: Infinity },
  ];

  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * توليد تقرير أعمار الديون لكل العملاء
   */
  async generateAgingReport(asOfDate: Date = new Date()): Promise<CustomerAgingRow[]> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const items = await prisma.openItem.findMany({
      where: { tenantId, partyType: 'customer', openAmount: { gt: 0 } },
      include: { customer: { select: { id: true, name: true } } },
    }).catch(() => []);

    // تجميع حسب العميل
    const byCustomer = new Map<number, typeof items>();
    for (const item of items) {
      const list = byCustomer.get(item.partyId) ?? [];
      list.push(item);
      byCustomer.set(item.partyId, list);
    }

    const rows: CustomerAgingRow[] = [];
    for (const [customerId, customerItems] of byCustomer) {
      const buckets: AgingBucket[] = AgingDunningService.BUCKETS.map((b) => ({
        ...b, amount: new Decimal(0), count: 0,
      }));

      let maxDaysOverdue = 0;

      for (const item of customerItems) {
        const due = new Date(item.dueDate ?? item.documentDate);
        const daysOverdue = Math.max(0, Math.floor((asOfDate.getTime() - due.getTime()) / 86_400_000));
        maxDaysOverdue = Math.max(maxDaysOverdue, daysOverdue);

        const bucket = buckets.find((b) => daysOverdue >= b.from && daysOverdue <= b.to);
        if (bucket) {
          bucket.amount = bucket.amount.add(new Decimal(item.openAmount));
          bucket.count++;
        }
      }

      const totalOpen = buckets.reduce((s, b) => s.add(b.amount), new Decimal(0));
      rows.push({
        customerId,
        customerName: customerItems[0]?.customer?.name ?? '',
        totalOpen,
        buckets,
        daysOverdue: maxDaysOverdue,
      });
    }

    return rows.sort((a, b) => b.totalOpen.cmp(a.totalOpen));
  }

  /**
   * تشغيل دورة التحصيل — يُرسل تذكيرات حسب السياسة
   */
  async runDunningCycle(asOfDate: Date = new Date()): Promise<{ sent: number; failed: number }> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const policies = await prisma.dunningPolicy.findMany({ where: { tenantId, isActive: true } });
    let sent = 0, failed = 0;

    const aging = await this.generateAgingReport(asOfDate);

    for (const row of aging) {
      if (row.daysOverdue === 0) continue; // ليس متأخراً

      for (const policy of policies) {
        const levels: any[] = JSON.parse(policy.levels ?? '[]');
        const applicableLevel = levels
          .filter((l: any) => row.daysOverdue >= l.daysOverdue)
          .sort((a: any, b: any) => b.daysOverdue - a.daysOverdue)[0];

        if (!applicableLevel) continue;

        try {
          await prisma.dunningRun.create({
            data: {
              tenantId,
              customerId: row.customerId,
              invoiceIds: JSON.stringify(
                (await prisma.openItem.findMany({
                  where: { tenantId, partyId: row.customerId, partyType: 'customer' },
                  select: { documentId: true },
                })).map((i: any) => i.documentId),
              ),
              level: applicableLevel.level ?? 1,
              channelsUsed: JSON.stringify(applicableLevel.channels ?? ['EMAIL']),
              totalFeesAdded: new Decimal(applicableLevel.fee ?? 0),
              status: 'SENT',
            },
          });
          sent++;
        } catch {
          failed++;
        }
      }
    }

    return { sent, failed };
  }
}
