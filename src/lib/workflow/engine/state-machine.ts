/**
 * State Machine Engine
 * Drives all document state transitions using DocumentStateMachine rules in DB
 * Pattern: docType + fromState + toState → validated + audited transition
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'workflow.engine.state-machine' });

export interface TransitionResult {
  success: boolean;
  newState: string;
  autoActions: AutoAction[];
}

export interface AutoAction {
  type: 'POST_JE' | 'SEND_EMAIL' | 'SEND_WHATSAPP' | 'NOTIFY_APPROVAL' | 'UPDATE_INVENTORY' | 'SUBMIT_ZATCA';
  params?: Record<string, unknown>;
}

export class StateMachineEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Execute a state transition with full validation and audit
   */
  async transition(params: {
    tenantId: string;
    docType: string;
    recordId: number;
    fromState: string;
    toState: string;
    action: string;
    userId: number;
    userRole?: string;
    tableName: string; // e.g. 'salesInvoice', 'purchaseOrder'
  }): Promise<TransitionResult> {
    const { tenantId, docType, recordId, fromState, toState, action, userId, userRole, tableName } = params;

    // 1. Load the rule from DB
    const rule = await this.prisma.documentStateMachine.findFirst({
      where: {
        tenantId,
        docType,
        fromState,
        toState,
        isActive: true,
      },
    });

    if (!rule) {
      // Try global (tenantId = 'default') rules as fallback
      const globalRule = await this.prisma.documentStateMachine.findFirst({
        where: { tenantId: 'default', docType, fromState, toState, isActive: true },
      });

      if (!globalRule) {
        throw new Error(`[StateMachine] Invalid transition: ${docType} ${fromState} → ${toState}`);
      }
    }

    const effectiveRule = rule ?? await this.prisma.documentStateMachine.findFirst({
      where: { tenantId: 'default', docType, fromState, toState, isActive: true },
    });

    // 2. Check required role
    if (effectiveRule?.requiredRole && userRole) {
      const allowedRoles = effectiveRule.requiredRole.split(',').map((r) => r.trim());
      if (!allowedRoles.includes(userRole) && !allowedRoles.includes('*')) {
        throw new Error(`[StateMachine] Role '${userRole}' cannot perform '${action}' on ${docType}`);
      }
    }

    // 3. Parse auto-actions
    let autoActions: AutoAction[] = [];
    if (effectiveRule?.autoActions) {
      try {
        autoActions = Array.isArray(effectiveRule.autoActions)
          ? (effectiveRule.autoActions as unknown as AutoAction[])
          : JSON.parse(String(effectiveRule.autoActions));
      } catch { autoActions = []; }
    }

    // 4. Log transition to AuditLog
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'STATE_TRANSITION',
        tableName: tableName,
        recordId: String(recordId),
        userId: userId,
        details: JSON.stringify({
          docType,
          fromState,
          toState,
          triggerAction: action,
          autoActions,
          transitionedAt: new Date(),
        }),
      },
    });

    return { success: true, newState: toState, autoActions };
  }

  /**
   * Get all valid transitions for a document in its current state
   */
  async getAvailableTransitions(tenantId: string, docType: string, currentState: string, userRole?: string): Promise<{
    action: string;
    toState: string;
    requiredRole: string | null;
  }[]> {
    const rules = await this.prisma.documentStateMachine.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: 'default' }],
        docType,
        fromState: currentState,
        isActive: true,
      },
      select: { action: true, toState: true, requiredRole: true },
      orderBy: { toState: 'asc' },
    });

    // Filter by role if provided
    return rules
      .filter((r) => {
        if (!r.requiredRole || !userRole) return true;
        const allowed = r.requiredRole.split(',').map((x) => x.trim());
        return allowed.includes(userRole) || allowed.includes('*');
      })
      .map((r) => ({ action: r.action, toState: r.toState, requiredRole: r.requiredRole }));
  }

  /**
   * Seed default state machine rules for core document types
   */
  async seedDefaultRules(tenantId: string): Promise<number> {
    const defaultRules = [
      // Sales Invoice
      { docType: 'SALES_INVOICE', fromState: 'draft', toState: 'posted', action: 'post', requiredRole: 'accountant,admin', autoActions: JSON.stringify([{ type: 'POST_JE' }, { type: 'SUBMIT_ZATCA' }, { type: 'UPDATE_INVENTORY' }]) },
      { docType: 'SALES_INVOICE', fromState: 'posted', toState: 'cancelled', action: 'cancel', requiredRole: 'admin', autoActions: JSON.stringify([{ type: 'POST_JE' }]) },
      // Purchase Order
      { docType: 'PURCHASE_ORDER', fromState: 'draft', toState: 'submitted', action: 'submit', requiredRole: 'purchaser,admin', autoActions: JSON.stringify([{ type: 'NOTIFY_APPROVAL' }]) },
      { docType: 'PURCHASE_ORDER', fromState: 'submitted', toState: 'approved', action: 'approve', requiredRole: 'manager,admin', autoActions: JSON.stringify([{ type: 'SEND_EMAIL' }]) },
      { docType: 'PURCHASE_ORDER', fromState: 'approved', toState: 'received', action: 'receive', requiredRole: 'warehouse,admin', autoActions: JSON.stringify([{ type: 'UPDATE_INVENTORY' }, { type: 'POST_JE' }]) },
      { docType: 'PURCHASE_ORDER', fromState: 'submitted', toState: 'rejected', action: 'reject', requiredRole: 'manager,admin', autoActions: JSON.stringify([{ type: 'SEND_EMAIL' }]) },
      // Journal Entry
      { docType: 'JOURNAL_ENTRY', fromState: 'draft', toState: 'posted', action: 'post', requiredRole: 'accountant,admin', autoActions: JSON.stringify([]) },
      { docType: 'JOURNAL_ENTRY', fromState: 'posted', toState: 'reversed', action: 'reverse', requiredRole: 'admin', autoActions: JSON.stringify([{ type: 'POST_JE' }]) },
      // Payment Voucher
      { docType: 'PAYMENT', fromState: 'draft', toState: 'approved', action: 'approve', requiredRole: 'manager,admin', autoActions: JSON.stringify([{ type: 'POST_JE' }]) },
      { docType: 'PAYMENT', fromState: 'approved', toState: 'paid', action: 'pay', requiredRole: 'treasurer,admin', autoActions: JSON.stringify([]) },
      // Leave Request
      { docType: 'LEAVE_REQUEST', fromState: 'pending', toState: 'approved', action: 'approve', requiredRole: 'manager,hr,admin', autoActions: JSON.stringify([{ type: 'SEND_EMAIL' }]) },
      { docType: 'LEAVE_REQUEST', fromState: 'pending', toState: 'rejected', action: 'reject', requiredRole: 'manager,hr,admin', autoActions: JSON.stringify([{ type: 'SEND_EMAIL' }]) },
      // Manufacturing Order
      { docType: 'MANUFACTURING_ORDER', fromState: 'planned', toState: 'in_progress', action: 'start', requiredRole: 'production,admin', autoActions: JSON.stringify([]) },
      { docType: 'MANUFACTURING_ORDER', fromState: 'in_progress', toState: 'completed', action: 'complete', requiredRole: 'production,admin', autoActions: JSON.stringify([{ type: 'UPDATE_INVENTORY' }, { type: 'POST_JE' }]) },
      // Purchase Invoice
      { docType: 'PURCHASE_INVOICE', fromState: 'draft', toState: 'posted', action: 'post', requiredRole: 'accountant,admin', autoActions: JSON.stringify([{ type: 'POST_JE' }]) },
      { docType: 'PURCHASE_INVOICE', fromState: 'posted', toState: 'paid', action: 'pay', requiredRole: 'accountant,treasurer,admin', autoActions: JSON.stringify([]) },
    ];

    let created = 0;
    for (const rule of defaultRules) {
      await this.prisma.documentStateMachine.upsert({
        where: { docType_fromState_toState: { docType: rule.docType, fromState: rule.fromState, toState: rule.toState } },
        update: { requiredRole: rule.requiredRole, autoActions: rule.autoActions, isActive: true },
        create: {
          tenantId,
          ...rule,
          isActive: true,
        },
      });
      created++;
    }

    return created;
  }
}

