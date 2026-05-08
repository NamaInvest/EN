/**
 * Universal Document State Machine — Foundation 0.2
 * ════════════════════════════════════════════════════
 *
 * يوفّر:
 *   - DocumentStatus enum موحّدة لكل أنواع الوثائق
 *   - جدول transitions مسموحة لكل نوع
 *   - canTransition() — فحص قبل التطبيق
 *   - transition() — تطبيق الانتقال + audit log
 *   - assertEditable() — يمنع تعديل وثيقة POSTED أو REVERSED
 *
 * يطبَّق على: SalesInvoice, PurchaseInvoice, JournalEntry, PurchaseOrder,
 *           SalesOrder, GoodsReceiptNote, DeliveryNote, ManufacturingOrder
 */

import type { PrismaClient } from '@prisma/client';

// ─── Status enum ─────────────────────────────────────────────────────
export const DocumentStatus = {
    DRAFT:                'draft',
    PENDING_APPROVAL:     'pending_approval',
    APPROVED:             'approved',
    POSTED:               'posted',
    PARTIALLY_FULFILLED:  'partially_fulfilled',
    FULFILLED:            'fulfilled',
    CANCELLED:            'cancelled',
    REVERSED:             'reversed',
    // Manufacturing-specific
    IN_PROGRESS:          'in_progress',
    COMPLETED:            'completed',
} as const;

export type DocumentStatusValue = typeof DocumentStatus[keyof typeof DocumentStatus];

// ─── Document types ──────────────────────────────────────────────────
export const DocumentType = {
    SALES_INVOICE:       'SalesInvoice',
    PURCHASE_INVOICE:    'PurchaseInvoice',
    JOURNAL_ENTRY:       'JournalEntry',
    PURCHASE_ORDER:      'PurchaseOrder',
    SALES_ORDER:         'SalesOrder',
    GOODS_RECEIPT:       'GoodsReceiptNote',
    DELIVERY_NOTE:       'DeliveryNote',
    MANUFACTURING_ORDER: 'ManufacturingOrder',
    PURCHASE_REQUISITION:'PurchaseRequisition',
    RFQ:                 'RequestForQuotation',
} as const;

export type DocumentTypeValue = typeof DocumentType[keyof typeof DocumentType];

// ─── Transitions table ───────────────────────────────────────────────
// Each document type lists the allowed (from → to) edges.
// Anything not listed is forbidden.
const TRANSITIONS: Record<DocumentTypeValue, Record<string, DocumentStatusValue[]>> = {
    SalesInvoice: {
        draft:     ['pending_approval', 'posted', 'cancelled'],
        pending_approval: ['approved', 'cancelled'],
        approved:  ['posted', 'cancelled'],
        posted:    ['partially_fulfilled', 'fulfilled', 'reversed'],
        partially_fulfilled: ['fulfilled', 'reversed'],
        fulfilled: ['reversed'],
        cancelled: [],
        reversed:  [],
    },
    PurchaseInvoice: {
        draft:     ['pending_approval', 'posted', 'cancelled'],
        pending_approval: ['approved', 'cancelled'],
        approved:  ['posted', 'cancelled'],
        posted:    ['partially_fulfilled', 'fulfilled', 'reversed'],
        partially_fulfilled: ['fulfilled', 'reversed'],
        fulfilled: ['reversed'],
        cancelled: [],
        reversed:  [],
    },
    JournalEntry: {
        draft:     ['pending_approval', 'posted', 'cancelled'],
        pending_approval: ['approved', 'cancelled'],
        approved:  ['posted', 'cancelled'],
        posted:    ['reversed'],
        cancelled: [],
        reversed:  [],
    },
    PurchaseOrder: {
        draft:     ['pending_approval', 'cancelled'],
        pending_approval: ['approved', 'cancelled'],
        approved:  ['partially_fulfilled', 'fulfilled', 'cancelled'],
        partially_fulfilled: ['fulfilled', 'cancelled'],
        fulfilled: [],
        cancelled: [],
    },
    SalesOrder: {
        draft:     ['pending_approval', 'approved', 'cancelled'],
        pending_approval: ['approved', 'cancelled'],
        approved:  ['partially_fulfilled', 'fulfilled', 'cancelled'],
        partially_fulfilled: ['fulfilled', 'cancelled'],
        fulfilled: [],
        cancelled: [],
    },
    GoodsReceiptNote: {
        draft:     ['posted', 'cancelled'],
        posted:    ['reversed'],
        cancelled: [],
        reversed:  [],
    },
    DeliveryNote: {
        draft:     ['posted', 'cancelled'],
        posted:    ['reversed'],
        cancelled: [],
        reversed:  [],
    },
    ManufacturingOrder: {
        draft:       ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed:   ['reversed'],
        cancelled:   [],
        reversed:    [],
    },
    PurchaseRequisition: {
        draft:     ['pending_approval', 'cancelled'],
        pending_approval: ['approved', 'cancelled'],
        approved:  ['fulfilled', 'cancelled'],
        fulfilled: [],
        cancelled: [],
    },
    RequestForQuotation: {
        draft:     ['posted', 'cancelled'],
        posted:    ['fulfilled', 'cancelled'],
        fulfilled: [],
        cancelled: [],
    },
};

