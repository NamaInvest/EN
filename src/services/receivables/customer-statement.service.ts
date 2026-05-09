/**
 * Customer Statement Service
 * AR aging + customer statement generation
 */
import { PrismaClient } from '@prisma/client';

export interface AgingBucket {
  label: string;
  fromDays: number;
  toDays: number;
  amount: number;
  count: number;
}

export interface CustomerStatement {
  customerId: number;
  customerName: string;
  asOfDate: Date;
  openingBalance: number;
  invoices: { invoiceNo: number; date: Date; total: number; paid: number; remaining: number; dueDate: Date | null; overdueDays: number }[];
  totalOutstanding: number;
  aging: AgingBucket[];
}

export class CustomerStatementService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate customer statement
   */
  async getStatement(tenantId: string, customerId: number, asOfDate: Date): Promise<CustomerStatement> {
    const customer = await this.prisma.customer.findFirstOrThrow({
      where: { id: customerId, tenantId },
      select: { id: true, name: true },
    });

    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        tenantId,
        customerId,
        deletedAt: null,
        date: { lte: asOfDate },
        remaining: { gt: 0 },
      },
      select: {
        invoiceNo: true,
        date: true,
        total: true,
        paid: true,
        remaining: true,
        dueDate: true,
      } as any,
      orderBy: { date: 'asc' },
    });

    const today = asOfDate;

    const invoiceRows = (invoices as any[]).map((inv: any) => {
      const dueDate = inv.dueDate ?? null;
      const overdueDays = dueDate && dueDate < today
        ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        invoiceNo: inv.invoiceNo,
        date: inv.date,
        total: Number(inv.total),
        paid: Number(inv.paid),
        remaining: Number(inv.remaining),
        dueDate,
        overdueDays,
      };
    });

    const totalOutstanding = invoiceRows.reduce((s, r) => s + r.remaining, 0);

    const aging = this.buildAgingBuckets(invoiceRows, today);

    return {
      customerId,
      customerName: customer.name,
      asOfDate,
      openingBalance: 0,
      invoices: invoiceRows,
      totalOutstanding,
      aging,
    };
  }

  /**
   * AR Aging report (all customers)
   */
  async getAgingReport(tenantId: string, asOfDate: Date): Promise<{
    customers: { customerId: number; name: string; current: number; days30: number; days60: number; days90: number; over90: number; total: number }[];
    totals: { current: number; days30: number; days60: number; days90: number; over90: number; total: number };
  }> {
    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        date: { lte: asOfDate },
        remaining: { gt: 0 },
        customerId: { not: null },
      },
      select: {
        customerId: true,
        remaining: true,
        dueDate: true,
        customer: { select: { name: true } },
      } as any,
    });

    const customerMap = new Map<number, { name: string; current: number; days30: number; days60: number; days90: number; over90: number }>();

    for (const inv of invoices as any[]) {
      if (!inv.customerId) continue;
      const dueDate = inv.dueDate ?? inv.date;
      const overdueDays = dueDate < asOfDate
        ? Math.ceil((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const remaining = Number(inv.remaining);
      const existing = customerMap.get(inv.customerId) ?? { name: inv.customer?.name ?? '', current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };

      if (overdueDays <= 0) existing.current += remaining;
      else if (overdueDays <= 30) existing.days30 += remaining;
      else if (overdueDays <= 60) existing.days60 += remaining;
      else if (overdueDays <= 90) existing.days90 += remaining;
      else existing.over90 += remaining;

      customerMap.set(inv.customerId, existing);
    }

    const customers = Array.from(customerMap.entries()).map(([customerId, v]) => ({
      customerId,
      name: v.name,
      current: v.current,
      days30: v.days30,
      days60: v.days60,
      days90: v.days90,
      over90: v.over90,
      total: v.current + v.days30 + v.days60 + v.days90 + v.over90,
    }));

    const totals = customers.reduce((acc, c) => ({
      current: acc.current + c.current,
      days30: acc.days30 + c.days30,
      days60: acc.days60 + c.days60,
      days90: acc.days90 + c.days90,
      over90: acc.over90 + c.over90,
      total: acc.total + c.total,
    }), { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 });

    return { customers, totals };
  }

  private buildAgingBuckets(invoices: { remaining: number; overdueDays: number }[], _today: Date): AgingBucket[] {
    const buckets: AgingBucket[] = [
      { label: 'Current', fromDays: 0, toDays: 0, amount: 0, count: 0 },
      { label: '1-30 days', fromDays: 1, toDays: 30, amount: 0, count: 0 },
      { label: '31-60 days', fromDays: 31, toDays: 60, amount: 0, count: 0 },
      { label: '61-90 days', fromDays: 61, toDays: 90, amount: 0, count: 0 },
      { label: '> 90 days', fromDays: 91, toDays: 999, amount: 0, count: 0 },
    ];

    for (const inv of invoices) {
      const bucket = buckets.find((b) => inv.overdueDays >= b.fromDays && inv.overdueDays <= b.toDays) ?? buckets[4];
      bucket.amount += inv.remaining;
      bucket.count++;
    }

    return buckets;
  }
}
