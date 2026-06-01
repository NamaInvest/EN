import { Decimal } from '@prisma/client/runtime/library';
import { getPrisma } from './prisma';
import { FinancialConsolidationEngine, ProposedJournalEntry } from './financial-consolidation-engine';
import { assertPeriodWritable } from './governance/period-lock';
import { AccountingJournalService, CreateJournalEntryDTO } from './services/accounting-journal.service';
import { lockIdempotencyKey, completeIdempotencyKey, unlockIdempotencyKey } from './idempotency';
import { logger } from './logger';
import crypto from 'crypto';

const log = logger.child({ service: 'consolidation-elimination-posting' });

export interface PostingPreviewResult {
  canPost: boolean;
  postingStillBlocked: boolean;
  requiresExplicitPostingPhase: boolean;
  postingReference: string;
  reversalReference: string;
  journalPreview: ProposedJournalEntry[];
  reversalPreview: ProposedJournalEntry[];
  warnings: string[];
}

function generateHash(data: unknown): string {
  const str = JSON.stringify(data || '');
  return crypto.createHash('sha256').update(str).digest('hex');
}

export class ConsolidationEliminationPostingService {
  /**
   * 1. التحقق من سلامة وصلاحية الطلب المعتمد للترحيل المالي
   */
  async validateApprovedRequestForPosting(
    tenantId: string,
    requestId: string,
    actorId: string
  ): Promise<{ isValid: boolean; errors: string[]; request?: unknown }> {
    log.info('Validating approved request for posting', { tenantId, requestId, actorId });

    const prisma = getPrisma();
    
    // Fetch request from DB
    const request = await prisma.consolidationEliminationRequest.findFirst({
      where: { id: requestId, tenantId },
    });

    if (!request) {
      return { isValid: false, errors: ['الطلب غير موجود في قاعدة البيانات'] };
    }

    const errors: string[] = [];

    // 1. بوابة الحالة المحاسبية المعتمدة
    if (request.status !== 'POSTING_READY' && request.status !== 'MASTER_APPROVED') {
      errors.push('حالة الطلب غير صالحة للترحيل (يجب أن تكون جاهزة للترحيل POSTING_READY)');
    }

    // 2. توفر الموافقات الصريحة
    if (!request.cfoApprovedBy) {
      errors.push('موافقة المدير المالي (CFO approval) غير موجودة');
    }
    if (!request.masterApprovedBy) {
      errors.push('اعتماد المسؤول الرئيسي (Master Admin approval) غير موجود');
    }

    // 3. مبدأ فصل الواجبات (Segregation of Duties)
    if (actorId === request.createdBy) {
      errors.push('يمنع ترحيل القيود بواسطة نفس المحاسب الذي أنشأ الطلب (Maker != Poster)');
    }

    // 4. توازن القيد
    const debitVal = new Decimal(request.totalDebit);
    const creditVal = new Decimal(request.totalCredit);
    if (!debitVal.equals(creditVal)) {
      errors.push('الطلب غير متوازن حسابياً (إجمالي المدين لا يساوي إجمالي الدائن)');
    }

    // 5. مكافحة انحراف الأرصدة البينية (Drift Guard)
    const engine = new FinancialConsolidationEngine(prisma);
    const runResult = await engine.dryRunEliminations(
      tenantId,
      request.groupId,
      new Date(request.periodFrom),
      new Date(request.periodTo)
    );
    const currentHash = generateHash(runResult.proposedEntries);

    if (currentHash !== request.previewHash) {
      errors.push('تغيرت أرصدة الحسابات البينية في النظام منذ اعتماد الطلب، يرجى تقديم طلب جديد وإعادة اعتماده');
    }

    // 6. التحقق من أقفال الفترات (Period Lock Gates)
    try {
      await assertPeriodWritable({
        tenantId,
        postingDate: new Date(request.periodTo),
        operationType: 'POST_JOURNAL',
        module: 'ACCOUNTING',
        actor: actorId,
      });
    } catch (err: unknown) {
      const errorObj = err as Error;
      errors.push(`فترة ترحيل الاستبعاد مقفلة: ${errorObj.message}`);
    }

    if (request.autoReverseDate) {
      try {
        await assertPeriodWritable({
          tenantId,
          postingDate: new Date(request.autoReverseDate),
          operationType: 'POST_JOURNAL',
          module: 'ACCOUNTING',
          actor: actorId,
        });
      } catch (err: unknown) {
        const errorObj = err as Error;
        errors.push(`فترة ترحيل قيد العكس مقفلة: ${errorObj.message}`);
      }
    }

    // 7. منع التكرار (Unique posting check)
    const duplicateRef = `ELIM_POST_${request.groupId}_${request.periodKey}`;
    const existingPosted = await prisma.consolidationEliminationRequest.findFirst({
      where: {
        tenantId,
        groupId: request.groupId,
        periodKey: request.periodKey,
        postingReference: duplicateRef,
        status: 'POSTED',
      },
    });

    if (existingPosted && existingPosted.id !== requestId) {
      errors.push('تم ترحيل استبعاد آخر بالفعل لهذه المجموعة ولهذه الفترة المحاسبية');
    }

    return {
      isValid: errors.length === 0,
      errors,
      request,
    };
  }