// ─── Terminal states (cannot be edited) ──────────────────────────────
const TERMINAL_STATES: Set<DocumentStatusValue> = new Set([
    'posted', 'reversed', 'cancelled', 'fulfilled', 'completed',
]);

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Check whether the given (from, to) transition is allowed for this docType.
 * Pure function — no DB calls.
 */
export function canTransition(
    from: DocumentStatusValue | string,
    to: DocumentStatusValue | string,
    docType: DocumentTypeValue
): boolean {
    const table = TRANSITIONS[docType];
    if (!table) return false;
    const allowedNext = table[from as string];
    if (!allowedNext) return false;
    return allowedNext.includes(to as DocumentStatusValue);
}

/**
 * List the legal next-states from a given current state.
 * Useful for UI — show which buttons to render.
 */
export function nextStates(
    from: DocumentStatusValue | string,
    docType: DocumentTypeValue
): DocumentStatusValue[] {
    const table = TRANSITIONS[docType];
    return table?.[from as string] ?? [];
}

/**
 * Returns true if a document in this status is permanent and must not be mutated.
 * Use in route handlers before allowing UPDATE.
 */
export function isTerminal(status: DocumentStatusValue | string): boolean {
    return TERMINAL_STATES.has(status as DocumentStatusValue);
}

/**
 * Throws if the document's current status forbids edits.
 * Convention: only DRAFT and PENDING_APPROVAL are freely editable.
 */
export function assertEditable(
    status: DocumentStatusValue | string,
    docType: DocumentTypeValue
): void {
    if (isTerminal(status)) {
        throw new Error(
            `لا يمكن تعديل ${docType} بحالة "${status}" — يجب إنشاء قيد عكسي أو نسخة جديدة بدلاً من ذلك.`
        );
    }
}

/**
 * Apply a transition: validate, run callback (e.g. update DB row + side effects),
 * then write an AuditLog row recording the change.
 *
 * Caller is responsible for actually changing the document's status field
 * inside the callback — this engine validates + audits.
 */
export async function transition<T>(
    prisma: PrismaClient,
    params: {
        docType: DocumentTypeValue;
        docId: number;
        from: DocumentStatusValue | string;
        to: DocumentStatusValue;
        userId?: number;
        reason?: string;
        apply: () => Promise<T>;  // executes the actual status mutation
    }
): Promise<T> {
    if (!canTransition(params.from, params.to, params.docType)) {
        throw new Error(
            `Transition forbidden: ${params.docType} cannot move from "${params.from}" to "${params.to}". ` +
            `Allowed next: [${nextStates(params.from, params.docType).join(', ')}]`
        );
    }

    const result = await params.apply();

    // Best-effort audit log — failure here must not abort the business action,
    // since the apply() above already mutated state. Log to stderr instead.
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId ?? 0,
                action: `transition:${params.from}→${params.to}`,
                tableName: params.docType.toLowerCase() + 's',
                recordId: String(params.docId),
                details: params.reason ?? null,
            },
        });
    } catch (e: any) {
        console.error('[document-state-machine] audit log failed:', e);
    }

    return result;
}

// ─── Convenience guards ──────────────────────────────────────────────

/**
 * Throws if the document cannot be reversed (must currently be POSTED).
 */
export function assertReversible(
    status: DocumentStatusValue | string,
    docType: DocumentTypeValue
): void {
    if (status !== 'posted') {
        throw new Error(`لا يمكن عكس ${docType} بحالة "${status}" — يجب أن يكون مرحّلاً (posted).`);
    }
    if (!canTransition(status, 'reversed', docType)) {
        throw new Error(`${docType} لا يدعم العكس (reversed).`);
    }
}

export const TRANSITIONS_TABLE = TRANSITIONS;
