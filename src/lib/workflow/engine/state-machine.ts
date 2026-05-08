import { PrismaClient } from '@prisma/client';
import { BusinessContext } from '@/services/shared/event-bus.service';

export interface StateTransitionRule {
  docType: string;
  fromState: string;
  toState: string;
  action: string;
  guards?: ((ctx: BusinessContext) => Promise<boolean>)[];
  effects?: ((ctx: BusinessContext) => Promise<void>)[];
  requiredPermissions?: string[];
}

export class InvalidTransitionError extends Error {
  constructor(docType: string, fromState: string, toState: string) {
    super(`Invalid transition for ${docType}: ${fromState} -> ${toState}`);
    this.name = 'InvalidTransitionError';
  }
}

export class PermissionDeniedError extends Error {
  constructor() {
    super('Permission denied for this state transition');
    this.name = 'PermissionDeniedError';
  }
}

export class GuardFailedError extends Error {
  constructor(action: string) {
    super(`Guard failed for action: ${action}`);
    this.name = 'GuardFailedError';
  }
}

export interface TransitionResult {
  success: boolean;
  newState: string;
}

export class StateMachine {
  constructor(
    private docType: string,
    private prisma: PrismaClient
  ) {}

  /**
   * Performs a transition ensuring permissions, guards, and DB audit rules.
   */
  async transition(
    recordId: string,
    fromState: string,
    toState: string,
    action: string,
    ctx: BusinessContext,
    ruleOverrides?: Partial<StateTransitionRule>
  ): Promise<TransitionResult> {
    
    // In a full implementation, we might read from DocumentStateMachine DB model.
    // Here we use the ruleOverrides to supply guards and effects.
    const rule: StateTransitionRule = {
      docType: this.docType,
      fromState,
      toState,
      action,
      ...ruleOverrides
    };

    // 1. Validate Permissions
    if (rule.requiredPermissions && rule.requiredPermissions.length > 0) {
      try {
        for (const perm of rule.requiredPermissions) {
          ctx.requirePermission(perm);
        }
      } catch (err) {
        throw new PermissionDeniedError();
      }
    }

    // 2. Execute Guards
    if (rule.guards) {
      for (const guard of rule.guards) {
        const passed = await guard(ctx);
        if (!passed) throw new GuardFailedError(action);
      }
    }

    // 3. Execute Transition Transaction
    return await this.prisma.$transaction(async (tx: any) => {
      // Update record state dynamically
      // Note: This relies on the model having a 'status' field.
      // @ts-ignore
      if (tx[this.docType]) {
        // @ts-ignore
        await tx[this.docType].update({
          where: { id: parseInt(recordId) || recordId }, // Handle string or int IDs
          data: { status: toState },
        });
      }

      // Log to unified AuditLog
      await tx.auditLog.create({
        data: {
          userId: ctx.user.id !== 'anonymous' ? parseInt(ctx.user.id) : 0,
          action: `TRANSITION_${action.toUpperCase()}`,
          tableName: this.docType,
          recordId: String(recordId),
          details: JSON.stringify({
            fromState,
            toState,
            docType: this.docType
          }),
        },
      });

      // 4. Execute Effects
      if (rule.effects) {
        for (const effect of rule.effects) {
          await effect(ctx);
        }
      }

      return { success: true, newState: toState };
    });
  }
}
