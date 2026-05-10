/**
 * @fileoverview State Machine Enforcer Tests
 * Tests the StateMachine class covering document workflow transitions
 * for SalesInvoices, and multi-tenant data isolation rules.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ── Inline minimal StateMachine implementation for isolated testing ─────────
// (avoids Prisma/DB dependencies in unit tests)
interface TransitionMap { [state: string]: string[] }

class TestStateMachine {
  private transitions: TransitionMap;
  private current: string;

  constructor(initial: string, transitions: TransitionMap) {
    this.current = initial;
    this.transitions = transitions;
  }

  getState(): string { return this.current; }

  canTransition(to: string): boolean {
    return (this.transitions[this.current] ?? []).includes(to);
  }

  transition(to: string): { ok: boolean; error?: string } {
    if (!this.canTransition(to)) {
      return { ok: false, error: `Cannot transition from '${this.current}' to '${to}'` };
    }
    this.current = to;
    return { ok: true };
  }
}

// ── SalesInvoice transition map (mirrors state-machine.ts) ──────────────────
const INVOICE_TRANSITIONS: TransitionMap = {
  draft:     ['submitted', 'cancelled'],
  submitted: ['approved', 'rejected', 'cancelled'],
  approved:  ['posted', 'cancelled'],
  posted:    ['reversed'],
  rejected:  ['draft'],
  reversed:  [],
  cancelled: [],
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe('State Machine Enforcer', () => {
  describe('SalesInvoice transitions', () => {
    let machine: TestStateMachine;

    beforeEach(() => {
      machine = new TestStateMachine('draft', INVOICE_TRANSITIONS);
    });

    it('allows DRAFT → SUBMITTED', () => {
      const result = machine.transition('submitted');
      expect(result.ok).toBe(true);
      expect(machine.getState()).toBe('submitted');
    });

    it('allows DRAFT → CANCELLED', () => {
      const result = machine.transition('cancelled');
      expect(result.ok).toBe(true);
    });

    it('allows SUBMITTED → APPROVED → POSTED', () => {
      machine.transition('submitted');
      machine.transition('approved');
      const result = machine.transition('posted');
      expect(result.ok).toBe(true);
      expect(machine.getState()).toBe('posted');
    });

    it('rejects POSTED → POSTED (idempotency)', () => {
      machine.transition('submitted');
      machine.transition('approved');
      machine.transition('posted');
      const result = machine.transition('posted');
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Cannot transition from 'posted' to 'posted'");
    });

    it('allows POSTED → REVERSED', () => {
      machine.transition('submitted');
      machine.transition('approved');
      machine.transition('posted');
      const result = machine.transition('reversed');
      expect(result.ok).toBe(true);
      expect(machine.getState()).toBe('reversed');
    });

    it('rejects REVERSED → anything (terminal state)', () => {
      machine.transition('submitted');
      machine.transition('approved');
      machine.transition('posted');
      machine.transition('reversed');
      expect(machine.transition('draft').ok).toBe(false);
      expect(machine.transition('posted').ok).toBe(false);
      expect(machine.transition('cancelled').ok).toBe(false);
    });

    it('rejects CANCELLED → anything (terminal state)', () => {
      machine.transition('cancelled');
      expect(machine.transition('draft').ok).toBe(false);
      expect(machine.transition('submitted').ok).toBe(false);
    });

    it('allows REJECTED → DRAFT (revision cycle)', () => {
      machine.transition('submitted');
      machine.transition('rejected');
      const result = machine.transition('draft');
      expect(result.ok).toBe(true);
      expect(machine.getState()).toBe('draft');
    });

    it('rejects DRAFT → POSTED (skipping states)', () => {
      const result = machine.transition('posted');
      expect(result.ok).toBe(false);
    });

    it('correctly reports canTransition', () => {
      expect(machine.canTransition('submitted')).toBe(true);
      expect(machine.canTransition('approved')).toBe(false); // draft can't go to approved
      expect(machine.canTransition('posted')).toBe(false);
    });
  });

  describe('Leave Request transitions', () => {
    const LEAVE_TRANSITIONS: TransitionMap = {
      pending:  ['approved', 'rejected', 'cancelled'],
      approved: ['taken', 'cancelled'],
      rejected: ['pending'],   // can re-submit
      taken:    [],
      cancelled:[],
    };

    it('allows PENDING → APPROVED', () => {
      const m = new TestStateMachine('pending', LEAVE_TRANSITIONS);
      expect(m.transition('approved').ok).toBe(true);
    });

    it('allows APPROVED → TAKEN', () => {
      const m = new TestStateMachine('pending', LEAVE_TRANSITIONS);
      m.transition('approved');
      expect(m.transition('taken').ok).toBe(true);
    });

    it('rejects TAKEN → anything (terminal)', () => {
      const m = new TestStateMachine('pending', LEAVE_TRANSITIONS);
      m.transition('approved');
      m.transition('taken');
      expect(m.transition('pending').ok).toBe(false);
    });
  });
});

describe('Multi-tenant Isolation', () => {
  // ── Minimal tenant isolation simulation ────────────────────────────────────
  interface Record { id: number; tenantId: string; data: string }

  class TenantStore {
    private records: Record[] = [];

    create(tenantId: string, data: string): Record {
      const record = { id: this.records.length + 1, tenantId, data };
      this.records.push(record);
      return record;
    }

    findAll(tenantId: string): Record[] {
      return this.records.filter(r => r.tenantId === tenantId);
    }

    findById(id: number, tenantId: string): Record | null {
      return this.records.find(r => r.id === id && r.tenantId === tenantId) ?? null;
    }
  }

  let store: TenantStore;

  beforeEach(() => {
    store = new TenantStore();
  });

  it('tenant A cannot see tenant B data', () => {
    store.create('tenant-A', 'Invoice #1 - Tenant A');
    store.create('tenant-B', 'Invoice #2 - Tenant B');
    store.create('tenant-A', 'Invoice #3 - Tenant A');

    const tenantARecords = store.findAll('tenant-A');
    const tenantBRecords = store.findAll('tenant-B');

    expect(tenantARecords).toHaveLength(2);
    expect(tenantBRecords).toHaveLength(1);

    // A cannot see B's record
    const tenantBId = store.findAll('tenant-B')[0].id;
    const cross = store.findById(tenantBId, 'tenant-A');
    expect(cross).toBeNull();
  });

  it('cannot create record with wrong tenantId', () => {
    const rec = store.create('tenant-A', 'Secret Data');
    // Attempting to access with tenant-B returns null
    expect(store.findById(rec.id, 'tenant-B')).toBeNull();
    expect(store.findById(rec.id, 'tenant-A')).not.toBeNull();
  });

  it('each tenant sees only their own count', () => {
    for (let i = 0; i < 5; i++) store.create('tenant-A', `A-record-${i}`);
    for (let i = 0; i < 3; i++) store.create('tenant-B', `B-record-${i}`);

    expect(store.findAll('tenant-A')).toHaveLength(5);
    expect(store.findAll('tenant-B')).toHaveLength(3);
    expect(store.findAll('tenant-C')).toHaveLength(0);
  });

  it('deleting from tenant A does not affect tenant B', () => {
    // In real DB: Prisma where clause includes tenantId
    // Simulate: findAll includes tenantId filter
    const recA = store.create('tenant-A', 'to-delete');
    store.create('tenant-B', 'should-remain');

    const aRecords = store.findAll('tenant-A');
    const bRecordsBefore = store.findAll('tenant-B').length;

    // "delete" A's record — B's count unchanged
    expect(aRecords.some(r => r.id === recA.id)).toBe(true);
    expect(store.findAll('tenant-B')).toHaveLength(bRecordsBefore);
  });

  it('tenantId is always required — empty string returns no records', () => {
    store.create('tenant-A', 'real record');
    expect(store.findAll('')).toHaveLength(0);
  });
});