  /**
   * 2. توليد معاينة الترحيل (Posting Preview) دون الكتابة الحقيقية
   */
  async buildPostingPreview(
    tenantId: string,
    requestId: string
  ): Promise<PostingPreviewResult> {
    log.info('Building posting preview', { tenantId, requestId });
    const prisma = getPrisma();

    const request = await prisma.consolidationEliminationRequest.findFirst({
      where: { id: requestId, tenantId },
    });

    if (!request) {
      throw new Error('الطلب غير موجود في قاعدة البيانات');
    }

    const proposedEntries = request.snapshotJson as unknown as ProposedJournalEntry[];
    const reversalPreview: ProposedJournalEntry[] = [];

    for (const entry of proposedEntries) {
      const revLines = entry.lines.map((l) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        debit: new Decimal(l.credit),
        credit: new Decimal(l.debit),
        description: `عكس - ${l.description}`,
      }));

      reversalPreview.push({
        description: `عكس - ${entry.description}`,
        reference: `REV_${entry.reference}`,
        entryDate: request.autoReverseDate ? request.autoReverseDate.toISOString().split('T')[0] : '',
        autoReverseDate: null,
        lines: revLines as unknown as ProposedJournalEntry['lines'],
      });
    }

    const postingRef = `ELIM_POST_${request.groupId}_${request.periodKey}`;
    const revRef = `REV_ELIM_POST_${request.groupId}_${request.periodKey}`;

    return {
      canPost: request.status === 'POSTING_READY' || request.status === 'MASTER_APPROVED',
      postingStillBlocked: true,
      requiresExplicitPostingPhase: true,
      postingReference: postingRef,
      reversalReference: revRef,
      journalPreview: proposedEntries,
      reversalPreview,
      warnings: [],
    };
  }

  /**
   * 3. الترحيل الفعلي المنضبط لقيود الاستبعاد والعكس الفوري داخل معاملة واحدة
   */
  async postApprovedElimination(
    tenantId: string,
    requestId: string,
    actorId: string,
    actorRole: string,
    idempotencyKey: string
  ): Promise<unknown> {
    log.info('Starting post approved elimination process', { tenantId, requestId, actorId, idempotencyKey });

    if (!idempotencyKey) {
      throw new Error('مفتاح عدم التكرار (Idempotency-Key) مطلوب لإجراء الترحيل المالي');
    }

    // 1. حارس التكرار الموزع (Redis Lock)
    const routeName = `consolidation.post.${requestId}`;
    const isUnique = await lockIdempotencyKey(tenantId, routeName, idempotencyKey);
    if (!isUnique) {
      throw new Error('طلب مكرر قيد المعالجة أو تم الانتهاء منه بالفعل');
    }

    try {
      // 2. التحقق الكامل من الصلاحيات والضوابط المحاسبية
      const validation = await this.validateApprovedRequestForPosting(tenantId, requestId, actorId);
      if (!validation.isValid) {
        throw new Error(`فشل التحقق من ضوابط الترحيل: ${validation.errors.join(', ')}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = validation.request as any;
      const proposedEntries = request.snapshotJson as unknown as ProposedJournalEntry[];
      const prisma = getPrisma();

      // 3. الترحيل الذري في معاملة واحدة (All-or-Nothing Transaction)
      const finalRequest = await prisma.$transaction(async (tx) => {
        // أ. تحديث حالة الطلب إلى ترحيل قيد التنفيذ لمنع التضارب
        await tx.consolidationEliminationRequest.update({
          where: { id: requestId },
          data: { status: 'POSTING_IN_PROGRESS' },
        });

        const postingRef = `ELIM_POST_${request.groupId}_${request.periodKey}`;
        const revRef = `REV_ELIM_POST_${request.groupId}_${request.periodKey}`;

        let eliminationJeId: number | null = null;
        let reversalJeId: number | null = null;

        // ب. ترحيل قيود الاستبعاد المقترحة في أدفاتر المجموعة المعزولة (GROUP Book)
        for (const entry of proposedEntries) {
          const eliminationDto = {
            description: entry.description,
            reference: postingRef,
            date: entry.entryDate,
            tenantId,
            actor: actorId,
            status: 'posted',
            bookId: 99, 
            lines: entry.lines.map((l) => ({
              accountCode: l.accountCode,
              debit: Number(l.debit),
              credit: Number(l.credit),
              description: l.description,
            })),
          } as unknown as CreateJournalEntryDTO;

          const je = await AccountingJournalService.createEntry(tx, eliminationDto);
          eliminationJeId = je.id;

          // ج. ترحيل قيد العكس الفوري (Option A) بتاريخ أول يوم في الشهر التالي في نفس المعاملة
          if (request.autoReverseDate) {
            const reversalDto = {
              description: `عكس - ${entry.description}`,
              reference: revRef,
              date: request.autoReverseDate.toISOString().split('T')[0],
              tenantId,
              actor: actorId,
              status: 'posted',
              bookId: 99,
              lines: entry.lines.map((l) => ({
                accountCode: l.accountCode,
                debit: Number(l.credit), // Swapped!
                credit: Number(l.debit),  // Swapped!
                description: `عكس - ${l.description}`,
              })),
            } as unknown as CreateJournalEntryDTO;

            const revJe = await AccountingJournalService.createEntry(tx, reversalDto);
            reversalJeId = revJe.id;
          }
        }

        // د. تدوين سجل تدقيق التدخلات المالية المحمي (Audit trail metadata)
        await tx.auditLog.create({
          data: {
            tenantId,
            action: 'CONSOLIDATION_ELIMINATION_POSTED',
            entityType: 'ConsolidationEliminationRequest',
            entityId: requestId,
            userId: Number(actorId) || undefined,
            metadata: {
              tenantScoped: true,
              groupId: request.groupId,
              periodFrom: request.periodFrom.toISOString(),
              periodTo: request.periodTo.toISOString(),
              requestId,
              previewHash: request.previewHash,
              postingReference: postingRef,
              reversalReference: revRef,
              totalDebit: request.totalDebit.toString(),
              totalCredit: request.totalCredit.toString(),
              journalEntryId: eliminationJeId,
              reversalJournalEntryId: reversalJeId,
              actorId,
              statusBefore: 'POSTING_READY',
              statusAfter: 'POSTED',
            },
          },
        });

        // هـ. تحديث حالة الطلب إلى مرحل وموثق نهائياً بروابط القيود
        const updatedReq = await tx.consolidationEliminationRequest.update({
          where: { id: requestId },
          data: {
            status: 'POSTED',
            postingReference: postingRef,
            reversalReference: revRef,
            journalEntryId: eliminationJeId,
            reversalJournalEntryId: reversalJeId,
            postedBy: actorId,
            postedAt: new Date(),
          },
        });

        // و. إنشاء تفصيل الترحيل الفرعي
        await tx.consolidationEliminationPosting.create({
          data: {
            tenantId,
            requestId,
            journalEntryId: eliminationJeId || 0,
            reversalEntryId: reversalJeId,
            status: 'SUCCESS',
            postedAt: new Date(),
          },
        });

        return updatedReq;
      });

      // 4. تأكيد نجاح مفتاح حارس التكرار
      await completeIdempotencyKey(tenantId, routeName, idempotencyKey);
      return finalRequest;
    } catch (error: unknown) {
      // 5. فك قفل التكرار في حال التعثر لإتاحة محاولة آمنة تالية
      await unlockIdempotencyKey(tenantId, routeName, idempotencyKey);
      const errObj = error as Error;
      log.error('Failed to post consolidation elimination request', { requestId, error: errObj.message });
      throw error;
    }
  }

  /**
   * 4. عكس القيود المرحلة بطلب يدوي إضافي مدقق
   */
  async reversePostedElimination(
    tenantId: string,
    requestId: string,
    actorId: string,
    actorRole: string
  ): Promise<unknown> {
    log.info('Starting manual reversal process', { tenantId, requestId, actorId });
    const prisma = getPrisma();

    const request = await prisma.consolidationEliminationRequest.findFirst({
      where: { id: requestId, tenantId },
    });

    if (!request) {
      throw new Error('الطلب غير موجود');
    }

    if (request.status !== 'POSTED') {
      throw new Error('يمكن فقط عكس الطلبات المرحلة بالكامل (POSTED)');
    }

    if (actorRole !== 'MASTER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new Error('غير مصرح لك بإجراء عكس القيود يدوياً (صلاحية Master Admin مطلوبة)');
    }

    // التحقق من صلاحيات الأقفال لفترة العكس اليدوي
    await assertPeriodWritable({
      tenantId,
      postingDate: new Date(),
      operationType: 'POST_JOURNAL',
      module: 'ACCOUNTING',
      actor: actorId,
    });

    const updated = await prisma.$transaction(async (tx) => {
      // تدوين قيد العكس اليدوي الإضافي
      const proposedEntries = request.snapshotJson as unknown as ProposedJournalEntry[];
      let manualRevJeId: number | null = null;

      for (const entry of proposedEntries) {
        const manualRevDto = {
          description: `عكس يدوي استثنائي - ${entry.description}`,
          reference: `MAN_REV_${request.postingReference}`,
          date: new Date().toISOString().split('T')[0],
          tenantId,
          actor: actorId,
          status: 'posted',
          bookId: 99,
          lines: entry.lines.map((l) => ({
            accountCode: l.accountCode,
            debit: Number(l.credit), // Swapped!
            credit: Number(l.debit),  // Swapped!
            description: `عكس يدوي - ${l.description}`,
          })),
        } as unknown as CreateJournalEntryDTO;

        const manualRevJe = await AccountingJournalService.createEntry(tx, manualRevDto);
        manualRevJeId = manualRevJe.id;
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          action: 'CONSOLIDATION_ELIMINATION_REVERSED',
          entityType: 'ConsolidationEliminationRequest',
          entityId: requestId,
          userId: Number(actorId) || undefined,
          metadata: {
            tenantScoped: true,
            groupId: request.groupId,
            requestId,
            reversalJournalEntryId: manualRevJeId,
            actorId,
            statusBefore: 'POSTED',
            statusAfter: 'REVERSED',
          },
        },
      });

      return await tx.consolidationEliminationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REVERSED',
          reversedBy: actorId,
          reversedAt: new Date(),
        },
      });
    });

    return updated;
  }
}
