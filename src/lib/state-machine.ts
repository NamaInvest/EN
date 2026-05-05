import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type BaseState = 'DRAFT' | 'SUBMITTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'POSTED' | 'PAID' | 'PARTIAL_PAID' | 'CANCELLED' | 'REVERSED' | 'ACTIVE' | 'INACTIVE';

export interface TransitionContext {
    userId?: number;
    reason?: string;
    [key: string]: any;
}

export class StateMachine<T extends string> {
    private transitions: Record<T, T[]>;
    public entityType: string;

    constructor(entityType: string, transitions: Record<T, T[]>) {
        this.entityType = entityType;
        this.transitions = transitions;
    }

    public getValidTransitions(currentState: T): T[] {
        return this.transitions[currentState] || [];
    }

    public canTransition(currentState: T, targetState: T): boolean {
        const allowed = this.getValidTransitions(currentState);
        return allowed.includes(targetState);
    }

    public async transition(
        entityId: number,
        currentState: T,
        targetState: T,
        context: TransitionContext = {}
    ): Promise<boolean> {
        if (!this.canTransition(currentState, targetState)) {
            throw new Error(`Invalid state transition for ${this.entityType}: ${currentState} -> ${targetState}`);
        }

        // Post-validation: Cannot delete a POSTED document, etc.
        // This is handled upstream (where the actual delete happens), but we can add hooks here if needed.

        await prisma.documentStateLog.create({
            data: {
                entityType: this.entityType,
                entityId,
                fromState: currentState,
                toState: targetState,
                userId: context.userId || null,
                reason: context.reason || null,
            }
        });

        return true;
    }
}

// ----------------------------------------------------
// Entity Specific State Machines
// ----------------------------------------------------

export const InvoiceStateMachine = new StateMachine<BaseState>('INVOICE', {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['APPROVED', 'REJECTED', 'DRAFT'],
    PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
    APPROVED: ['POSTED', 'CANCELLED'],
    POSTED: ['PAID', 'PARTIAL_PAID', 'REVERSED'], // Cannot delete
    PAID: ['REVERSED'],
    PARTIAL_PAID: ['PAID', 'REVERSED'],
    REJECTED: ['DRAFT', 'CANCELLED'],
    CANCELLED: [],
    REVERSED: [],
    ACTIVE: [],
    INACTIVE: []
});

export const JournalEntryStateMachine = new StateMachine<BaseState>('JOURNAL_ENTRY', {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['APPROVED', 'REJECTED'],
    PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
    APPROVED: ['POSTED', 'CANCELLED'],
    POSTED: ['REVERSED'], // Cannot delete
    REJECTED: ['DRAFT', 'CANCELLED'],
    CANCELLED: [],
    REVERSED: [],
    PAID: [],
    PARTIAL_PAID: [],
    ACTIVE: [],
    INACTIVE: []
});

export const PurchaseOrderStateMachine = new StateMachine<BaseState>('PURCHASE_ORDER', {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['APPROVED', 'REJECTED'],
    PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
    APPROVED: ['POSTED', 'CANCELLED'],
    POSTED: ['CANCELLED', 'REVERSED'],
    REJECTED: ['DRAFT', 'CANCELLED'],
    CANCELLED: [],
    REVERSED: [],
    PAID: [],
    PARTIAL_PAID: [],
    ACTIVE: [],
    INACTIVE: []
});

export const GRNStateMachine = new StateMachine<BaseState>('GRN', {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['APPROVED', 'REJECTED'],
    PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
    APPROVED: ['POSTED', 'CANCELLED'],
    POSTED: ['REVERSED'],
    REJECTED: ['DRAFT', 'CANCELLED'],
    CANCELLED: [],
    REVERSED: [],
    PAID: [],
    PARTIAL_PAID: [],
    ACTIVE: [],
    INACTIVE: []
});

// Used for simpler entities like Customer/Vendor/Employee
export const MasterDataStateMachine = new StateMachine<BaseState>('MASTER_DATA', {
    DRAFT: ['ACTIVE'],
    ACTIVE: ['INACTIVE'],
    INACTIVE: ['ACTIVE'],
    SUBMITTED: [],
    PENDING_APPROVAL: [],
    APPROVED: [],
    REJECTED: [],
    POSTED: [],
    PAID: [],
    PARTIAL_PAID: [],
    CANCELLED: [],
    REVERSED: []
});

export function getStateMachineFor(entityType: string): StateMachine<BaseState> {
    switch (entityType) {
        case 'INVOICE': return InvoiceStateMachine;
        case 'JOURNAL_ENTRY': return JournalEntryStateMachine;
        case 'PO':
        case 'PURCHASE_ORDER': return PurchaseOrderStateMachine;
        case 'GRN': return GRNStateMachine;
        case 'CUSTOMER':
        case 'VENDOR':
        case 'EMPLOYEE':
        case 'ASSET':
            return MasterDataStateMachine;
        default:
            throw new Error(`No state machine defined for entity: ${entityType}`);
    }
}

// Force TS re-evaluation
