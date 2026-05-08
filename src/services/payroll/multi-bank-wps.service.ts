/**
 * WPS Multi-Bank SIF Generator — نظام حماية الأجور
 *
 * النماذج: WPSBatch, WPSBatchItem, Employee, Salary
 *
 * كل بنك له format مختلف لملف SIF (Salary Information File).
 * هذه الخدمة تُولِّد الملف الصحيح لكل بنك.
 *
 * البنوك المدعومة:
 *  - الراجحي   (AL_RAJHI)   → TXT بصيغة AR-WPS-V2
 *  - الأهلي    (SNB)        → CSV بصيغة NCB-SIF-V3
 *  - الرياض    (RIYAD)      → XML بصيغة Riyad-WPS
 *  - البلاد    (BILAD)      → TXT
 *  - ساب       (SAB)        → CSV
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type SupportedBank = 'AL_RAJHI' | 'SNB' | 'RIYAD' | 'BILAD' | 'SAB';

export interface WPSEmployee {
  iqamaNumber: string;       // رقم الإقامة / الهوية
  employeeId: string;
  name: string;
  iban: string;              // SA + 22 رقم
  netSalary: Decimal;
  bankCode: string;
}

export interface WPSBatchOutput {
  batchId: number;
  bank: SupportedBank;
  fileName: string;
  content: string;
  employeeCount: number;
  totalAmount: Decimal;
  generatedAt: Date;
}

export class WPSMultiBankService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /**
   * توليد ملف SIF لدفعة رواتب محددة
   */
  async generateSIF(batchId: number, bank: SupportedBank): Promise<WPSBatchOutput> {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;

    const batch = await prisma.wPSBatch.findFirst({
      where: { id: batchId, tenantId },
      include: { items: { include: { employee: true } } },
    });
    if (!batch) throw new Error(`دفعة WPS ${batchId} غير موجودة`);

    const employees: WPSEmployee[] = batch.items.map((item: any) => ({
      iqamaNumber: item.employee.iqamaNumber ?? item.employee.nationalId ?? '',
      employeeId: String(item.employee.id),
      name: item.employee.nameAr ?? item.employee.name,
      iban: item.employee.iban ?? '',
      netSalary: new Decimal(item.netSalary),
      bankCode: item.employee.bankCode ?? '1060', // افتراضي: الراجحي
    }));

    // التحقق من صحة الـ IBAN قبل التوليد
    const invalidIBANs = employees.filter((e) => !this._validateSAIBAN(e.iban));
    if (invalidIBANs.length > 0) {
      throw new Error(
        `${invalidIBANs.length} موظفين لديهم IBAN غير صالح:\n` +
          invalidIBANs.map((e) => `- ${e.name}: ${e.iban}`).join('\n'),
      );
    }

    const totalAmount = employees.reduce((s, e) => s.add(e.netSalary), new Decimal(0));
    const generatedAt = new Date();
    const content = this._generate(bank, employees, batch, generatedAt);
    const ext = this._fileExtension(bank);
    const fileName = `WPS_${bank}_${batchId}_${generatedAt.toISOString().slice(0, 10)}${ext}`;

    // تحديث الدفعة بحالة "تم توليد الملف"
    await prisma.wPSBatch.update({
      where: { id: batchId },
      data: { sifGenerated: true, sifGeneratedAt: generatedAt, bankCode: bank },
    }).catch(() => null);

    return { batchId, bank, fileName, content, employeeCount: employees.length, totalAmount, generatedAt };
  }

  // ─── Validators ────────────────────────────────────────────────────────────

  private _validateSAIBAN(iban: string): boolean {
    if (!iban) return false;
    const clean = iban.replace(/\s/g, '').toUpperCase();
    // SA + 22 رقم
    return /^SA\d{22}$/.test(clean);
  }

  // ─── Format Generators ────────────────────────────────────────────────────

  private _generate(
    bank: SupportedBank,
    employees: WPSEmployee[],
    batch: any,
    date: Date,
  ): string {
    switch (bank) {
      case 'AL_RAJHI': return this._formatAlRajhi(employees, batch, date);
      case 'SNB':      return this._formatSNB(employees, batch, date);
      case 'RIYAD':    return this._formatRiyad(employees, batch, date);
      case 'BILAD':    return this._formatBilad(employees, batch, date);
      case 'SAB':      return this._formatSAB(employees, batch, date);
      default:         throw new Error(`بنك غير مدعوم: ${bank}`);
    }
  }

  /** الراجحي: AR-WPS-V2 — TXT delimiter '|' */
  private _formatAlRajhi(employees: WPSEmployee[], batch: any, date: Date): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const header = `H|${batch.tenantCR ?? '1234567890'}|${dateStr}|${employees.length}|SAR`;
    const lines = employees.map((e) =>
      `D|${e.iqamaNumber}|${e.iban}|${e.netSalary.toFixed(2)}|SAR|${dateStr}|${e.name}`,
    );
    const total = employees.reduce((s, e) => s.add(e.netSalary), new Decimal(0));
    const trailer = `T|${employees.length}|${total.toFixed(2)}`;
    return [header, ...lines, trailer].join('\r\n');
  }

  /** الأهلي SNB: NCB-SIF-V3 — CSV */
  private _formatSNB(employees: WPSEmployee[], batch: any, date: Date): string {
    const header = 'Iqama,IBAN,Amount,Currency,Name,PaymentDate';
    const dateStr = date.toISOString().slice(0, 10);
    const lines = employees.map((e) =>
      `${e.iqamaNumber},${e.iban},${e.netSalary.toFixed(2)},SAR,"${e.name}",${dateStr}`,
    );
    return [header, ...lines].join('\r\n');
  }

  /** الرياض: XML format */
  private _formatRiyad(employees: WPSEmployee[], batch: any, date: Date): string {
    const dateStr = date.toISOString();
    const items = employees
      .map(
        (e) => `  <Payment>
    <IBAN>${e.iban}</IBAN>
    <Amount currency="SAR">${e.netSalary.toFixed(2)}</Amount>
    <Beneficiary>${e.name}</Beneficiary>
    <Iqama>${e.iqamaNumber}</Iqama>
  </Payment>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<WPSFile version="1.0">
  <Header>
    <Date>${dateStr}</Date>
    <Count>${employees.length}</Count>
  </Header>
  <Payments>
${items}
  </Payments>
</WPSFile>`;
  }

  /** البلاد: TXT بصيغة مختلفة */
  private _formatBilad(employees: WPSEmployee[], _batch: any, date: Date): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return employees
      .map((e) => `${e.iqamaNumber.padEnd(10)} ${e.iban.padEnd(24)} ${e.netSalary.toFixed(2).padStart(12)} ${dateStr}`)
      .join('\r\n');
  }

  /** ساب: CSV مبسط */
  private _formatSAB(employees: WPSEmployee[], _batch: any, date: Date): string {
    const header = 'ID,IBAN,Name,NetSalary,Date';
    const dateStr = date.toISOString().slice(0, 10);
    const lines = employees.map((e) =>
      `${e.employeeId},${e.iban},"${e.name}",${e.netSalary.toFixed(2)},${dateStr}`,
    );
    return [header, ...lines].join('\r\n');
  }

  private _fileExtension(bank: SupportedBank): string {
    return bank === 'RIYAD' ? '.xml' : bank === 'SNB' || bank === 'SAB' ? '.csv' : '.txt';
  }
}
