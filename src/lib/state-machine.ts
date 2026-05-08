/**
 * State Machine Engine
 * ──────────────────────────────────────────────────────────
 * Generic finite state machine for ERP document workflows.
 * Supports: Invoices, Purchase Orders, Leave Requests, Journal Entries.
 *
 * Usage:
 *   const machine = StateMachine.create('invoice', {
 *     initial: 'draft',
 *     transitions: {
 *       draft:     ['submitted', 'cancelled'],
 *       submitted: ['approved', 'rejected', 'cancelled'],
 *       approved:  ['posted', 'cancelled'],
 *       posted:    ['reversed'],
 *       rejected:  ['draft'],
 *       reversed:  [],
 *       cancelled: [],
 *     },
 *     hooks: {
 *       onEnter: { approved: async (ctx) => sendNotification(ctx) },
 *       onExit:  { draft: async (ctx) => validateFields(ctx) },
 *     }
 *   });
 *
 *   await machine.transition(doc, 'submitted', { userId: 1 });
 */

import { logger } from '@/lib/logger';

const log = logger.child({ route: 'StateMachine' });

export interface TransitionContext {
  documentId: number;
  documentType: string;
  fromState: string;
  toState: string;
  userId?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

interface StateHooks {
  onEnter?: Record<string, (ctx: TransitionContext) => Promise<void>>;
  onExit?: Record<string, (ctx: TransitionContext) => Promise<void>>;
  onTransition?: (ctx: TransitionContext) => Promise<void>;
  guard?: Record<string, (ctx: TransitionContext) => Promise<boolean>>;
}

interface MachineConfig {
  initial: string;
  transitions: Record<string, string[]>;
  hooks?: StateHooks;
}

export class StateMachine {
  private name: string;
  private config: MachineConfig;

  private constructor(name: string, config: MachineConfig) {
    this.name = name;
    this.config = config;
  }

  static create(name: string, config: MachineConfig): StateMachine {
    return new StateMachine(name, config);
  }

  /** Get allowed next states from current state */
  getAllowedTransitions(currentState: string): string[] {
    return this.config.transitions[currentState] || [];
  }

  /** Check if transition is valid */
  canTransition(currentState: string, targetState: string): boolean {
    const allowed = this.getAllowedTransitions(currentState);
    return allowed.includes(targetState);
  }

  /** Execute a state transition with hooks */
  async transition(
    document: { id: number; status: string },
    targetState: string,
    options: { userId?: number; metadata?: Record<string, unknown> } = {}
  ): Promise<TransitionContext> {
    const currentState = document.status;

    // Validate transition
    if (!this.canTransition(currentState, targetState)) {
      const allowed = this.getAllowedTransitions(currentState);
      throw new Error(
        `انتقال غير صالح: ${currentState} → ${targetState}. المسموح: [${allowed.join(', ')}]`
      );
    }

    const ctx: TransitionContext = {
      documentId: document.id,
      documentType: this.name,
      fromState: currentState,
      toState: targetState,
      userId: options.userId,
      metadata: options.metadata,
      timestamp: new Date(),
    };

    // Guard check
    if (this.config.hooks?.guard?.[targetState]) {
      const allowed = await this.config.hooks.guard[targetState](ctx);
      if (!allowed) {
        throw new Error(`شرط الحراسة رفض الانتقال إلى ${targetState}`);
      }
    }

    // onExit hook
    if (this.config.hooks?.onExit?.[currentState]) {
      await this.config.hooks.onExit[currentState](ctx);
    }

    // onEnter hook
    if (this.config.hooks?.onEnter?.[targetState]) {
      await this.config.hooks.onEnter[targetState](ctx);
    }

    // Global transition hook
    if (this.config.hooks?.onTransition) {
      await this.config.hooks.onTransition(ctx);
    }

    log.info(`${this.name} #${document.id}: ${currentState} → ${targetState}`, {
      userId: options.userId,
    });

    return ctx;
  }

  /** Get initial state */
  get initialState(): string {
    return this.config.initial;
  }

  /** Get all states */
  get states(): string[] {
    return Object.keys(this.config.transitions);
  }

  /** Get machine diagram (for debugging/visualization) */
  describe(): Record<string, string[]> {
    return { ...this.config.transitions };
  }
}

// ── Pre-built Machines ──────────────────────────────────

export const InvoiceMachine = StateMachine.create('invoice', {
  initial: 'draft',
  transitions: {
    draft: ['submitted', 'cancelled'],
    submitted: ['approved', 'rejected', 'cancelled'],
    approved: ['posted', 'cancelled'],
    posted: ['reversed'],
    rejected: ['draft'],
    reversed: [],
    cancelled: [],
  },
});

export const PurchaseOrderMachine = StateMachine.create('purchase_order', {
  initial: 'draft',
  transitions: {
    draft: ['submitted', 'cancelled'],
    submitted: ['approved', 'rejected'],
    approved: ['ordered', 'cancelled'],
    ordered: ['partially_received', 'received', 'cancelled'],
    partially_received: ['received', 'cancelled'],
    received: ['invoiced'],
    invoiced: ['paid', 'disputed'],
    paid: [],
    rejected: ['draft'],
    disputed: ['invoiced', 'cancelled'],
    cancelled: [],
  },
});

export const LeaveRequestMachine = StateMachine.create('leave_request', {
  initial: 'pending',
  transitions: {
    pending: ['approved', 'rejected'],
    approved: ['cancelled'],
    rejected: [],
    cancelled: [],
  },
});

export const JournalMachine = StateMachine.create('journal_entry', {
  initial: 'draft',
  transitions: {
    draft: ['pending_approval', 'posted', 'cancelled'],
    pending_approval: ['posted', 'rejected'],
    posted: ['reversed'],
    rejected: ['draft'],
    reversed: [],
    cancelled: [],
  },
});
