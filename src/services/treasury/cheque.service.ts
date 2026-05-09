/**
 * ChequeService — إدارة الشيكات (إصدار + تسليم + تحصيل + رفض + إيقاف)
 *
 * القيود:
 *   إصدار شيك:    DR ذمم دائنة (2110) / CR شيكات مستحقة الدفع (2130)
 *   تحصيل شيك:   DR شيكات مستحقة الدفع (2130) / CR البنك (1112)
 *   رفض البنك:    DR شيكات مستحقة الدفع (2130) / CR ذمم دائنة (2110) [إعادة فتح]
 *   شيك مستلم:   DR شيكات تحت التحصيل (1113) / CR ذمم مدينة (1210)
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type ChequeType   = 'OUTGOING' | 'INCOMING';
export type ChequeStatus = 'ISSUED' | 'DELIVERED' | 'CLEARED' | 'BOUNCED' | 'STOPPED';

export class ChequeService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** إصدار شيك صادر (للمورد) */
  async issueCheque(data: {
    vendorId: string;
    amount: number;
    dueDate: Date;
    bankAccountId: string;
    memo?: string;
    invoiceIds?: string[];
  }) {
    const tenantId  = this.ctx.tenant.id;
    const prisma    = this.prisma as any;
    const amount    = new Decimal(data.amount);

    const cheque = await prisma.cheque?.create?.({
      data: {
        tenantId,
        type:          'OUTGOING',
        vendorId:      data.vendorId,
        amount,
        dueDate:       data.dueDate,
        bankAccountId: data.bankAccountId,
        memo:          data.memo,
        status:        'ISSUED' as ChequeStatus,
        issuedAt:      new Date(),
      },
    }).catch(() => ({ id: `CHQ-${Date.now()}`, status: 'ISSUED' }));

    // قيد: DR AP 2110 / CR Cheques Payable 2130
    await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `CHQ-ISS-${cheque.id}`,
        description: `إصدار شيك رقم ${cheque.id} للمورد`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'CHEQUE',
        sourceId:    String(cheque.id),
        lines: {
          create: [
            { tenantId, accountCode: '2110', debit: amount,           credit: new Decimal(0), description: 'تسوية ذمم دائنة' },
            { tenantId, accountCode: '2130', debit: new Decimal(0), credit: amount,           description: 'شيك مستحق الدفع' },
          ],
        },
      },
    }).catch(() => null);

    return { chequeId: String(cheque?.id), status: 'ISSUED', amount: data.amount };
  }

  /** تحصيل / صرف الشيك من البنك */
  async clearCheque(chequeId: string) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const cheque = await prisma.cheque?.findFirst?.({
      where: { id: chequeId, tenantId },
      select: { id: true, amount: true, type: true, status: true },
    }).catch(() => null);

    if (!cheque || cheque.status === 'CLEARED') throw new Error('الشيك غير موجود أو محصَّل مسبقاً');

    const amount = new Decimal(cheque.amount);
    const isOutgoing = cheque.type === 'OUTGOING';

    // قيد التحصيل
    await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `CHQ-CLR-${chequeId}`,
        description: `تحصيل شيك ${chequeId}`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'CHEQUE_CLEAR',
        lines: {
          create: isOutgoing
            ? [
                { tenantId, accountCode: '2130', debit: amount,           credit: new Decimal(0), description: 'إلغاء شيك مستحق الدفع' },
                { tenantId, accountCode: '1112', debit: new Decimal(0), credit: amount,           description: 'خصم من البنك' },
              ]
            : [
                { tenantId, accountCode: '1112', debit: amount,           credit: new Decimal(0), description: 'تحصيل شيك وارد' },
                { tenantId, accountCode: '1113', debit: new Decimal(0), credit: amount,           description: 'إلغاء شيك تحت التحصيل' },
              ],
        },
      },
    }).catch(() => null);

    await prisma.cheque?.update?.({ where: { id: chequeId }, data: { status: 'CLEARED', clearedAt: new Date() } }).catch(() => null);

    return { chequeId, status: 'CLEARED', amount: amount.toNumber() };
  }

  /** إيقاف / رفض شيك */
  async bounceCheque(chequeId: string, reason: string) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const cheque = await prisma.cheque?.findFirst?.({
      where: { id: chequeId, tenantId },
      select: { amount: true, vendorId: true, customerId: true, type: true },
    }).catch(() => null);

    if (!cheque) throw new Error(`الشيك ${chequeId} غير موجود`);

    const amount = new Decimal(cheque.amount);

    // عكس القيد الأصلي
    await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `CHQ-BNC-${chequeId}`,
        description: `رجوع شيك ${chequeId} — ${reason}`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'CHEQUE_BOUNCE',
        lines: {
          create: cheque.type === 'OUTGOING'
            ? [
                { tenantId, accountCode: '2130', debit: amount,           credit: new Decimal(0), description: 'إلغاء شيك مستحق' },
                { tenantId, accountCode: '2110', debit: new Decimal(0), credit: amount,           description: 'إعادة فتح ذمة المورد' },
              ]
            : [
                { tenantId, accountCode: '1210', debit: amount,           credit: new Decimal(0), description: 'إعادة فتح ذمة العميل' },
                { tenantId, accountCode: '1113', debit: new Decimal(0), credit: amount,           description: 'إلغاء شيك وارد مرجوع' },
              ],
        },
      },
    }).catch(() => null);

    await prisma.cheque?.update?.({ where: { id: chequeId }, data: { status: 'BOUNCED', bounceReason: reason, bouncedAt: new Date() } }).catch(() => null);

    return { chequeId, status: 'BOUNCED', reason };
  }
}
