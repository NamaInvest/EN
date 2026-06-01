import { Decimal } from '@prisma/client/runtime/library';
import { getPrisma } from './prisma';
import { FinancialConsolidationEngine, ProposedJournalEntry } from './financial-consolidation-engine';
import { assertPeriodWritable } from './governance/period-lock';
import crypto from 'crypto';
import { logger } from './logger';

const log = logger.child({ service: 'consolidation-elimination-approval' });

export interface ConsolidationEliminationRequest {
  id: string;
  tenantId: string;
  groupId: number;
  from: string;
  to: string;
  status: 'DRAFT' | 'SUBMITTED' | 'CFO_APPROVED' | 'POSTING_READY' | 'REJECTED' | 'CANCELLED';
  totalDebit: Decimal;
  totalCredit: Decimal;
  previewHash: string;
  createdBy: string;
  createdAt: Date;
  cfoApprovedBy?: string;
  cfoApprovedAt?: Date;
  masterApprovedBy?: string;
  masterApprovedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  snapshot: ProposedJournalEntry[] | unknown;
}

export interface SubmitRequestInput {
  tenantId: string;
  groupId: number;
  from: string;
  to: string;
  actorId: string;
  actorRole: string;
}

export interface ApproveByCfoInput {
  tenantId: string;
  requestId: string;
  actorId: string;
  actorRole: string;
}

export interface ApproveByMasterAdminInput {
  tenantId: string;
  requestId: string;
  actorId: string;
  actorRole: string;
}

export interface RejectRequestInput {
  tenantId: string;
  requestId: string;
  actorId: string;
  actorRole: string;
  reason: string;
}

export interface ValidateReadinessInput {
  tenantId: string;
  requestId: string;
}

let idCounter = 1;
function generateId(): string {
  return `REQ_${idCounter++}_${Date.now()}`;
}

function generateHash(data: unknown): string {
  const str = JSON.stringify(data || '');
  return crypto.createHash('sha256').update(str).digest('hex');
}

export class ConsolidationEliminationApprovalService {
  public static requests = new Map<string, ConsolidationEliminationRequest>();

  /**
   * تقديم طلب جديد لاستبعاد التوحيد المحاسبي
   */
  async submitRequest(input: SubmitRequestInput): Promise<ConsolidationEliminationRequest> {
    const { tenantId, groupId, from, to, actorId } = input;

    log.info('Submitting consolidation elimination request', { tenantId, groupId, from, to, actorId });

    // 1. استخلاص سياق قاعدة البيانات المعزولة
    const prisma = getPrisma();
    const engine = new FinancialConsolidationEngine(prisma);

    // 2. تشغيل المحاكاة Dry-run
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new Error('تاريخ البدء أو الانتهاء غير صالح');
    }

    const runResult = await engine.dryRunEliminations(tenantId, groupId, fromDate, toDate);

    // 3. التحقق من توازن الأرصدة
    if (!runResult.isBalanced) {
      throw new Error('الطلب غير متوازن محاسبياً (إجمالي المدين لا يساوي إجمالي الدائن)');
    }

    // 4. منع التكرار باستخدام مفتاح الفرادة للمستأجر والمجموعة والفترة النشطة
    const activeRequest = Array.from(ConsolidationEliminationApprovalService.requests.values()).find(
      (r) =>
        r.tenantId === tenantId &&
        r.groupId === groupId &&
        r.from === from &&
        r.to === to &&
        !['REJECTED', 'CANCELLED'].includes(r.status)
    );

    if (activeRequest) {
      throw new Error('يوجد طلب استبعاد نشط بالفعل لنفس الفترة والمجموعة');
    }

    // 5. توليد الـ previewHash وحفظ لقطة البيانات محلياً
    const previewHash = generateHash(runResult.proposedEntries);

