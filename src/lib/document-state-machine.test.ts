/**
 * Unit tests for Document State Machine
 * Pure logic — no DB needed for canTransition/nextStates/assertEditable.
 */

import {

    canTransition,
    nextStates,
    isTerminal,
    assertEditable,
    assertReversible,
    DocumentStatus,
    DocumentType,
} from './document-state-machine';

describe('canTransition', () => {
    it('allows draft → posted for JournalEntry', () => {
        expect(canTransition('draft', 'posted', 'JournalEntry')).toBe(true);
    });

    it('forbids draft → reversed for JournalEntry (must be posted first)', () => {
        expect(canTransition('draft', 'reversed', 'JournalEntry')).toBe(false);
    });

    it('forbids edits to posted invoices except reversal/fulfillment', () => {
        expect(canTransition('posted', 'draft', 'SalesInvoice')).toBe(false);
        expect(canTransition('posted', 'reversed', 'SalesInvoice')).toBe(true);
        expect(canTransition('posted', 'fulfilled', 'SalesInvoice')).toBe(true);
    });

    it('forbids any transition out of cancelled', () => {
        expect(canTransition('cancelled', 'draft', 'PurchaseOrder')).toBe(false);
        expect(canTransition('cancelled', 'posted', 'PurchaseOrder')).toBe(false);
    });

    it('returns false for unknown document type', () => {
        expect(canTransition('draft', 'posted', 'Foo' as any)).toBe(false);
    });

    it('returns false for unknown from-state', () => {
        expect(canTransition('weird_state', 'posted', 'JournalEntry')).toBe(false);
    });

    it('matches manufacturing order lifecycle', () => {
        expect(canTransition('draft', 'in_progress', 'ManufacturingOrder')).toBe(true);
        expect(canTransition('in_progress', 'completed', 'ManufacturingOrder')).toBe(true);
        expect(canTransition('completed', 'reversed', 'ManufacturingOrder')).toBe(true);
        expect(canTransition('draft', 'completed', 'ManufacturingOrder')).toBe(false);
    });
});

describe('nextStates', () => {
    it('lists draft → [pending_approval, posted, cancelled] for JE', () => {
        expect(nextStates('draft', 'JournalEntry').sort()).toEqual(
            ['cancelled', 'pending_approval', 'posted'].sort()
        );
    });

    it('returns [] for terminal cancelled state', () => {
        expect(nextStates('cancelled', 'PurchaseOrder')).toEqual([]);
    });
});

describe('isTerminal', () => {
    it('flags posted/reversed/cancelled/fulfilled/completed as terminal', () => {
        expect(isTerminal('posted')).toBe(true);
        expect(isTerminal('reversed')).toBe(true);
        expect(isTerminal('cancelled')).toBe(true);
        expect(isTerminal('fulfilled')).toBe(true);
        expect(isTerminal('completed')).toBe(true);
    });

    it('flags draft/pending/approved/in_progress as non-terminal', () => {
        expect(isTerminal('draft')).toBe(false);
        expect(isTerminal('pending_approval')).toBe(false);
        expect(isTerminal('approved')).toBe(false);
        expect(isTerminal('in_progress')).toBe(false);
    });
});

describe('assertEditable', () => {
    it('passes for draft/pending', () => {
        expect(() => assertEditable('draft', 'SalesInvoice')).not.toThrow();
        expect(() => assertEditable('pending_approval', 'SalesInvoice')).not.toThrow();
    });

    it('throws for posted', () => {
        expect(() => assertEditable('posted', 'SalesInvoice')).toThrow(/لا يمكن تعديل/);
    });

    it('throws for reversed/cancelled/fulfilled', () => {
        expect(() => assertEditable('reversed', 'JournalEntry')).toThrow();
        expect(() => assertEditable('cancelled', 'PurchaseOrder')).toThrow();
        expect(() => assertEditable('fulfilled', 'SalesOrder')).toThrow();
    });
});

describe('assertReversible', () => {
    it('passes for posted SalesInvoice', () => {
        expect(() => assertReversible('posted', 'SalesInvoice')).not.toThrow();
    });

    it('throws when not posted', () => {
        expect(() => assertReversible('draft', 'JournalEntry')).toThrow(/يجب أن يكون مرحّلاً/);
        expect(() => assertReversible('approved', 'SalesInvoice')).toThrow();
    });
});

describe('DocumentStatus / DocumentType const objects', () => {
    it('exposes expected enum-like keys', () => {
        expect(DocumentStatus.DRAFT).toBe('draft');
        expect(DocumentStatus.POSTED).toBe('posted');
        expect(DocumentType.JOURNAL_ENTRY).toBe('JournalEntry');
        expect(DocumentType.MANUFACTURING_ORDER).toBe('ManufacturingOrder');
    });
});
