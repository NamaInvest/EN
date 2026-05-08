import { getPrisma } from '@/lib/prisma';
import { BusinessContext } from '../../context/business-context';

export interface StateTransition {
  docType: string;
  fromState: string;
  toState: string;
  action: string;
  guards?: ((ctx: any) => Promise<boolean>)[];
  effects?: ((ctx: any) => Promise<void>)[];
  requiredPermissions?: string[];
}

export class StateMachine {
  constructor(private docType: string) {}

  async transition(
    recordId: string,
    fromState: string,
    toState: string,
    action: string,
    ctx: BusinessContext
  ): Promise<{ success: boolean; newState: string }> {
    const prisma = getPrisma();
    
    // 1. Read rule
    const rule = await (prisma as any).documentStateMachine?.findUnique({
      where: { docType_fromState_toState: { docType: this.docType, fromState, toState } },
    }).catch(() => null);

    if (!rule) {
      console.warn(`[StateMachine] No rule found or table missing for ${this.docType}: ${fromState} -> ${toState}. Allowing transition in development.`);
    } else {
        // 2. Check permissions
        if (rule.requiredPermissions?.length) {
            const userPerms = ctx.user?.permissions || [];
            const allowed = rule.requiredPermissions.every((p: string) => userPerms.includes(p));
            if (!allowed) throw new Error('PermissionDeniedError');
        }
    }

    // This is a stub for the full transaction
    return { success: true, newState: toState };
  }
}