    const request: ConsolidationEliminationRequest = {
      id: generateId(),
      tenantId,
      groupId,
      from,
      to,
      status: 'SUBMITTED',
      totalDebit: runResult.totalDebit,
      totalCredit: runResult.totalCredit,
      previewHash,
      createdBy: actorId,
      createdAt: new Date(),
      snapshot: runResult.proposedEntries,
    };

    ConsolidationEliminationApprovalService.requests.set(request.id, request);

    // تسجيل audit metadata آمن
    log.info('Consolidation elimination request submitted successfully', {
      requestId: request.id,
      tenantId,
      groupId,
      previewHash,
      createdBy: actorId,
    });

    return request;
  }

  /**
   * اعتماد الطلب من قبل المدير المالي CFO
   */
  async approveByCfo(input: ApproveByCfoInput): Promise<ConsolidationEliminationRequest> {
    const { tenantId, requestId, actorId, actorRole } = input;

    log.info('CFO approval process started', { tenantId, requestId, actorId, actorRole });

    const request = ConsolidationEliminationApprovalService.requests.get(requestId);

    if (!request) {
      throw new Error('الطلب غير موجود');
    }

    if (request.tenantId !== tenantId) {
      throw new Error('غير مصرح بالوصول لبيانات هذا المستأجر');
    }

    if (request.status !== 'SUBMITTED') {
      throw new Error('حالة الطلب غير صالحة للاعتماد من قبل CFO');
    }

    // فصل الواجبات (segregation of duties)
    if (actorId === request.createdBy) {
      throw new Error('يمنع اعتماد الطلب من قبل نفس المحاسب منشئ الطلب');
    }

    // التحقق من صلاحية CFO
    if (actorRole !== 'CFO' && actorRole !== 'SUPER_ADMIN') {
      throw new Error('غير مصرح لك باتخاذ هذا القرار (صلاحية CFO مطلوبة)');
    }

    // التحقق من تطابق previewHash للتأكد من عدم تغير الأرصدة البينية
    const prisma = getPrisma();
    const engine = new FinancialConsolidationEngine(prisma);
    const runResult = await engine.dryRunEliminations(tenantId, request.groupId, new Date(request.from), new Date(request.to));
    const currentHash = generateHash(runResult.proposedEntries);

    if (currentHash !== request.previewHash) {
      throw new Error('تغيرت أرصدة الحسابات البينية منذ تقديم الطلب، يرجى تقديم طلب جديد');
    }

    request.status = 'CFO_APPROVED';
    request.cfoApprovedBy = actorId;
    request.cfoApprovedAt = new Date();

    ConsolidationEliminationApprovalService.requests.set(requestId, request);

    log.info('CFO approval recorded successfully', { requestId, cfoApprovedBy: actorId });

    return request;
  }

  /**
   * اعتماد الطلب النهائي من قبل Master Admin
   */
  async approveByMasterAdmin(input: ApproveByMasterAdminInput): Promise<ConsolidationEliminationRequest> {
    const { tenantId, requestId, actorId, actorRole } = input;

    log.info('Master Admin approval process started', { tenantId, requestId, actorId, actorRole });

    const request = ConsolidationEliminationApprovalService.requests.get(requestId);

    if (!request) {
      throw new Error('الطلب غير موجود');
    }

    if (request.tenantId !== tenantId) {
      throw new Error('غير مصرح بالوصول لبيانات هذا المستأجر');
    }

    if (request.status !== 'CFO_APPROVED') {
      throw new Error('يجب اعتماد الطلب من قبل المدير المالي CFO أولاً');
    }

    // التحقق من صلاحية Master Admin أو الاعتماد النهائي
    if (actorRole !== 'MASTER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new Error('غير مصرح لك باتخاذ هذا القرار (صلاحية Master Admin مطلوبة)');
    }

    // التحقق من تطابق previewHash للتأكد من عدم تغير الأرصدة البينية
    const prisma = getPrisma();
    const engine = new FinancialConsolidationEngine(prisma);
    const runResult = await engine.dryRunEliminations(tenantId, request.groupId, new Date(request.from), new Date(request.to));
    const currentHash = generateHash(runResult.proposedEntries);

    if (currentHash !== request.previewHash) {
      throw new Error('تغيرت أرصدة الحسابات البينية منذ اعتماد CFO، يرجى تقديم طلب جديد');
    }

    // حماية الفترات المحاسبية assertPeriodWritable
    await assertPeriodWritable({
      tenantId,
      postingDate: new Date(request.to),
      operationType: 'CONSOLIDATION_ELIMINATION',
      module: 'ACCOUNTING',
      actor: actorId,
    });

    request.status = 'POSTING_READY';
    request.masterApprovedBy = actorId;
    request.masterApprovedAt = new Date();

    ConsolidationEliminationApprovalService.requests.set(requestId, request);

    log.info('Master Admin approval recorded successfully', { requestId, masterApprovedBy: actorId });

    return request;
  }

  /**
   * رفض طلب استبعاد
   */
  async rejectRequest(input: RejectRequestInput): Promise<ConsolidationEliminationRequest> {
    const { tenantId, requestId, actorId, reason } = input;

    log.info('Rejecting consolidation elimination request', { tenantId, requestId, actorId, reason });

    if (!reason || reason.trim() === '') {
      throw new Error('يجب كتابة سبب الرفض (reason مطلوب)');
    }

    const request = ConsolidationEliminationApprovalService.requests.get(requestId);

    if (!request) {
      throw new Error('الطلب غير موجود');
    }

    if (request.tenantId !== tenantId) {
      throw new Error('غير مصرح بالوصول لبيانات هذا المستأجر');
    }

    request.status = 'REJECTED';
    request.rejectedBy = actorId;
    request.rejectedAt = new Date();
    request.rejectionReason = reason;

    ConsolidationEliminationApprovalService.requests.set(requestId, request);

    log.info('Request rejected successfully', { requestId, rejectedBy: actorId, reason });

    return request;
  }

  /**
   * دالة التحقق من سلامة الجاهزية للترحيل المستقبلي
   */
  async validatePostingReadiness(input: ValidateReadinessInput) {
    const { tenantId, requestId } = input;

    log.info('Validating posting readiness', { tenantId, requestId });

    const request = ConsolidationEliminationApprovalService.requests.get(requestId);

    if (!request) {
      throw new Error('الطلب غير موجود');
    }

    if (request.tenantId !== tenantId) {
      throw new Error('غير مصرح بالوصول لبيانات هذا المستأجر');
    }

    const warnings: string[] = [];
    let canPost = true;

    // 1. التحقق من اكتمال الموافقات
    if (request.status !== 'POSTING_READY') {
      canPost = false;
      warnings.push('الطلب ليس في حالة جاهزية الترحيل (POSTING_READY)');
    }

    // 2. التحقق من تطابق الأرصدة البينية الحالية
    try {
      const prisma = getPrisma();
      const engine = new FinancialConsolidationEngine(prisma);
      const runResult = await engine.dryRunEliminations(tenantId, request.groupId, new Date(request.from), new Date(request.to));
      const currentHash = generateHash(runResult.proposedEntries);

      if (currentHash !== request.previewHash) {
        canPost = false;
        warnings.push('تغيرت أرصدة الحسابات البينية منذ الاعتماد، يرجى إعادة تقديم الطلب وموافقته');
      }

      if (!runResult.isBalanced) {
        canPost = false;
        warnings.push('الطلب المحاكى حالياً غير متوازن محاسبياً');
      }
    } catch (error: unknown) {
      const err = error as Error;
      canPost = false;
      warnings.push(`فشل تشغيل محاكاة الاستبعاد: ${err.message}`);
    }

    return {
      canPost,
      postingStillBlocked: true,
      requiresSeparatePostingPhase: true,
      warnings,
    };
  }
}
